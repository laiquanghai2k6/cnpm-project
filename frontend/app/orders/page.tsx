'use client';
import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Package, Clock, CheckCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/me');
        setOrders(response.data);
      } catch (error) {
        console.error('Lỗi khi tải đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Đơn hàng của tôi</h1>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 p-6 rounded-full">
                  <ShoppingBag className="w-16 h-16 text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">Bạn chưa thực hiện bất kỳ giao dịch nào. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi và đặt hàng ngay nhé!</p>
              <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order: any) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Mã đơn hàng</p>
                      <p className="font-mono font-semibold text-gray-900">#{order.id.split('-')[0].toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ngày đặt</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(order.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                      <p className="font-bold text-blue-600 text-lg">
                        {order.total_amount.toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold w-fit">
                        <CheckCircle className="w-4 h-4" />
                        {order.status === 'completed' ? 'Hoàn tất' : order.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 last:pb-0">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                            {item.products?.image_url ? (
                              <img
                                src={item.products.image_url}
                                alt={item.products?.name || 'Sản phẩm'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-gray-900 truncate">{item.products?.name || 'Sản phẩm không xác định'}</h4>
                            <p className="text-sm text-gray-500 mt-0.5">Số lượng: <span className="font-medium text-gray-700">{item.quantity}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {(item.price_at_purchase * item.quantity).toLocaleString('vi-VN')} VNĐ
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.price_at_purchase.toLocaleString('vi-VN')} VNĐ / sp
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
