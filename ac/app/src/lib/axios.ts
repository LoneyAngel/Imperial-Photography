import axios from 'axios';

// 自定义事件：token 刷新成功
export const TOKEN_REFRESHED_EVENT = 'tokenRefreshed';

const api = axios.create({
  timeout: 10000,
  withCredentials: true, // 自动发送和接收 Cookie
});

// --- 1. 请求拦截器：每个请求发起前，自动附带 Token ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
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
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        // refreshToken 在 HttpOnly Cookie 中
        axios.post('/api/auth/refresh', {}, { withCredentials: true })
          .then(({ data }) => {
            const { authToken, roleId } = data;

            // 临时存储到 localStorage，供后续请求使用
            // 页面刷新时会通过 TokenProvider 的 initAuth 清除
            localStorage.setItem('authToken', authToken);
            if (roleId !== undefined) {
              localStorage.setItem('userRole', String(roleId));
            }

            // 触发自定义事件，通知 TokenProvider 更新 state
            window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, {
              detail: { authToken }
            }));

            // 更新 axios 默认 header
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            originalRequest.headers.Authorization = `Bearer ${authToken}`;

            processQueue(null, authToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = '/member-auth';
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    const errorMessage = response?.data?.error || `API Error ${response?.status || 'Unknown'}`;
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;