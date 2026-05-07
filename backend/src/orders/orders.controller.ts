import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { SupabaseGuard } from 'src/auth/supabase.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // USER ĐẶT HÀNG (Bắt buộc đăng nhập)
  // POST: http://localhost:3000/orders/checkout
  @UseGuards(SupabaseGuard)
  @Post('checkout')
  checkout(@Request() req: any) {
    // Lấy userId từ token đã được giải mã
    const userId = req.user.userId; 
    return this.ordersService.checkout(userId);
  }

    // ADMIN XEM TẤT CẢ ĐƠN HÀNG (Khóa 2 lớp: Auth + Admin)
    // GET: http://localhost:3000/orders
    @UseGuards(SupabaseGuard, AdminGuard)
    @Get()
    getAllOrders() {
        return this.ordersService.getAllOrders();
    }

    // USER XEM ĐƠN HÀNG CỦA MÌNH
    // GET: http://localhost:3000/orders/me
    @UseGuards(SupabaseGuard)
    @Get('me')
    getUserOrders(@Request() req: any) {
        const userId = req.user.userId;
        return this.ordersService.getUserOrders(userId);
    }
}