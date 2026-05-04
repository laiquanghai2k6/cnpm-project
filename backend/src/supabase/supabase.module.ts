import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global() // Đánh dấu đây là module toàn cầu
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService], // Xuất ra để cả app dùng chung 1 instance
})
export class SupabaseModule {}