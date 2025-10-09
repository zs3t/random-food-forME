"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChefHat, Dice6, Plus, RefreshCw, X, ChevronDown, Sparkles, AlertCircle } from "lucide-react"
import { FoodManager } from "@/components/food-manager"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Food, foodCategories } from "@/types/food"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { foodApi } from "@/lib/api-client"
import { AppError, getUserFriendlyMessage } from "@/lib/errors"


export default function HomePage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [currentFood, setCurrentFood] = useState<Food | null>(null)
  const [selectedFoodType, setSelectedFoodType] = useState<string>("all")
  const [isRolling, setIsRolling] = useState(false)
  const [showManager, setShowManager] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFoods = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await foodApi.getAll();
      setFoods(data);
    } catch (err) {
      const appError = err as AppError;
      setError(appError);
      console.error('Error fetching foods:', appError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // Memoize filtered foods to avoid recalculating on every render
  const filteredFoods = useMemo(() => {
    if (selectedFoodType === "all") {
      return foods
    }
    return foods.filter((food) => food.category === selectedFoodType)
  }, [foods, selectedFoodType]);

  const rollRandomFood = useCallback(() => {
    if (filteredFoods.length === 0) {
      return
    }

    setIsRolling(true)
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * filteredFoods.length)
      const selectedFood = filteredFoods[randomIndex]
      setCurrentFood(selectedFood)
      setIsRolling(false)
    }, 1000)
  }, [filteredFoods]);

  // Memoize selected type to avoid recalculating
  const selectedType = useMemo(() =>
    foodCategories.find((type) => type.value === selectedFoodType) || foodCategories[0],
    [selectedFoodType]
  );

  if (showManager) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">菜单管理</h1>
            <Button variant="ghost" size="sm" onClick={() => setShowManager(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <FoodManager onFoodsUpdated={fetchFoods} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-section">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-lg font-medium mb-6">
              <Sparkles className="h-5 w-5" />
              智能美食推荐
            </div>
          </div>

          <div className="text-center mb-6">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger className="mb-8 px-6 py-4 text-base bg-card/90 backdrop-blur-sm border hover:bg-primary/5 hover:border-primary hover:text-primary hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium disabled:pointer-events-none disabled:opacity-50 h-10">
                  <ChefHat className="h-6 w-6 mr-3 text-primary" />
                  <span className="font-semibold">{selectedFoodType === "all" ? "吃什么？" : selectedType.label}</span>
                  <ChevronDown className="h-4 w-4 ml-3 text-primary" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-card/90 backdrop-blur-sm h-auto max-h-60 overflow-y-auto rounded-lg">
                {foodCategories.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => setSelectedFoodType(type.value)}
                    className="flex items-center gap-3 py-3 hover:bg-accent/30"
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="text-center mb-8">
            <Button
              onClick={rollRandomFood}
              disabled={isRolling || filteredFoods.length === 0}
              size="lg"
              className="px-10 py-5 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isRolling ? (
                <>
                  <RefreshCw className="h-6 w-6 mr-3 animate-spin" />
                  正在为您挑选...
                </>
              ) : (
                <>
                  <Dice6 className="h-6 w-6 mr-3" />
                  帮我选
                </>
              )}
            </Button>
            {filteredFoods.length > 0 && (
              <p className="text-sm text-muted-foreground mt-4">从 {filteredFoods.length} 道美食中为您推荐</p>
            )}
          </div>

          {currentFood && (
            <Card className="mb-8 bg-card/80 backdrop-blur-sm border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                  <Sparkles className="h-3 w-3" />
                  为您推荐
                </div>
                <h2 className="text-3xl font-bold mb-6 text-balance">{currentFood.name}</h2>
                {currentFood.description && (
                  <div className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    <MarkdownRenderer content={currentFood.description} />
                  </div>
                )}
                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge variant="default" className="px-3 py-1 text-sm">
                    {currentFood.category}
                  </Badge>
                  {currentFood.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="px-3 py-1 text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="mb-8 border-destructive/50 bg-destructive/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-1">
                      {getUserFriendlyMessage(error).title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {getUserFriendlyMessage(error).description}
                    </p>
                    <Button
                      onClick={fetchFoods}
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 hover:bg-destructive/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      重试
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading && !error && (
            <div className="text-center mb-8 p-8">
              <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          )}

          {!isLoading && !error && filteredFoods.length === 0 && (
            <div className="text-center mb-8 p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                <ChefHat className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                {foods.length === 0 ? "还没有添加任何美食" : "该分类下暂无美食"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">点击下方按钮开始管理您的美食菜单</p>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowManager(true)}
              className="flex items-center gap-2 px-6 py-3 hover:bg-card hover:text-primary hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              管理菜单
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
