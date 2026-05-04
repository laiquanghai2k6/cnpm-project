import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase!: SupabaseClient;

  onModuleInit() {
    // Lấy thông tin từ file .env
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Hoặc  nếu bạn cần quyền Admin

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL và Key chưa được khai báo trong file .env');
    }

    // Khởi tạo client
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Hàm này để các Service khác lấy instance của Supabase ra dùng
  getClient(): SupabaseClient {
    return this.supabase;
  }
}