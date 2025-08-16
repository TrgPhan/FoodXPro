"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Users, Flame, Beef, Wheat, Droplets, ChefHat, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Recipe {
  id: number
  name: string
  image_url: string
  description: string
  prep_time: number
  cook_time: number
  total_time: number
  servings: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

interface Nutrition {
  id: number
  name: string
  unit: string
  value: number
  percent: number
}

interface Ingredient {
  ingredient_id: number
  ingredient_name: string
  required_amount: number
  unit: string | null
}

interface MissingIngredient {
  ingredient_name: string
  required_amount: number
  unit: string
}

interface FoodDetailModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe
  nutritions: Nutrition[]
  ingredients: Ingredient[]
  missingIngredients?: MissingIngredient[]
}

export default function FoodDetailModal({ isOpen, onClose, recipe, nutritions, ingredients, missingIngredients = [] }: FoodDetailModalProps) {
  const getRecipeEmoji = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("beef") || lowerName.includes("steak")) return "🥩"
    if (lowerName.includes("chicken")) return "🍗"
    if (lowerName.includes("fish") || lowerName.includes("salmon")) return "🐟"
    if (lowerName.includes("pasta")) return "🍝"
    if (lowerName.includes("salad")) return "🥗"
    if (lowerName.includes("soup")) return "🍲"
    if (lowerName.includes("pizza")) return "🍕"
    if (lowerName.includes("burger")) return "🍔"
    return "🍽️"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white border-0 shadow-2xl p-0 rounded-lg" showCloseButton={false}>
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center overflow-hidden">
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="w-full h-full object-cover rounded-3xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `<span class="text-4xl">${getRecipeEmoji(recipe.name)}</span>`
                    }
                  }}
                />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-2">{recipe.name}</DialogTitle>
                <div className="flex items-center gap-4 text-green-100">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{recipe.total_time} phút</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{recipe.servings} người</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat size={16} />
                    <span>{ingredients?.length || 0} nguyên liệu</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X size={20} />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-200px)] pb-4">
          <div className="p-6 space-y-6 pb-2">
            {/* Main Macros */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-center">
                <Flame size={24} className="text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-800">{recipe.calories}</div>
                <div className="text-sm text-orange-600">Calories</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                <Beef size={24} className="text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-800">{recipe.protein}g</div>
                <div className="text-sm text-red-600">Protein</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                <Wheat size={24} className="text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-800">{recipe.carbs}g</div>
                <div className="text-sm text-blue-600">Carbs</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                <Droplets size={24} className="text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-800">{recipe.fat}g</div>
                <div className="text-sm text-yellow-600">Fat</div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Mô tả</h3>
              <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
            </div>

            {/* Time Breakdown */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Thời gian</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-800">{recipe.prep_time}</div>
                  <div className="text-sm text-blue-600">Chuẩn bị (phút)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-800">{recipe.cook_time}</div>
                  <div className="text-sm text-blue-600">Nấu (phút)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-800">{recipe.total_time}</div>
                  <div className="text-sm text-blue-600">Tổng (phút)</div>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {ingredients && ingredients.length > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Nguyên liệu ({ingredients?.length || 0})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(ingredients || []).map((ingredient, index) => (
                    <div
                      key={`ingredient-${ingredient.ingredient_id}-${index}`}
                      className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200"
                    >
                      <span className="font-medium text-gray-800 capitalize">{ingredient.ingredient_name}</span>
                      <Badge className="bg-green-100 text-green-700">
                        {ingredient.required_amount.toFixed(1)} {ingredient.unit || ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Ingredients */}
            {missingIngredients && missingIngredients.length > 0 && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-3">Nguyên liệu thiếu ({missingIngredients.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {missingIngredients.map((ingredient, index) => (
                    <div
                      key={`missing-ingredient-${index}`}
                      className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200"
                    >
                      <span className="font-medium text-gray-800 capitalize">{ingredient.ingredient_name}</span>
                      <Badge className="bg-red-100 text-red-700">
                        {ingredient.required_amount.toFixed(1)} {ingredient.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Nutrition */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Thông tin dinh dưỡng chi tiết</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(nutritions || []).map((nutrition, index) => (
                  <div
                    key={`nutrition-${nutrition.id}-${index}`}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-200"
                  >
                    <span className="font-medium text-gray-800">{nutrition.name}</span>
                    <div className="text-right">
                      <div className="font-bold text-purple-800">
                        {nutrition.value} {nutrition.unit}
                      </div>
                      {nutrition.percent > 0 && <div className="text-xs text-purple-600">{nutrition.percent}% DV</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
