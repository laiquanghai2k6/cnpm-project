import { supabase } from "./supabase";

export const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem('userId') || window.localStorage.getItem('userId');
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
  
  // Cập nhật lại localStorage/sessionStorage để các hàm khác dùng đồng bộ
  const isRemember = window.localStorage.getItem('rememberMeFlag') === 'true';
  if (isRemember) {
    window.localStorage.setItem('accessToken', token);
  } else {
    window.sessionStorage.setItem('accessToken', token);
  }
  
  return token;
};