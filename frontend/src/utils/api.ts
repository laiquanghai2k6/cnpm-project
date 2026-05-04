import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// 1. Interceptor cho Request: Luôn đính kèm Token mới nhất vào Header
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Cập nhật lại localStorage để đồng bộ với các hàm cũ nếu cần
    localStorage.setItem('accessToken', token);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. Interceptor cho Response: Xử lý Tự động Refresh khi Token hết hạn
api.interceptors.response.use(
  (response) => response, // Nếu request thành công, cứ để nó đi qua
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi là 401 (Unauthorized) và request này chưa từng được "thử lại"
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu đã thử lại để tránh lặp vô tận

      try {
        // Gọi lệnh refresh session của Supabase
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !data.session) throw refreshError;

        const newToken = data.session.access_token;
        localStorage.setItem('accessToken', newToken);

        // Thay token cũ bằng token mới vào header của request bị lỗi
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Thực thi lại request cũ với token mới
        return api(originalRequest);
      } catch (err) {
        // Nếu refresh cũng thất bại (hết hạn cả Refresh Token) -> Buộc đăng xuất
        console.error("Phiên đăng nhập đã hết hạn hoàn toàn");
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;