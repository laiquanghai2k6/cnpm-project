import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone, RecordMetadata, ScoredPineconeRecord } from '@pinecone-database/pinecone';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;
  private pinecone: Pinecone;

  constructor(private configService: ConfigService,
  ) {

    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY')!,
    );

    this.pinecone = new Pinecone({
      apiKey: this.configService.get<string>('PINECONE_API_KEY')!,
    });
  }

  async *askStream(userMessage: string, history: any[] = []) {
    try {
      let geminiHistory = history.map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user', 
        parts: [{ text: msg.text }]
      }));

      // 🔥 BƯỚC 1.5: "Làm sạch" lịch sử theo luật khắt khe của Gemini
      // Luật 1: Lịch sử KHÔNG ĐƯỢC bắt đầu bằng 'model' (Xóa câu chào mặc định)
      while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
        geminiHistory.shift(); // Cắt bỏ phần tử đầu tiên
      }
      
      // Luật 2: Lịch sử phải đi theo cặp chẵn (user rồi đến model). Nếu mảng bị lẻ, ta cắt bỏ tin cũ nhất.
      if (geminiHistory.length % 2 !== 0) {
        geminiHistory.shift(); 
      }
      const recentHistory = geminiHistory.slice(-2);
      let searchQuery = userMessage;

      // --- CẤP ĐỘ 1: BỎ QUA REWRITE NHỜ REGEX ---
      const chatOnlyKeywords = /^(hi|hello|chào|xin chào|cảm ơn|thanks|tôi ghét bạn|ok|dạ|vâng|bye|tạm biệt)$/i;
      
      if (chatOnlyKeywords.test(userMessage.trim())) {
        searchQuery = "CHAT_ONLY";
      } else if (recentHistory.length > 0) {
        const historyText = recentHistory
          .map(h => `${h.role === 'user' ? 'Khách' : 'Bot'}: ${h.parts[0]?.text}`)
          .join('\n');

        const rewritePrompt = `Dựa vào đoạn hội thoại:
${historyText}
Câu hỏi gốc: "${userMessage}"
Viết lại thành 1 câu tìm kiếm sản phẩm. Nếu là câu tán gẫu không liên quan mua sắm, trả về "CHAT_ONLY".`;

        const searchModel = this.genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        const rewriteResult = await searchModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: rewritePrompt }] }],
          generationConfig: { maxOutputTokens: 30 }
        });
        searchQuery = rewriteResult.response.text().trim();
      }

      // --- TÌM KIẾM PINECONE ---
      let finalContext = "Không cần thông tin sản phẩm, hãy trả lời giao tiếp thông thường.";
      let validMatches:ScoredPineconeRecord<RecordMetadata>[] = [];

      if (searchQuery !== "CHAT_ONLY") {
        const embedResult = await this.genAI.getGenerativeModel({ model: "gemini-embedding-2" })
          .embedContent(searchQuery);

        const queryResponse = await this.pinecone.Index('products-index').query({
          vector: embedResult.embedding.values,
          topK: 5,
          includeMetadata: true,
        });

        validMatches = queryResponse.matches.filter(match => (match.score || 0) > 0.6);
        const context = validMatches
          .map(m => `- Tên: ${m.metadata?.name} | Giá: ${m.metadata?.price}đ | Mô tả: ${m.metadata?.description}`)
          .join('\n');

        if (context.trim() !== '') finalContext = context;
      }

      // --- CẤP ĐỘ 2: TRẢ LỜI NGƯỜI DÙNG BẰNG STREAMING ---
      const chatModel = this.genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
        systemInstruction: `Bạn là trợ lý bán hàng. RẤT NGẮN GỌN.
        Nếu liệt kê sản phẩm, BẮT BUỘC dùng gạch đầu dòng và bôi đậm chính xác Tên sản phẩm.
        DỮ LIỆU: ${finalContext}`
      });

      const chat = chatModel.startChat({ history: recentHistory });
      
      // Dùng sendMessageStream thay vì sendMessage
      const result = await chat.sendMessageStream(userMessage);
      
      let fullAnswerText = "";

      // Vòng lặp bắn từng chữ về cho Client
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullAnswerText += chunkText; // Lưu lại để tí nữa so khớp tên sản phẩm
        
        // Bắn chunk text ra ngoài
        yield { type: 'text', data: chunkText };
      }

      // --- LỌC SOURCES (Trick cũ đã áp dụng) ---
      const finalSources = validMatches.filter(match => {
        const productName = match.metadata?.name;
        return productName && fullAnswerText.includes(productName as string);
      });

      // Bắn sources ra ngoài ở cuối luồng
      yield { type: 'sources', data: finalSources.map(m => ({ id: m.id, ...m.metadata })) };

    } catch (error) {
      console.error('Lỗi Chat Stream:', error);
      yield { type: 'error', data: 'Có lỗi xảy ra khi xử lý.' };
    }
  }
}