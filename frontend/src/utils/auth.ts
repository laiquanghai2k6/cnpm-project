import { supabase } from "./supabase";

export const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getUserId();
};

export const getValidToken = async () => {
  // Lấy session hiện tại từ Supabase SDK
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  // Nếu token sắp hết hạn, Supabase sẽ tự động refresh ở đây
  const token = session.access_token;
  
  // Cập nhật lại localStorage để các hàm khác dùng đồng bộ
  localStorage.setItem('accessToken', token);
  
  return token;
};