/**
 * 错误处理工具
 * 提供统一的错误分类、处理和用户友好的错误提示
 */

/**
 * API 错误类型
 */
export enum ErrorType {
  NETWORK = 'NETWORK',           // 网络错误
  SERVER = 'SERVER',             // 服务器错误 (5xx)
  CLIENT = 'CLIENT',             // 客户端错误 (4xx)
  VALIDATION = 'VALIDATION',     // 验证错误
  NOT_FOUND = 'NOT_FOUND',      // 资源未找到
  UNAUTHORIZED = 'UNAUTHORIZED', // 未授权
  UNKNOWN = 'UNKNOWN'            // 未知错误
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  type: ErrorType
  statusCode?: number
  originalError?: Error

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
    this.originalError = originalError
  }
}

/**
 * 根据 HTTP 状态码分类错误
 */
export function classifyError(status: number): ErrorType {
  if (status === 404) return ErrorType.NOT_FOUND
  if (status === 401 || status === 403) return ErrorType.UNAUTHORIZED
  if (status === 400 || status === 422) return ErrorType.VALIDATION
  if (status >= 400 && status < 500) return ErrorType.CLIENT
  if (status >= 500) return ErrorType.SERVER
  return ErrorType.UNKNOWN
}

/**
 * 解析 fetch 错误
 */
export async function parseFetchError(error: unknown): Promise<AppError> {
  // 网络错误（无法连接到服务器）
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      '无法连接到服务器，请检查网络连接',
      ErrorType.NETWORK,
      undefined,
      error as Error
    )
  }

  // Response 错误（服务器返回错误状态码）
  if (error instanceof Response) {
    const errorType = classifyError(error.status)
    let message = `请求失败 (${error.status})`

    try {
      const data = await error.json()
      message = data.error || data.message || message
    } catch {
      // 无法解析响应体
    }

    return new AppError(message, errorType, error.status)
  }

  // 其他错误
  if (error instanceof Error) {
    return new AppError(error.message, ErrorType.UNKNOWN, undefined, error)
  }

  return new AppError('发生未知错误', ErrorType.UNKNOWN)
}

/**
 * 获取用户友好的错误提示
 */
export function getUserFriendlyMessage(error: AppError): {
  title: string
  description: string
} {
  switch (error.type) {
    case ErrorType.NETWORK:
      return {
        title: '网络连接失败',
        description: '请检查您的网络连接，或稍后重试',
      }

    case ErrorType.SERVER:
      return {
        title: '服务器错误',
        description: '服务器暂时无法处理请求，请稍后重试',
      }

    case ErrorType.NOT_FOUND:
      return {
        title: '资源未找到',
        description: error.message || '请求的资源不存在',
      }

    case ErrorType.VALIDATION:
      return {
        title: '数据验证失败',
        description: error.message || '请检查输入的数据是否正确',
      }

    case ErrorType.UNAUTHORIZED:
      return {
        title: '未授权',
        description: '您没有权限执行此操作',
      }

    case ErrorType.CLIENT:
      return {
        title: '请求错误',
        description: error.message || '请求参数有误',
      }

    default:
      return {
        title: '操作失败',
        description: error.message || '发生未知错误，请稍后重试',
      }
  }
}

/**
 * 错误是否可重试
 */
export function isRetryableError(error: AppError): boolean {
  return error.type === ErrorType.NETWORK || error.type === ErrorType.SERVER
}

/**
 * 延迟函数（用于重试）
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 带重试的异步函数执行器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
    onRetry?: (attempt: number, error: AppError) => void
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options
  let lastError: AppError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = await parseFetchError(error)

      // 只有可重试的错误才重试
      if (!isRetryableError(lastError) || attempt === maxRetries - 1) {
        throw lastError
      }

      // 通知重试
      onRetry?.(attempt + 1, lastError)

      // 指数退避延迟
      await delay(retryDelay * Math.pow(2, attempt))
    }
  }

  throw lastError!
}
