import axios from 'axios';
import toast from 'react-hot-toast';

// 自定义事件：token 刷新成功
export const TOKEN_REFRESHED_EVENT = 'tokenRefreshed';

// 模块级变量存储 authToken（不在 localStorage，防止 XSS 窃取）
let memoryAuthToken: string | null = null;

// 设置 authToken
export const setMemoryToken = (token: string | null) => {
  memoryAuthToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getMemoryToken = () => memoryAuthToken;

const api = axios.create({
  timeout: 10000,
  withCredentials: true, // 自动发送和接收 Cookie（refreshToken）
});

// --- 1. 请求拦截器：从内存变量获取 Token ---
api.interceptors.request.use(
  (config) => {
    // 内存变量已在 setMemoryToken 中同步到 defaults.headers
    // 这里只需确保没有遗漏
    if (memoryAuthToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${memoryAuthToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- 2. 响应拦截器：处理 401 和自动刷新 ---
let isRefreshing = false;
let failedQueue: any[] = [];

// 处理刷新队列：成功时重试请求，失败时拒绝
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

    if (!response) {
      toast.error('网络连接已断开，请检查网速');
      return Promise.reject(error);
    }

    if (response.status === 500) {
      toast.error('服务器开小差了');
      return Promise.reject(error);
    }

    // 如果报错的请求本身就是刷新接口
    if (response.status === 401 && originalRequest.url.includes('/api/auth/refresh')) {
      // Cookie 彻底没了或过期了
      // 必须直接报错，不要再尝试重试
      console.warn('Refresh token is invalid, redirecting to login');
      return Promise.reject(error); 
    }

    // 如果返回 401，尝试刷新 Token
    if (response.status === 401 && !originalRequest._retry) {
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
        axios.post('/api/auth/refresh', {}, { withCredentials: true })
          .then(({ data }) => {
            console.log('Token refreshed successfully');
            const { authToken } = data.data;
            setMemoryToken(authToken);
            originalRequest.headers.Authorization = `Bearer ${authToken}`;
            window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, {
              detail: { authToken }
            }));
            processQueue(null, authToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            setMemoryToken(null);
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