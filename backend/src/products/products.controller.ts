import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { SupabaseGuard } from 'src/auth/supabase.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // User thường và Admin đều xem được (Không cần Guard)
    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    // Khóa 2 lớp: Phải đăng nhập (AuthGuard) VÀ phải là Admin (AdminGuard)
    @UseGuards(SupabaseGuard, AdminGuard)
    @Post()
    create(@Body() productData: any) {
        return this.productsService.create(productData);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    // Khóa 2 lớp
    @UseGuards(SupabaseGuard, AdminGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}