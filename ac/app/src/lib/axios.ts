import axios from 'axios';

const api = axios.create({
  timeout: 10000,
});

// --- 1. 请求拦截器：每个请求发起前，自动附带 Token ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // 这里的逻辑替代了你原先 apiFetch 里的 headers 拼接
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- 2. 响应拦截器：处理 401 和自动刷新 ---
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    // 如果返回 401，尝试刷新 Token
    if (response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果已经在刷新了，把当前请求挂起放入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest); // 使用新 token 重试
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        // 注意：刷新接口通常不需要带旧的 Access Token，或者有专门的路由
        axios.post('/api/auth/refresh', { refreshToken })
          .then(({ data }) => {
            const { accessToken, newRefreshToken } = data;
            
            // 更新本地存储
            localStorage.setItem('authToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            // 关键：同步更新当前实例的默认 Header，确保后续新请求直接可用
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            processQueue(null, accessToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            // 彻底过期，清理并跳转
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // 处理非 401 的业务错误（对应你原先 apiFetch 里的 res.json() 解析）
    const errorMessage = response?.data?.error || `API Error ${response?.status || 'Unknown'}`;
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;