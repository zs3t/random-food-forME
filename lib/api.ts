/**
 * API 配置文件
 * 统一管理 API 基础 URL
 */

// API 基础 URL - 从环境变量读取，默认使用 /api/backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/backend'

/**
 * 通用 API 请求封装
 * @param endpoint - API 端点路径 (如 '/foods')
 * @param options - fetch 选项
 * @returns Promise<T>
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
