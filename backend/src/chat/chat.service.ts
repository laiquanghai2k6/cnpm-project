import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { Pinecone, RecordMetadata, ScoredPineconeRecord } from '@pinecone-database/pinecone';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;
  private pinecone: Pinecone;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService
  ) {

    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY')!,
    );

    this.pinecone = new Pinecone({
      apiKey: this.configService.get<string>('PINECONE_API_KEY')!,
    });
  }

  async *askStream(userMessage: string, history: any[] = [], userId: string | null = null) {
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

      // --- CẤP ĐỘ 2: TRẢ LỜI NGƯỜI DÙNG BẰNG STREAMING (HỖ TRỢ FUNCTION CALLING) ---
      const getOrderHistoryTool: FunctionDeclaration = {
        name: 'get_my_orders',
        description: 'Lấy lịch sử đơn hàng của người dùng hiện tại trong một số ngày. Gọi khi người dùng hỏi về đơn hàng, tổng tiền, mua gì.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            days: {
              type: SchemaType.INTEGER,
              description: 'Số ngày muốn xem lại lịch sử (vd: 3, 7). Mặc định là 30.',
            },
          },
          required: ['days'],
        },
      };

      const chatModel = this.genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
        tools: userId ? [{ functionDeclarations: [getOrderHistoryTool] }] : undefined,
        systemInstruction: `Bạn là trợ lý bán hàng. RẤT NGẮN GỌN.
        Nếu liệt kê sản phẩm, BẮT BUỘC dùng gạch đầu dòng và bôi đậm chính xác Tên sản phẩm.
        QUAN TRỌNG: Bạn CÓ QUYỀN truy cập đơn hàng của khách bằng công cụ get_my_orders. Không bao giờ được nói là bạn không có quyền!
        THÔNG TIN SẢN PHẨM (từ dữ liệu cửa hàng, không phải đơn hàng của khách): ${finalContext}`
      });

      const chat = chatModel.startChat({ history: recentHistory });
      
      const result = await chat.sendMessageStream(userMessage);
      
      let fullAnswerText = "";
      let functionCallInfo: any = null;
      let hasFunctionCall = false;

      // Vòng lặp bắn từng chữ về cho Client
      for await (const chunk of result.stream) {
        const calls = chunk.functionCalls();
        if (calls && calls.length > 0) {
          hasFunctionCall = true;
          functionCallInfo = calls[0];
          // KHÔNG dùng break ở đây để SDK có thời gian nạp đủ history
        } else {
          try {
            const chunkText = chunk.text();
            fullAnswerText += chunkText;
            yield { type: 'text', data: chunkText };
          } catch(e) {}
        }
      }

      // QUAN TRỌNG: Phải await result.response để Gemini SDK ghi đè lượt functionCall vào chat.history
      // Nếu không có dòng này, SDK sẽ ném lỗi 400 Bad Request
      try {
        await result.response;
      } catch (err) {
        this.logger.error("Lỗi khi await result.response:", err);
      }

      // Xử lý Function Call sau khi stream đầu tiên đã hoàn tất
      if (hasFunctionCall && functionCallInfo && functionCallInfo.name === 'get_my_orders' && userId) {
        const args = functionCallInfo.args as any;
        const days = args.days as number || 30;
        const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        
        // QUERY SUPABASE LẤY ĐƠN HÀNG
        const { data: orders } = await this.supabaseService.getClient().from('orders')
          .select('*, order_items(*, products(name, price))')
          .eq('user_id', userId)
          .gte('created_at', dateThreshold);

        // KHỞI TẠO LẠI CHAT ĐỂ ĐẢM BẢO HISTORY CHUẨN XÁC 100% (TRÁNH LỖI 400 CỦA SDK)
        const historyForFunction = [
          ...recentHistory,
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: [{ functionCall: functionCallInfo }] }
        ];

        const chatForFunction = chatModel.startChat({ history: historyForFunction });

        // PHẢN HỒI LẠI KẾT QUẢ CHO GEMINI ĐỂ NÓ DỊCH RA TEXT
        const fnResult = await chatForFunction.sendMessageStream([{
          functionResponse: {
            name: 'get_my_orders',
            response: { orders: orders || [] }
          }
        }]);

        // STREAM CÂU TRẢ LỜI CỦA GEMINI VỀ CHO CLIENT
        for await (const fnChunk of fnResult.stream) {
          try {
            const text = fnChunk.text();
            fullAnswerText += text;
            yield { type: 'text', data: text };
          } catch(e) {}
        }
      }

      // --- LỌC SOURCES (NẾU KHÔNG GỌI HÀM) ---
      if (!hasFunctionCall) {
        const finalSources = validMatches.filter(match => {
          const productName = match.metadata?.name;
          return productName && fullAnswerText.includes(productName as string);
        });

        if (finalSources.length > 0) {
          yield { type: 'sources', data: finalSources.map(m => ({ id: m.id, ...m.metadata })) };
        }
      }

    } catch (error) {
      this.logger.error(`Lỗi Chat Stream: ${error.message}`, error);
      yield { type: 'error', data: 'Có lỗi xảy ra khi xử lý.' };
    }
  }
}