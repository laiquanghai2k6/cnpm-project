import Link from 'next/link';
// Nhúng Client Component vào Server Component
import AddToCartButton from '@/components/AddToCartButton'; 
import api from '@/utils/api';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

async function getProducts(): Promise<Product[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    const response = await api.get(`${apiUrl}/products`);
    console.log('API Response:', response.data); // Log dữ liệu nhận được từ API
    return response.data;
  } catch (error: any) {
    console.error("Lỗi khi gọi API:", error.message);
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };
  console.log('products',products)

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-4 pt-10 pb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 tracking-tight">
          Sản phẩm mới nhất
        </h1>
        <p className="text-gray-500 max-w-2xl text-lg">Khám phá bộ sưu tập công nghệ đỉnh cao với mức giá ưu đãi nhất thị trường.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <div key={product.id} className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="w-full h-56 bg-gray-50/50 rounded-xl mb-6 flex items-center justify-center p-4 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 z-10" 
              />
            </div>
            
            <h3 className="font-bold text-gray-800 text-lg leading-tight mb-2 line-clamp-2 flex-grow group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-end justify-between mb-5">
              <p className="text-blue-600 font-extrabold text-xl">{formatPrice(product.price)}</p>
            </div>
            
            <div className="flex gap-3 mt-auto">
              <Link 
                href={`/product/${product.id}`} 
                className="flex-1 text-center bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-all duration-200 flex items-center justify-center"
              >
                Chi tiết
              </Link>
              
              <div className="flex-1">
                <AddToCartButton productId={product.id} text={'Thêm giỏ'} quantity={1}/>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center mt-16 bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto">
          <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <p className="text-red-500 font-bold text-xl mb-2">Không thể tải sản phẩm!</p>
          <p className="text-gray-500">Hãy đảm bảo Backend API đang chạy.</p>
        </div>
      )}
    </div>
  );
}