/**
 * API 客户端
 * 封装所有 API 请求，提供统一的错误处理和重试机制
 */

import { Food, DbFood, FoodInput } from '@/types/food'
import { API_BASE_URL } from '@/lib/api'
import { parseFetchError, withRetry } from '@/lib/errors'

/**
 * API 请求配置
 */
interface ApiRequestOptions extends RequestInit {
  retry?: boolean
  maxRetries?: number
}

/**
 * 通用 API 请求函数
 */
async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { retry = false, maxRetries = 3, ...fetchOptions } = options

  const performRequest = async (): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    })

    if (!response.ok) {
      throw response
    }

    return response.json()
  }

  try {
    if (retry) {
      return await withRetry(performRequest, {
        maxRetries,
        retryDelay: 1000,
        onRetry: (attempt, error) => {
          console.log(`重试请求 (${attempt}/${maxRetries}):`, error.message)
        },
      })
    }

    return await performRequest()
  } catch (error) {
    throw await parseFetchError(error)
  }
}

/**
 * 将数据库食物数据转换为应用层数据
 */
function transformDbFood(dbFood: DbFood): Food {
  let parsedTags: string[] = []

  if (dbFood.tags) {
    try {
      // 如果 tags 已经是数组，直接使用
      if (Array.isArray(dbFood.tags)) {
        parsedTags = dbFood.tags
      } else if (typeof dbFood.tags === 'string') {
        // 如果是字符串，尝试解析
        parsedTags = JSON.parse(dbFood.tags)
      }
    } catch (error) {
      console.error('Error parsing tags:', dbFood.tags, error)
      parsedTags = []
    }
  }

  return {
    ...dbFood,
    tags: parsedTags,
  }
}

/**
 * 食物 API 客户端
 */
export const foodApi = {
  /**
   * 获取所有食物列表
   */
  async getAll(category?: string): Promise<Food[]> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''
    const dbFoods = await apiRequest<DbFood[]>(`/foods${query}`, { retry: true })
    return dbFoods.map(transformDbFood)
  },

  /**
   * 根据 ID 获取食物
   */
  async getById(id: number): Promise<Food> {
    const dbFood = await apiRequest<DbFood>(`/foods/${id}`)
    return transformDbFood(dbFood)
  },

  /**
   * 创建新食物
   */
  async create(food: FoodInput): Promise<Food> {
    const dbFood = await apiRequest<DbFood>('/foods', {
      method: 'POST',
      body: JSON.stringify(food),
    })
    return transformDbFood(dbFood)
  },

  /**
   * 更新食物
   */
  async update(id: number, food: FoodInput): Promise<Food> {
    const dbFood = await apiRequest<DbFood>(`/foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(food),
    })
    return transformDbFood(dbFood)
  },

  /**
   * 删除食物
   */
  async delete(id: number): Promise<void> {
    await apiRequest<{ message: string; id: number }>(`/foods/${id}`, {
      method: 'DELETE',
    })
  },
}

/**
 * 导出便捷函数（向后兼容）
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(endpoint, options)
}
