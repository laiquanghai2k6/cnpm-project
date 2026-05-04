import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Lấy thông tin request hiện tại
    const request = context.switchToHttp().getRequest();
    // req.user có được là nhờ AuthGuard('jwt') đã chạy trước đó
    const user = request.user; 
    console.log('Dữ liệu User trong AdminGuard:', user);

    // Kiểm tra xem user có tồn tại và role có phải là admin không
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền truy cập! Chỉ Admin mới được thực hiện hành động này.');
    }

    return true; // Cho phép đi tiếp vào Controller
  }
}