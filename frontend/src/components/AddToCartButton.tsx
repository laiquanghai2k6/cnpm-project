'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';

interface AddToCartButtonProps {
    productId: string;
    text: string;
    quantity: number;
}

export default function AddToCartButton({ productId, text, quantity }: AddToCartButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const router = useRouter();

    const handleAddToCart = async () => {
        // 1. Kiểm tra đăng nhập
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
        const userId = session?.user?.id || sessionStorage.getItem('userId') || localStorage.getItem('userId');

        if (!session && !token) {
            toast.error('Bạn chưa đăng nhập! Vui lòng đăng nhập để đặt đồ và mua hàng.');
            router.push('/login');
            return;
        }

        setIsAdding(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

            // 2. Gọi API thêm vào giỏ hàng
            await axios.post(
                `${apiUrl}/cart`,
                {
                    productId: productId,
                    quantity: quantity || 1
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Hiện thông báo thành công
            toast.success('Đã thêm vào giỏ hàng thành công!');

            // Kích hoạt sự kiện để Navbar cập nhật số lượng ngay lập tức
            window.dispatchEvent(new Event('cartUpdated'));

        } catch (error: any) {
            console.error("Lỗi khi thêm vào giỏ:", error);
            if (error.response?.status === 401) {
                toast.error('Bạn chưa đăng nhập! Vui lòng đăng nhập để đặt đồ và mua hàng.');
                router.push('/login');
            } else {
                toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng.');
            }
        } finally {
            setIsAdding(false);
        }
    };


    return (
        <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-center items-center text-white font-semibold py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all duration-200"
        >
            {isAdding ? <Loader2 className="animate-spin" size={20} /> : text}
        </button>
    );
}