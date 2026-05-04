'use client';

import AddToCartButton from '@/components/AddToCartButton';
import { useState } from 'react';

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    description: string;
}

export default function ProductDetailClient({ product }: { product: Product }) {
    const [quantity, setQuantity] = useState(1);

    const formatPrice = (price: number) => {
        return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    };

    return (
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Bên trái: Ảnh sản phẩm */}
            <div className="bg-white p-4 rounded-2xl shadow-sm">
                <img src={product.image_url} alt={product.name} className="w-full h-auto object-contain" />
            </div>

            {/* Bên phải: Thông tin */}
            <div className="flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
                <p className="text-2xl font-bold text-primary mb-6">{formatPrice(product.price)}</p>
                <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

                {/* Bộ đếm số lượng */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 border rounded-full flex items-center justify-center hover:bg-gray-100"
                    > - </button>
                    <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 border rounded-full flex items-center justify-center hover:bg-gray-100"
                    > + </button>
                </div>

                <div className="bg-primary text-white text-lg font-bold py-4 px-8 rounded-xl hover:bg-primary-dark transition shadow-lg shadow-blue-200">
                    <AddToCartButton
                        productId={product.id}
                        quantity={quantity} // Truyền thêm quantity nếu component hỗ trợ
                        text={`Thêm vào giỏ hàng - ${formatPrice(product.price * quantity)}`}
                    />          
                </div>
            </div>
        </div>
    );
}