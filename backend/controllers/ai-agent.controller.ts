import { Controller, Post } from '@nestjs/common';
import { RagService } from 'services/rag.service';

@Controller('ai-admin')
export class AiAdminController {
  constructor(private readonly ragService: RagService) {}

  @Post('sync-products')
  async sync() {
    // Chạy ngầm quá trình đồng bộ
    this.ragService.syncAllProductsToVector();
    
    return {
      message: "Quá trình đồng bộ đang bắt đầu chạy ngầm. Vui lòng kiểm tra log server để xem tiến độ."
    };
  }
}