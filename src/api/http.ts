import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'

// 统一的 axios 实例（对应简历：封装 Axios 拦截器统一处理鉴权/异常）
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

// 请求拦截器：自动注入 token
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一解包数据 + 统一异常提示
service.interceptors.response.use(
  (response: AxiosResponse): any => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0 || res.code === 200) return res.data
      if (res.code === 401) localStorage.removeItem('token')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    const status = error?.response?.status
    const message =
      status === 401 ? '登录已过期，请重新登录'
      : status === 403 ? '没有访问权限'
      : status === 404 ? '请求地址不存在'
      : status >= 500 ? '服务器开小差了'
      : error.message || '网络异常'
    return Promise.reject(new Error(message))
  }
)

export default service

export function get<T>(url: string, params?: object): Promise<T> {
  return service.get(url, { params }) as unknown as Promise<T>
}
export function post<T>(url: string, data?: object): Promise<T> {
  return service.post(url, data) as unknown as Promise<T>
}
