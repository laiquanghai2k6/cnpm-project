import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseGuard.name);
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
    this.logger.log('token', token);
    // Gửi token sang hệ thống của Supabase để tự nó kiểm tra (bất chấp ES256)
    const { data, error } = await this.supabase.auth.getUser(token);
    this.logger.log(`data: ${JSON.stringify(data, null, 2)}`);
    this.logger.error(`error: ${JSON.stringify(error, null, 2)}`);
    if (error || !data.user) {
      this.logger.warn(`Supabase từ chối token: ${error?.message}`);
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