import { Injectable, InternalServerErrorException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CartService } from 'src/cart/cart.service';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(private readonly supabaseService: SupabaseService,
        private readonly cartService: CartService,

    ) { }

    // 1. HÀM GIẢ LẬP THANH TOÁN
    private async mockPaymentGateway(amount: number): Promise<boolean> {
        this.logger.log(`[Cổng thanh toán giả lập] Đang xử lý số tiền: ${amount} VNĐ...`);

        // Giả lập thời gian chờ của mạng (1.5 giây)
        return new Promise((resolve) => {
            setTimeout(() => {
                // Luôn trả về thành công (bạn có thể đổi thành logic random nếu muốn test lỗi)
                this.logger.log('[Cổng thanh toán giả lập] Thanh toán thành công!');
                resolve(true);
            }, 1500);
        });
    }

    // 2. HÀM XỬ LÝ ĐẶT HÀNG (CHECKOUT)
    async checkout(userId: string) {
        const supabase = this.supabaseService.getClient();

        // 1. Lấy giỏ hàng từ DB
        const { data: cart, error: cartError } = await supabase
            .from('carts')
            .select('id, cart_items(quantity, product_id, products(price))')
            .eq('user_id', userId)
            .single();

        if (cartError || !cart || cart.cart_items.length === 0) {
            throw new BadRequestException('Giỏ hàng trống hoặc không tồn tại');
        }

        // 2. Tính tổng tiền
        const totalAmount = cart.cart_items.reduce((sum, item: any) => {
            return sum + (item.products.price * item.quantity);
        }, 0);

        // 3. Giả lập thanh toán
        await this.mockPaymentGateway(totalAmount);

        // 4. LƯU ĐƠN HÀNG (Bảng orders)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                total_amount: totalAmount,
                status: 'completed', // Đặt trạng thái là đã xong vì đã qua gateway
            })
            .select()
            .single();

        if (orderError) throw new Error(`Lỗi tạo đơn hàng: ${orderError.message}`);

        // 5. LƯU CHI TIẾT ĐƠN HÀNG (Bảng order_items)
        // Map dữ liệu từ giỏ hàng sang định dạng của bảng order_items
        const orderItemsData = cart.cart_items.map((item: any) => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: item.products.price // Lưu giá tại thời điểm mua để đối chiếu sau này
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsData);

        if (itemsError) throw new Error(`Lỗi lưu chi tiết đơn hàng: ${itemsError.message}`);

        // 6. XÓA GIỎ HÀNG (Gọi service bạn vừa sửa)
        await this.cartService.clearCart(userId);

        return {
            message: 'Thanh toán thành công',
            orderId: order.id
        };
    }

    // 3. HÀM LẤY DANH SÁCH ĐƠN HÀNG (Dành cho Admin)
    async getAllOrders() {
        const supabase = this.supabaseService;
        const { data, error } = await supabase.getClient()
            .from('orders')
            .select('*, order_items(*)') // Lấy đơn hàng kèm theo chi tiết món hàng
            .order('created_at', { ascending: false });

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    // 4. HÀM LẤY ĐƠN HÀNG CỦA USER ĐANG ĐĂNG NHẬP
    async getUserOrders(userId: string) {
        const supabase = this.supabaseService.getClient();
        
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (
                        name,
                        image_url
                    )
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new InternalServerErrorException(`Lỗi khi lấy danh sách đơn hàng: ${error.message}`);
        }
        
        return data;
    }
}