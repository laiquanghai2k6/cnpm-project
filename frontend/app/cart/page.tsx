'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus, Minus, Loader2, ShoppingCart, X, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { getUserId } from '@/utils/auth';
import { toast } from 'sonner';

// --- Interfaces ---
export interface ProductInfo {
    id: string;
    name: string;
    price: number;
    image_url: string;
}

export interface CartItem {
    id: string;
    quantity: number;
    products: ProductInfo;
}

export interface CartItemAPIResponse {
    id: string;
    cart_items: CartItem[];
}

import AuthGuard from '@/components/AuthGuard';

export default function CartPage() {
    return (
        <AuthGuard>
            <CartContent />
        </AuthGuard>
    );
}

function CartContent() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false); // Trạng thái đang gọi API thanh toán
    const [showQR, setShowQR] = useState<boolean>(false);
    const router = useRouter();
    const formatPrice = (price: number) => {
        return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    };

    const fetchCart = async () => {
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
            console.log("Token khi fetch cart:", token);
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await axios.get<CartItemAPIResponse>(`${apiUrl}/cart`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Token khi fetch cart:", res);

            setCartItems(res.data.cart_items || []);
        } catch (error) {
            console.error("Lỗi fetch giỏ hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // HÀM THANH TOÁN THẬT (Gọi API Checkout)
    const handleActualCheckout = async () => {
        setIsCheckingOut(true);
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            // 1. Gọi API đặt hàng
            await axios.post(`${apiUrl}/orders/checkout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Thông báo thành công
            toast.success('Thanh toán thành công! Đơn hàng của bạn đang được xử lý.');

            // 3. Cập nhật UI: Xóa sạch giỏ hàng cục bộ và báo Navbar
            setCartItems([]);
            window.dispatchEvent(new Event('cartUpdated'));

            // 4. Đóng modal và chuyển hướng (tùy chọn)
            setShowQR(false);
            router.push('/'); // Hoặc trang lịch sử đơn hàng

        } catch (error: any) {
            console.error("Lỗi checkout:", error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xử lý đơn hàng.");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleRemoveItem = async (cartItemId: string) => {
        if (!window.confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
            await axios.delete(`${apiUrl}/cart/${cartItemId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            toast.error("Lỗi khi xóa sản phẩm!");
            fetchCart();
        }
    };

    const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(cartItemId);
            return;
        }

        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            // Cập nhật giao diện trước (Optimistic UI)
            setCartItems((prev) => prev.map(item =>
                item.id === cartItemId ? { ...item, quantity: newQuantity } : item
            ));

            await axios.patch(`${apiUrl}/cart/${cartItemId}`, { quantity: newQuantity }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            toast.error("Lỗi khi cập nhật số lượng!");
            fetchCart(); // Hoàn tác nếu lỗi
        }
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0);

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
    );

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
                <div className="bg-gray-100 p-6 rounded-full mb-6 text-gray-400">
                    <ShoppingCart size={64} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Giỏ hàng trống</h2>
                <Link href="/" className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Mua sắm ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <ul className="divide-y divide-gray-100">
                        {cartItems.map((item) => (
                            <li key={item.id} className="py-6 flex gap-4">
                                <img src={item.products?.image_url} className="h-24 w-24 object-cover rounded-lg border" />
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between">
                                        <h3 className="font-medium text-gray-900 line-clamp-1">{item.products?.name}</h3>
                                        <p className="font-bold">{formatPrice(item.products?.price || 0)}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center border rounded-lg">
                                            <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-1 px-3 hover:bg-gray-100"><Minus size={14} /></button>
                                            <span className="px-3 border-x">{item.quantity}</span>
                                            <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-1 px-3 hover:bg-gray-100"><Plus size={14} /></button>
                                        </div>
                                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 flex items-center gap-1 text-sm font-medium">
                                            <Trash2 size={16} /> Xóa
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="lg:w-96 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-xl font-bold mb-6">Tóm tắt đơn hàng</h2>
                    <div className="flex justify-between mb-4 text-gray-600">
                        <span>Tạm tính</span>
                        <span>{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between mb-6 font-bold text-lg border-t pt-4">
                        <span>Tổng cộng</span>
                        <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                    </div>
                    <button
                        onClick={() => setShowQR(true)}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                    >
                        Tiến hành thanh toán
                    </button>
                </div>
            </div>

            {/* MODAL QR THANH TOÁN */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        <div className="bg-blue-600 p-4 text-white text-center relative">
                            <h3 className="text-lg font-bold">Thanh toán chuyển khoản</h3>
                            <button onClick={() => !isCheckingOut && setShowQR(false)} className="absolute right-4 top-4 hover:bg-white/20 rounded-full p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 text-center">
                            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 mb-6">
                                <img
                                    src="https://i.ibb.co/VcmksbKc/E381-FCE9-FC5-D-4-D86-8-AF5-D9-DE835-B67-E2.png"
                                    alt="QR Payment"
                                    className="w-full aspect-square rounded-lg object-contain"
                                />
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-500 text-sm">Số tiền cần chuyển</p>
                                <p className="text-3xl font-black text-gray-900">{formatPrice(totalAmount)}</p>
                            </div>

                            <button
                                onClick={handleActualCheckout}
                                disabled={isCheckingOut}
                                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all disabled:bg-gray-400"
                            >
                                {isCheckingOut ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Đang xác nhận...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} /> Tôi đã chuyển khoản
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest">Hệ thống sẽ tự động kiểm tra giao dịch</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}