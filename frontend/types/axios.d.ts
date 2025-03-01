declare module 'axios' {
  export interface AxiosRequestConfig {
    baseURL?: string;
    headers?: any;
    params?: any;
  }
  
  export interface AxiosInstance {
    create(config: AxiosRequestConfig): AxiosInstance;
    interceptors: {
      request: {
        use(
          onFulfilled: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
          onRejected?: (error: any) => any
        ): number;
      };
    };
    get(url: string, config?: AxiosRequestConfig): Promise<any>;
    post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any>;
    put(url: string, data?: any, config?: AxiosRequestConfig): Promise<any>;
    delete(url: string, config?: AxiosRequestConfig): Promise<any>;
  }
  
  export function create(config: AxiosRequestConfig): AxiosInstance;
  
  const axios: AxiosInstance & {
    create: typeof create;
  };
  
  export default axios;
} 