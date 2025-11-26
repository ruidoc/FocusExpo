/**
 * HTTP请求重试工具
 * 用于网络请求失败时自动重试
 */

export interface RetryConfig {
  maxRetries?: number; // 最大重试次数
  retryDelay?: number; // 初始重试延迟（毫秒）
  retryableStatusCodes?: number[]; // 可重试的HTTP状态码
  shouldRetry?: (error: any) => boolean; // 自定义重试判断
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 2,
  retryDelay: 500,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 判断错误是否可重试
 */
const isRetryableError = (error: any, config: RetryConfig): boolean => {
  // 自定义判断
  if (config.shouldRetry) {
    return config.shouldRetry(error);
  }

  // 网络错误（无响应）
  if (!error.response) {
    return true;
  }

  // 特定状态码
  const statusCode = error.response.status;
  return config.retryableStatusCodes?.includes(statusCode) || false;
};

/**
 * 带重试的请求包装器
 * @param requestFn 请求函数
 * @param config 重试配置
 * @returns Promise<T>
 */
export async function withRetry<T>(
  requestFn: () => Promise<T>,
  config?: RetryConfig,
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries!; attempt++) {
    try {
      const result = await requestFn();
      return result;
    } catch (error) {
      lastError = error;

      // 最后一次尝试，直接抛出
      if (attempt === finalConfig.maxRetries!) {
        throw error;
      }

      // 判断是否需要重试
      if (!isRetryableError(error, finalConfig)) {
        throw error;
      }

      // 指数退避延迟：第1次500ms，第2次1000ms
      const delayMs = finalConfig.retryDelay! * Math.pow(2, attempt);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(
        `[重试] 第${attempt + 1}次失败，${delayMs}ms后重试... 错误:`,
        errorMsg,
      );
      await delay(delayMs);
    }
  }

  throw lastError;
}

/**
 * 创建带重试的请求函数
 */
export function createRetryableRequest<
  T extends (...args: any[]) => Promise<any>,
>(requestFn: T, config?: RetryConfig): T {
  return ((...args: any[]) => {
    return withRetry(() => requestFn(...args), config);
  }) as T;
}
