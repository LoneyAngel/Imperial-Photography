import axios from 'axios';

// 自定义事件：token 刷新成功
export const TOKEN_REFRESHED_EVENT = 'tokenRefreshed';

const api = axios.create({
  timeout: 10000,
  withCredentials: true, // 自动发送和接收 Cookie
});

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

    if (response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
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
            localStorage.setItem('authToken', authToken);
            if (roleId !== undefined) {
              localStorage.setItem('userRole', String(roleId));
            }

            // 触发自定义事件，通知 TokenProvider 更新 state
            window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, {
              detail: { authToken, roleId }
            }));

            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            originalRequest.headers.Authorization = `Bearer ${authToken}`;

            processQueue(null, authToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = '/login';
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