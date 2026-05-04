'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
// Định nghĩa thêm Source cho sản phẩm
interface Source {
  id: string;
  name?: string;
  price?: number | string;
  image_url?: string;
  description?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: Source[]; // Thêm mảng sources chứa thông tin sản phẩm
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hàm format tiền tệ
  const formatPrice = (price: any) => {
    if (!price) return 'Liên hệ';
    const num = Number(price);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // 1. Hiển thị tin nhắn của User ngay lập tức
    const newUserMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessage,
      timestamp: new Date(),
    };

    // Thêm : Message vào đây
    const botMsgId = (Date.now() + 1).toString();
    const emptyBotMsg: Message = {
      id: botMsgId,
      sender: 'bot',
      text: '',
      sources: [],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg, emptyBotMsg]);
    setIsLoading(true);

    try {
      // 3. Gọi API bằng fetch để có thể đọc stream
      const response = await fetch(`${apiUrl}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages // Truyền lịch sử y như cũ
        }),
      });

      if (!response.body) throw new Error('Không nhận được luồng dữ liệu');

      // 4. Các công cụ để "đọc" từng mảnh (chunk) dữ liệu trả về
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botReplyText = '';

      // Vòng lặp này sẽ chạy liên tục mỗi khi Backend nhả ra 1 chữ
      while (true) {
        const { value, done } = await reader.read();
        if (done) break; // Nếu Backend báo xong, thoát vòng lặp

        // Giải mã cục dữ liệu byte thành chuỗi Text
        const chunkString = decoder.decode(value, { stream: true });

        // NestJS Sse trả về format: "data: {"type":"text","data":"Chào"}\n\n"
        // Ta cần tách nó ra để lấy đúng phần JSON
        const lines = chunkString.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.substring(6); // Cắt bỏ chữ "data: "
              const parsedData = JSON.parse(dataStr);

              // Xử lý nếu là TEXT (Chữ bot đang gõ)
              if (parsedData.type === 'text') {
                botReplyText += parsedData.data;

                // Update UI ngay lập tức với số chữ đã nhận được
                setMessages(prev => prev.map(msg =>
                  msg.id === botMsgId ? { ...msg, text: botReplyText } : msg
                ));
              }
              // Xử lý nếu là SOURCES (Danh sách sản phẩm được gửi ở cuối)
              else if (parsedData.type === 'sources') {
                setMessages(prev => prev.map(msg =>
                  msg.id === botMsgId ? { ...msg, sources: parsedData.data } : msg
                ));
              }
            } catch (err) {
              // Bỏ qua lỗi parse JSON nếu chunk bị cắt ngang giữa chừng
            }
          }
        }
      }

    } catch (error) {
      console.error("Lỗi khi chat:", error);
      setMessages(prev => prev.map(msg =>
        msg.id === botMsgId ? { ...msg, text: "Xin lỗi, đã có lỗi kết nối xảy ra." } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Hỗ trợ BlueStore</h3>
                <p className="text-[10px] text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Trực tuyến
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 mt-1 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-white border text-gray-400 shadow-sm'}`}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div className="flex flex-col gap-2 min-w-0">
                    {(!isLoading || msg.sender == 'user') && <div className={`p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm break-words ${msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                      }`}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>}

                    {/* Hiển thị danh sách sản phẩm (Sources) nếu có */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-col gap-2 mt-1">
                        <p className="text-[11px] text-gray-500 font-medium px-1">Sản phẩm gợi ý:</p>
                        {msg.sources.map((src, idx) => (
                          <a
                            key={`${src.id}-${idx}`}
                            href={`${clientUrl}/product/${src.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                          >
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-gray-400">
                              {src.image_url ? (
                                <img src={src.image_url} alt={src.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              ) : (
                                <ImageIcon size={20} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                {src.name || 'Sản phẩm không tên'}
                              </h4>
                              <p className="text-xs font-bold text-blue-600 mt-0.5">
                                {formatPrice(src.price)}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex gap-2 items-center bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm text-gray-400 text-xs">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  <span className="animate-pulse">Đang tìm thông tin...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 flex gap-2 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(inputValue); // Sửa inputText thành inputValue
                  setInputValue('')
                }
              }}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
            <button
              onClick={() => {
                handleSend(inputValue);
                setInputValue('');
              }}
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm shadow-blue-500/30"
            >
              <Send size={20} className={isLoading ? 'opacity-0' : 'opacity-100'} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 z-50 ${isOpen
          ? 'bg-gray-100 text-gray-600 rotate-90 shadow-none'
          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/40'
          }`}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}