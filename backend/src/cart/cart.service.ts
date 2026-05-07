import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CartService {
    constructor(private readonly supabase: SupabaseService) { }

    // Lấy hoặc tạo giỏ hàng cho User
    private async getOrCreateCart(userId: string) {
        const client = await this.supabase.getClient();

        // 1. Tìm giỏ hàng hiện tại
        let { data: cart, error } = await client
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();

        // 2. Nếu chưa có thì tạo mới
        if (!cart) {
            const { data: newCart, error: createError } = await client
                .from('carts')
                .insert([{ user_id: userId }])
                .select()
                .single();

            if (createError) throw new InternalServerErrorException(createError.message);
            return newCart.id;
        }

        return cart.id;
    }


    // cart.service.ts
    async clearCart(userId: string) {
        const client = await this.supabase.getClient();
        // BƯỚC 1: Tìm ID của giỏ hàng thuộc về User này
        const { data: cart, error: cartError } = await client
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (cartError || !cart) {
            throw new Error('Không tìm thấy giỏ hàng của người dùng này');
        }

        // BƯỚC 2: Xóa tất cả các item trong cart_items có cart_id vừa tìm được
        const { error: deleteError } = await client
            .from('cart_items')
            .delete()
            .eq('cart_id', cart.id); // Dùng cart_id thay vì user_id

        if (deleteError) {
            throw new Error(`Lỗi khi làm sạch giỏ hàng: ${deleteError.message}`);
        }

        return { success: true };
    }
    // Thêm sản phẩm vào giỏ
    async addToCart(userId: string, productId: string, quantity: number) {
        const cartId = await this.getOrCreateCart(userId);
        const client = this.supabase.getClient();

        // Kiểm tra xem sản phẩm đã có trong giỏ chưa
        const { data: existingItem } = await client
            .from('cart_items')
            .select('*')
            .eq('cart_id', cartId)
            .eq('product_id', productId)
            .single();

        if (existingItem) {
            // Nếu có rồi thì tăng số lượng
            return await client
                .from('cart_items')
                .update({ quantity: existingItem.quantity + quantity })
                .eq('id', existingItem.id);
        } else {
            // Nếu chưa có thì chèn mới
            return await client
                .from('cart_items')
                .insert([{ cart_id: cartId, product_id: productId, quantity }]);
        }
    }

    // Xem giỏ hàng (Kèm thông tin sản phẩm)
    async getCart(userId: string) {
        const { data, error } = await this.supabase.getClient()
            .from('carts')
            .select(`
        id,
        cart_items (
          id,
          quantity,
          products (id, name, price, image_url)
        )
      `)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw new InternalServerErrorException(error.message);
        return data || { cart_items: [] };
    }

    // Xóa sản phẩm khỏi giỏ
    async removeItem(itemId: string) {
        return await this.supabase.getClient()
            .from('cart_items')
            .delete()
            .eq('id', itemId);
    }

    // Cập nhật số lượng sản phẩm trong giỏ
    async updateQuantity(itemId: string, quantity: number) {
        if (quantity <= 0) {
            return this.removeItem(itemId);
        }
        return await this.supabase.getClient()
            .from('cart_items')
            .update({ quantity })
            .eq('id', itemId);
    }
}