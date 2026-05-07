import { Controller, Post, Get, Body, Delete, Param, UseGuards, Request, Patch, Logger } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';
import { SupabaseGuard } from 'src/auth/supabase.guard';

@Controller('cart')
@UseGuards(SupabaseGuard)// Áp dụng cho toàn bộ Controller
export class CartController {
    private readonly logger = new Logger(CartController.name);
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Request() req: any) {
        const userId = req.user.userId;
        this.logger.debug(`User ID từ token: ${userId}`);
        return this.cartService.getCart(userId);
    }

    @Post()
    addToCart(@Request() req: any, @Body() body: { productId: string, quantity: number }) {
        return this.cartService.addToCart(req.user.userId, body.productId, body.quantity);
    }

    @Delete(':id')
    removeItem(@Param('id') id: string) {
        return this.cartService.removeItem(id);
    }

    @Patch(':id')
    updateQuantity(@Param('id') id: string, @Body() body: { quantity: number }) {
        return this.cartService.updateQuantity(id, body.quantity);
    }
}