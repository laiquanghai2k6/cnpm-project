// src/app/checkout/page.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

import AuthGuard from '@/components/AuthGuard';

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}

function CheckoutContent() {
  const [address, setAddress] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Dữ liệu giả lập 1 sản phẩm
  const cartItems = [{ id: '1', productId: '1', name: 'iPhone 15 Pro Max 256GB', price: 30000000, quantity: 1, image_url: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png' }];
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    // Giả lập thanh toán và đặt hàng
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[50vh] bg-white p-12 rounded-lg shadow">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl">✓</div>
        <h1 className="text-3xl font-bold text-gray-900">Đặt hàng thành công!</h1>
        <p className="text-gray-600 text-center">Đơn hàng của bạn đang được xử lý. Cảm ơn bạn đã mua sắm tại BlueStore.</p>
        <Link href="/" className="bg-primary text-white font-bold py-3 px-8 rounded hover:bg-primary-dark">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800">Thanh toán</h1>
      
      <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* THÔNG TIN VẬN CHUYỂN */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Thông tin giao hàng</h2>
          <input type="text" placeholder="Họ và tên" className="w-full border p-3 rounded" required />
          <input type="tel" placeholder="Số điện thoại" className="w-full border p-3 rounded" required />
          <textarea 
            placeholder="Địa chỉ nhận hàng chi tiết" 
            className="w-full border p-3 rounded h-32" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        {/* TỔNG KẾT ĐƠN HÀNG VÀ MUA */}
        <div className="bg-gray-50 p-6 rounded-lg shadow border flex flex-col gap-4">
          <h3 className="font-semibold text-gray-700">Đơn hàng</h3>
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{item.name} x {item.quantity}</span>
              <span className="font-medium text-gray-800">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center text-xl font-extrabold border-t-2 pt-4 mt-4">
            <span className="text-gray-900">Tổng thanh toán:</span>
            <span className="text-primary">{formatPrice(totalAmount)}</span>
          </div>
          
          <button type="submit" className="w-full text-center bg-primary text-white font-bold py-3 rounded hover:bg-primary-dark transition mt-4">
            Đặt hàng & Thanh toán
          </button>
        </div>
      </form>
    </div>
  );
}