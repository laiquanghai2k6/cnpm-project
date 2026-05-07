import { createClient } from '@supabase/supabase-js';

// 1. Tạo Custom Storage Adapter
const customStorageAdapter = {
    getItem: (key: string) => {
        if (typeof window === 'undefined') return null;
        // Ưu tiên tìm trong session trước, nếu không có mới tìm trong local
        return window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        // Kiểm tra cờ xem user có muốn ghi nhớ không
        const isRemember = window.localStorage.getItem('rememberMeFlag') === 'true';
        if (isRemember) {
            window.localStorage.setItem(key, value);
        } else {
            window.sessionStorage.setItem(key, value);
        }
    },
    removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
    }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. Khởi tạo Supabase với Adapter vừa tạo
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: customStorageAdapter, // Ép Supabase dùng bộ lưu trữ của mình
    }
});