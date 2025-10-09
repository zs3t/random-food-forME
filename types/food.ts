/**
 * 数据库原始食物类型（从数据库直接读取）
 */
export interface DbFood {
  id: number  // INTEGER PRIMARY KEY
  name: string
  category: string
  description: string
  tags: string | string[] | null  // 数据库中存储为 JSON 字符串，API 可能返回数组
  image?: string
}

/**
 * 应用层食物类型（处理后的数据）
 */
export interface Food {
  id: number  // 修正：与数据库一致使用 number
  name: string
  description: string
  category: string
  tags: string[]  // 已解析的标签数组
  image?: string
}

/**
 * 创建/更新食物的请求类型
 */
export interface FoodInput {
  name: string
  category: string
  description?: string
  tags?: string[]
  image?: string
}

export const foodCategories = [
  { value: "all", label: "全部", icon: "🍽️" },
  { value: "主食", label: "主食", icon: "🍚" },
  { value: "凉拌", label: "凉拌", icon: "🥗" },
  { value: "卤菜", label: "卤菜", icon: "🍖" },
  { value: "早餐", label: "早餐", icon: "🥐" },
  { value: "汤类", label: "汤类", icon: "🍲" },
  { value: "炒菜", label: "炒菜", icon: "🍳" },
  { value: "炖菜", label: "炖菜", icon: "🥘" },
  { value: "炸品", label: "炸品", icon: "🍤" },
  { value: "烤类", label: "烤类", icon: "🍗" },
  { value: "烫菜", label: "烫菜", icon: "🥬" },
  { value: "煮锅", label: "煮锅", icon: "🍲" },
  { value: "砂锅菜", label: "砂锅菜", icon: "🥘" },
  { value: "蒸菜", label: "蒸菜", icon: "🥟" },
  { value: "配料", label: "配料", icon: "🧄" },
  { value: "饮品", label: "饮品", icon: "🥤" },
  { value: "甜品", label: "甜品", icon: "🍰" },
  { value: "小食", label: "小食", icon: "🍟" },
  { value: "中式", label: "中式", icon: "🇨🇳" },
  { value: "西式", label: "西式", icon: "🇪🇸" },
  { value: "日式", label: "日式", icon: "🇯🇵" },
  { value: "韩式", label: "韩式", icon: "🇰🇷" },
  { value: "泰式", label: "泰式", icon: "🇹🇭" },
  { value: "意式", label: "意式", icon: "🇮🇹" },
]

export const foodCategoryNames = foodCategories.filter(cat => cat.value !== "all").map(cat => cat.value);
