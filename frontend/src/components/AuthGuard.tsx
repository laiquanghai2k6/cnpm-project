'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                toast.error('Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.');
                router.push('/login');
            } else {
                setAuthenticated(true);
            }
            setLoading(false);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setAuthenticated(false);
                toast.error('Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.');
                router.push('/login');
            } else {
                setAuthenticated(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Đang kiểm tra quyền truy cập...</p>
            </div>
        );
    }

    return authenticated ? <>{children}</> : null;
}
