"use client"

import type React from "react"

import { useState, useEffect, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { foodApi } from "@/lib/api-client"
import { AppError, getUserFriendlyMessage } from "@/lib/errors"

import { Food, FoodInput, foodCategoryNames } from "@/types/food"

const categories = foodCategoryNames;

// Memoized FoodCard component to prevent unnecessary re-renders
const FoodCard = memo(({ food, onEdit, onDelete }: {
  food: Food;
  onEdit: (food: Food) => void;
  onDelete: (id: number, name: string) => void
}) => (
  <Card
    className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-card/80 backdrop-blur-sm border-2"
  >
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg text-balance mb-2">{food.name}</CardTitle>
          {food.description && (
            <CardDescription className="text-sm">
              <MarkdownRenderer content={food.description} />
            </CardDescription>
          )}
        </div>
        <div className="flex gap-1 ml-3">
          <Button variant="ghost" size="sm" onClick={() => onEdit(food)} className="hover:bg-primary/10 hover:text-primary">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(food.id, food.name)}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <Badge variant="secondary" className="px-3 py-1">
        {food.category}
      </Badge>
    </CardContent>
  </Card>
));

FoodCard.displayName = 'FoodCard';

export function FoodManager({ onFoodsUpdated }: { onFoodsUpdated: () => void }) {
  const [foods, setFoods] = useState<Food[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<Food | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  })

  const { toast } = useToast()

  const fetchFoods = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await foodApi.getAll();
      setFoods(data);
    } catch (err) {
      const appError = err as AppError;
      console.error('Error fetching foods:', appError);

      const { title, description } = getUserFriendlyMessage(appError);
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const foodData: FoodInput = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      tags: [], // Tags not managed in form yet
    };

    try {
      if (editingFood) {
        await foodApi.update(editingFood.id, foodData);
        toast({
          title: "更新成功",
          description: `${foodData.name} 已更新`,
          variant: "success",
        });
      } else {
        await foodApi.create(foodData);
        toast({
          title: "添加成功",
          description: `${foodData.name} 已添加到菜单`,
          variant: "success",
        });
      }

      await fetchFoods(); // Refresh foods list from backend
      onFoodsUpdated(); // Notify parent component

      setFormData({ name: "", description: "", category: "" });
      setEditingFood(null);
      setIsAddDialogOpen(false);
    } catch (err) {
      const appError = err as AppError;
      console.error('Error saving food:', appError);

      const { title, description } = getUserFriendlyMessage(appError);
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, editingFood, fetchFoods, onFoodsUpdated, toast]);

  const handleDelete = useCallback(async (id: number, name: string) => {
    try {
      await foodApi.delete(id);
      toast({
        title: "删除成功",
        description: `${name} 已从菜单中移除`,
        variant: "success",
      });
      await fetchFoods(); // Refresh foods list from backend
      onFoodsUpdated(); // Notify parent component
    } catch (err) {
      const appError = err as AppError;
      console.error('Error deleting food:', appError);

      const { title, description } = getUserFriendlyMessage(appError);
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  }, [fetchFoods, onFoodsUpdated, toast]);

  const handleEdit = useCallback((food: Food) => {
    setEditingFood(food)
    setFormData({
      name: food.name,
      description: food.description,
      category: food.category,
    })
    setIsAddDialogOpen(true)
  }, []);

  const filteredFoods = foods.filter((food) => {
    const matchesSearch =
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || food.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">我的美食菜单</h2>
          <p className="text-muted-foreground">共 {foods.length} 道美食</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingFood(null)
                setFormData({ name: "", description: "", category: "" })
              }}
              className="px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加美食
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl">{editingFood ? "编辑美食" : "添加新美食"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    美食名称 *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：宫保鸡丁"
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    描述
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="支持Markdown语法，如：**粗体**、*斜体*、`代码`、## 标题、- [ ] 复选框"
                    rows={6}
                    className="resize-none mt-2"
                  />
                  {formData.description && (
                    <div className="mt-3 p-4 rounded-lg text-sm max-h-32 overflow-y-auto bg-input/90 text-foreground border border-border/50 dark:bg-[rgba(255,255,255,0.08)] dark:text-white dark:border-white/10">
                      <p className="text-xs font-medium text-muted-foreground/80 dark:text-white/70 mb-2 tracking-wide">预览：</p>
                      <MarkdownRenderer content={formData.description} />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    选择分类 *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger className="mt-2 w-full">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/90 backdrop-blur-sm rounded-lg max-h-60 overflow-y-auto">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </div>
            <DialogFooter className="flex-shrink-0 pt-6 border-t">
              <Button type="submit" onClick={handleSubmit} disabled={isLoading} className="px-8">
                {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                {editingFood ? "更新" : "添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索美食..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-card/70 dark:bg-[rgba(255,255,255,0.08)] dark:text-white border border-border/60 backdrop-blur-sm">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent className="bg-card/90 backdrop-blur-sm rounded-lg max-h-60 overflow-y-auto">
            <SelectItem value="all">所有分类 ({foods.length})</SelectItem>
            {categories.map((category) => {
              const count = foods.filter((food) => food.category === category).length
              return (
                <SelectItem key={category} value={category}>
                  {category} ({count})
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFoods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredFoods.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{foods.length === 0 ? "开始添加美食" : "没有找到匹配的美食"}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {foods.length === 0
              ? "还没有添加任何美食，点击上方按钮开始创建您的美食菜单吧！"
              : "尝试调整搜索条件或选择不同的分类"}
          </p>
        </div>
      )}
    </div>
  )
}
