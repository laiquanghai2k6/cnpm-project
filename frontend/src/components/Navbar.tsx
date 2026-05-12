// src/components/Navbar.tsx
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { User, ShoppingCart, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();

  const fetchCartCount = async () => {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    
    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await api.get(`${apiUrl}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = res.data.cart_items || [];
      const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(totalQuantity);
    } catch (error) {
      console.error('Lỗi khi lấy số lượng giỏ hàng Navbar:', error);
      setCartCount(0);
    }
  };

    const checkAdminRole = () => {
    try {
      const sessionData = sessionStorage.getItem('sb-tbkujuounzldpribaabq-auth-token') || localStorage.getItem('sb-tbkujuounzldpribaabq-auth-token'); 
      if (sessionData) {
        const parsedData = JSON.parse(sessionData);
        if (parsedData?.user?.role === 'admin' || parsedData?.user?.user_metadata?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Lỗi khi parse token kiểm tra admin:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchCartCount();
        checkAdminRole();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCartCount();
        checkAdminRole();
      } else {
        setCartCount(0);
        setIsAdmin(false);
      }
    });

    window.addEventListener('cartUpdated', fetchCartCount);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('cartUpdated', fetchCartCount);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    // localStorage.removeItem('userId');
    // localStorage.removeItem('accessToken');
    // localStorage.removeItem('sb-tbkujuounzldpribaabq-auth-token'); 

    setCartCount(0);
    setIsAdmin(false);
    router.push('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* LOGO */}
          <Link href="/" className="flex-shrink-0 flex items-center group">
            <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-indigo-600 group-hover:to-blue-600 transition-all duration-500">Blue<span className='text-gray-800 group-hover:text-gray-600 transition-colors'>Store</span></span>
          </Link>

          {/* MENU TRUNG TÂM (DASHBOARD ADMIN) */}
          <div className="hidden md:flex flex-1  justify-end pr-10">
            {isAdmin && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-blue-50 px-5 py-2 rounded-lg border border-blue-100 text-sm font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-all shadow-sm"
              >
                <LayoutDashboard size={18} />
                Vào Dashboard
              </Link>
            )}
          </div>

          {/* ICONS PHẢI */}
          <div className="flex items-center gap-4">

            <Link href="/cart" className="relative text-gray-700 hover:text-blue-600">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="hidden sm:inline">{user.email}</span>
                </div>
                <Link href="/orders" className="text-sm font-semibold text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">Đơn hàng của tôi</Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 bg-gray-50 p-2 rounded-full transition-colors" title="Đăng xuất">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">Đăng nhập</Link>
                <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}