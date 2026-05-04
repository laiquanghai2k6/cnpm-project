import { ChatService } from './chat.service';
import { Controller, Post, Body, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatbotService: ChatService) {}

  // Route mới dành cho streaming
  @Post('stream')
  @Sse()
  streamChat(@Body() body: { message: string; history: any[] }): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          // Gọi hàm askStream vừa tạo
          const stream = this.chatbotService.askStream(body.message, body.history || []);
          
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