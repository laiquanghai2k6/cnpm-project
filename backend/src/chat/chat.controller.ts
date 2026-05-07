import { ChatService } from './chat.service';
import { Controller, Post, Body, Sse, MessageEvent, Req, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(
    private readonly chatbotService: ChatService,
    private readonly supabaseService: SupabaseService
  ) {}

  // Route mới dành cho streaming
  @Post('stream')
  @Sse()
  streamChat(@Req() req: any, @Body() body: { message: string; history: any[] }): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          let userId = null;
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
              const token = authHeader.split(' ')[1];
              const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
              userId = payload.sub;
            } catch (e) {
              this.logger.error('Lỗi trích xuất userId từ token:', e);
            }
          }

          // Gọi hàm askStream vừa tạo
          const stream = this.chatbotService.askStream(body.message, body.history || [], userId);
          
          for await (const chunk of stream) {
            // NestJS Sse yêu cầu trả về object có format { data: ... }
            subscriber.next({ data: chunk } as MessageEvent);
          }
          
          subscriber.complete(); // Đóng kết nối khi hoàn thành
        } catch (err) {
          subscriber.error(err);
        }
      })();
    });
  }
}