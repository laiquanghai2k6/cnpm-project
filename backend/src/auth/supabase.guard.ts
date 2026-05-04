import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseGuard implements CanActivate {
  private supabase;

  constructor() {
    // Lấy chính xác 2 biến từ file .env của bạn
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // <-- Khớp với .env của bạn
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu Token ở Header');
    }

    const token = authHeader.split(' ')[1];

    // Gửi token sang hệ thống của Supabase để tự nó kiểm tra (bất chấp ES256)
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      console.log('Supabase từ chối token:', error?.message);
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Pass qua cửa! Gán userId cho Controller dùng
    request.user = {
      userId: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'user'
    };

    return true;
  }
}