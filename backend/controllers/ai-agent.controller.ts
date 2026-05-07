import { Controller, Post } from '@nestjs/common';
import { RagService } from 'services/rag.service';

import { ProductsService } from 'src/products/products.service';

@Controller('ai-admin')
export class AiAdminController {
  constructor(
    private readonly ragService: RagService,
    private readonly productsService: ProductsService
  ) {}

  @Post('sync-products')
  async sync() {
    // Chạy ngầm quá trình đồng bộ
    const products = await this.productsService.findAll();
    this.ragService.syncAllProductsToVector(products as any);
    
    return {
      message: "Quá trình đồng bộ đang bắt đầu chạy ngầm. Vui lòng kiểm tra log server để xem tiến độ."
    };
  }
}