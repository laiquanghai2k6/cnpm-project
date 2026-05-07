'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LayoutDashboard,
    Package,
    Plus,
    Trash2,
    DollarSign,
    ShoppingBag,
    Loader2,
    X,
    ChevronDown,
    ChevronUp,
    Clock,
    CheckCircle
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    description: string;
}

interface OrderItem {
    id: string;
    quantity: number;
    price_at_purchase: number;
    products: {
        name: string;
        image_url: string;
    };
}

interface Order {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    order_items: OrderItem[];
}

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // State cho Form thêm sản phẩm
    const [showModal, setShowModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: 0, image_url: '', description: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let finalImageUrl = newProduct.image_url;

            // 1. Nếu có chọn file ảnh từ máy, tiến hành upload lên Supabase Storage
            if (imageFile) {
                // Đổi tên file để tránh trùng lặp
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `public/${fileName}`; // Bạn có thể lưu vào folder public bên trong bucket

                // Upload file
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, imageFile);
                console.log('uploadData', uploadData, 'uploadError', uploadError);
                if (uploadError) {
                    throw new Error(`Lỗi upload ảnh: ${uploadError.message}`);
                }

                // Lấy Public URL sau khi upload xong
                const { data: publicUrlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                finalImageUrl = publicUrlData.publicUrl;
            }

            if (!finalImageUrl) {
                throw new Error("Vui lòng chọn ảnh hoặc nhập URL ảnh.");
            }

            // 2. Gửi dữ liệu tạo sản phẩm (kèm URL ảnh vừa upload) xuống Backend của bạn
            const productPayload = { ...newProduct, image_url: finalImageUrl };
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

            await axios.post(`${apiUrl}/products`, productPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Thêm sản phẩm thành công!");
            setShowModal(false);
            setNewProduct({ name: '', price: 0, image_url: '', description: '' }); // Reset form
            setImageFile(null);
            fetchData(); // Reload danh sách sản phẩm

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Lỗi khi thêm sản phẩm");
        } finally {
            setIsUploading(false);
        }
    };
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const fetchData = async () => {
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Lấy danh sách sản phẩm
            const resProducts = await axios.get(`${apiUrl}/products`);
            console.log('Sản phẩm từ API:', resProducts.data);
            setProducts(resProducts.data);

            // 2. Lấy danh sách đơn hàng để tính doanh thu
            const resOrders = await axios.get(`${apiUrl}/orders`, { headers });
            setOrders(resOrders.data);
        } catch (error) {
            console.error("Lỗi tải dữ liệu admin:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Tính toán doanh thu
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

    // Thêm sản phẩm


    // Xóa sản phẩm
    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
            await axios.delete(`${apiUrl}/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            toast.error("Lỗi khi xóa");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* HEADER */}
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutDashboard className="text-blue-600" /> Bảng quản trị hệ thống
                    </h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md"
                    >
                        <Plus size={20} /> Thêm sản phẩm
                    </button>
                </div>

                {/* THỐNG KÊ NHANH */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-xl text-green-600">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Tổng doanh thu</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalRevenue.toLocaleString('vi-VN')} ₫
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Đơn hàng đã bán</p>
                                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                <Package size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Tổng sản phẩm</p>
                                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                            </div>
                        </div>
                    </div>
                </div>



                {/* DANH SÁCH ĐƠN HÀNG */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mt-8">
                    <div className="p-6 border-b">
                        <h2 className="font-bold text-lg">Quản lý đơn hàng</h2>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                            <tr>
                                <th className="p-4">Mã đơn hàng</th>
                                <th className="p-4">Ngày đặt</th>
                                <th className="p-4">Tổng tiền</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500">
                                        Chưa có đơn hàng nào.
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <React.Fragment key={order.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono text-sm font-semibold">#{order.id.split('-')[0].toUpperCase()}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Clock size={14} />
                                                {new Date(order.created_at).toLocaleDateString('vi-VN', {
                                                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-blue-600">
                                            {Number(order.total_amount).toLocaleString('vi-VN')} ₫
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                                <CheckCircle size={12} />
                                                {order.status === 'completed' ? 'Hoàn tất' : order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-1 mx-auto"
                                            >
                                                {expandedOrderId === order.id ? (
                                                    <><ChevronUp size={16} /> Đóng</>
                                                ) : (
                                                    <><ChevronDown size={16} /> Xem chi tiết</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* CHI TIẾT ĐƠN HÀNG (EXPANDABLE ROW) */}
                                    {expandedOrderId === order.id && (
                                        <tr className="bg-blue-50/30">
                                            <td colSpan={5} className="p-0 border-b border-blue-100">
                                                <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                                                    <h4 className="font-semibold text-gray-700 mb-4 text-sm uppercase flex items-center gap-2">
                                                        <Package size={16} /> Sản phẩm trong đơn:
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {order.order_items?.map((item) => (
                                                            <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                                <img
                                                                    src={item.products?.image_url || '/placeholder.png'}
                                                                    alt={item.products?.name}
                                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                                                                />
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-gray-900">{item.products?.name || 'Sản phẩm không rõ'}</p>
                                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                                        {Number(item.price_at_purchase).toLocaleString('vi-VN')} ₫ <span className="font-semibold px-1">x</span> {item.quantity}
                                                                    </p>
                                                                </div>
                                                                <div className="font-bold text-gray-900">
                                                                    {(Number(item.price_at_purchase) * item.quantity).toLocaleString('vi-VN')} ₫
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL THÊM SẢN PHẨM */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-black">
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-bold mb-6">Thêm sản phẩm mới</h3>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Tên sản phẩm</label>
                                <input
                                    required
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 ring-blue-100 outline-none"
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Giá (VNĐ)</label>
                                <input
                                    required type="number"
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 ring-blue-100 outline-none"
                                    onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                                />
                            </div>

                            {/* --- ĐÃ SỬA ĐOẠN NÀY --- */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Hình ảnh sản phẩm</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    required={!newProduct.image_url} // Bắt buộc nếu chưa có URL nào khác
                                    className="w-full border rounded-lg p-2 focus:ring-2 ring-blue-100 outline-none"
                                    onChange={e => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setImageFile(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                            {/* ----------------------- */}

                            <div>
                                <label className="text-sm font-medium mb-1 block">Mô tả</label>
                                <textarea
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 ring-blue-100 outline-none"
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </div>

                            <button
                                disabled={isUploading}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-blue-700 shadow-lg transition-all active:scale-95 disabled:bg-blue-400 flex justify-center items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Đang tải lên...
                                    </>
                                ) : (
                                    "Xác nhận thêm"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}