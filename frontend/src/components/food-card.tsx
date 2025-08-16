"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Flame, Beef, Wheat, Droplets, AlertTriangle, Sparkles, Plus } from "lucide-react"
import FoodDetailModal from "@/components/food-detail-modal"
import { useDailyMeals } from "@/hooks/useDailyMeals"

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

interface FoodCardProps {
  recipe: Recipe
  nutritions: Nutrition[]
  ingredients: Ingredient[]
  isAvailable?: boolean
  missingIngredients?: MissingIngredient[]
}

const mealPeriods = [
  { id: "breakfast", label: "Sáng", icon: "🌅" },
  { id: "lunch", label: "Trưa", icon: "☀️" },
  { id: "dinner", label: "Tối", icon: "🌙" },
  { id: "snack", label: "Phụ", icon: "🍎" },
] as const

export default function FoodCard({
  recipe,
  nutritions,
  ingredients,
  isAvailable = true,
  missingIngredients = [],
}: FoodCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isCalorieHovered, setIsCalorieHovered] = useState(false)
  const [showMealButtons, setShowMealButtons] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [hoveredMeal, setHoveredMeal] = useState<string | null>(null)
  const [hoveredAdd, setHoveredAdd] = useState(false)
  const [isAddingMeal, setIsAddingMeal] = useState(false)

  const { addMeal } = useDailyMeals()

  // Truncate description
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Only allow adding if ingredients are available
    if (!isAvailable) return

    setIsAnimating(true)

    // Start shrink animation
    setTimeout(() => {
      setShowMealButtons(true)
      setIsAnimating(false)
    }, 300)
  }

  const handleMealSelect = async (e: React.MouseEvent, mealPeriod: string) => {
    e.stopPropagation()
    
    if (!isAvailable) return

    try {
      setIsAddingMeal(true)
      setHoveredMeal(mealPeriod)

      // Map meal period to eat_at parameter
      const eatAtMap: Record<string, "breakfast" | "lunch" | "dinner" | "snack"> = {
        "breakfast": "breakfast",
        "lunch": "lunch",
        "dinner": "dinner",
        "snack": "snack"
      }

      const eatAt = eatAtMap[mealPeriod]
      if (!eatAt) {
        throw new Error("Invalid meal period")
      }

      // Add meal to daily meals
      const response = await addMeal({
        recipe_id: recipe.id,
        eat_at: eatAt
      })

      if (response.success) {
        console.log(`✅ Added ${recipe.name} to ${mealPeriod}`)
      } else {
        throw new Error(response.message || 'Failed to add meal')
      }
    } catch (error) {
      console.error('Error adding meal:', error)
    } finally {
      setIsAddingMeal(false)
      setHoveredMeal(null)
      setShowMealButtons(false)
      setIsCalorieHovered(false)
      setIsHovered(false)
    }
  }

  const handleCardClick = () => {
    if (!showMealButtons) {
      setShowDetail(true)
    }
  }

  // determine if image should load
  const shouldLoadImage = recipe.image_url && !recipe.image_url.includes("allrecipes.com/recipe")

  return (
    <>
      <Card
        className={`group overflow-hidden transition-all duration-300 cursor-pointer bg-white hover:shadow-xl hover:scale-[1.02] ${
          isHovered
            ? "border-2 border-transparent bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 p-[1px]"
            : "border border-gray-200 hover:border-gray-300"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsCalorieHovered(false)
          setShowMealButtons(false)
          setIsAnimating(false)
          setHoveredMeal(null)
          setHoveredAdd(false)
        }}
        onClick={handleCardClick}
      >
        <div className={`${isHovered ? "bg-white rounded-[7px]" : ""} h-full flex flex-col`}>
          {/* Header Section */}
          <div className="relative p-5 h-44 bg-gradient-to-br from-slate-50 to-gray-100 border-b border-gray-200 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={shouldLoadImage ? recipe.image_url : "/placeholder.svg"}
                alt={recipe.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.onerror = null // stop infinite loop
                  target.src = "/placeholder.svg"
                }}
              />
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]"></div>
            </div>
            
            {/* Status Badge */}
            <div className="absolute top-3 right-3 z-20">
              {isAvailable ? (
                <Badge className="bg-green-500 text-white border-0 shadow-sm text-xs font-medium">
                  <Sparkles size={10} className="mr-1" />
                  Có thể làm
                </Badge>
              ) : (
                <Badge className="bg-red-500 text-white border-0 shadow-sm text-xs font-medium">
                  <AlertTriangle size={10} className="mr-1" />
                  Thiếu nguyên liệu
                </Badge>
              )}
            </div>

            {/* Main Content */}
            <div className="relative z-10 pr-16">
              {/* Image Container */}
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mb-3 overflow-hidden">
                <img
                  src={shouldLoadImage ? recipe.image_url : "/placeholder.svg"}
                  alt={recipe.name}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    const recipeName = encodeURIComponent(recipe.name)
                    target.onerror = null
                    target.src = `/placeholder.svg?height=56&width=56&text=${recipeName}`
                  }}
                />
              </div>

              {/* Recipe Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight line-clamp-2">{recipe.name}</h3>

              {/* Time & Servings */}
              <div className="flex items-center gap-3 text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className="text-sm font-medium">{recipe.total_time} phút</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span className="text-sm font-medium">{recipe.servings} người</span>
                </div>
              </div>
            </div>

            {/* Hover Content - overlay with blur */}
            {isHovered && (
              <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300 z-30">
                {isAvailable ? (
                  !showMealButtons ? (
                    <div
                      className="text-center transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setIsCalorieHovered(true)}
                      onMouseLeave={() => setIsCalorieHovered(false)}
                      onClick={handleAddClick}
                    >
                      {!isCalorieHovered ? (
                        <div
                          className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:scale-105 transition-all duration-300 ${
                            isAnimating ? "scale-50 opacity-0" : "scale-100 opacity-100"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Flame size={18} className="text-orange-500" />
                            <span className="text-lg font-bold text-gray-900">+{recipe.calories}</span>
                          </div>
                          <div className="text-xs text-gray-600">Calories sẽ tăng</div>
                        </div>
                      ) : (
                        <div className="relative group/add">
                          <div
                            className={`transition-all duration-300 rounded-xl ${
                              hoveredAdd
                                ? "bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 p-[2px]"
                                : "bg-transparent"
                            } ${isAnimating ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}
                            onMouseEnter={() => setHoveredAdd(true)}
                            onMouseLeave={() => setHoveredAdd(false)}
                          >
                            <div
                              className={`bg-white/90 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex items-center justify-center ${
                                hoveredAdd ? "rounded-[10px]" : "rounded-xl"
                              }`}
                              style={{ width: "120px", height: "64px", padding: "12px" }}
                            >
                              <Plus size={24} className="text-gray-700" />
                            </div>
                          </div>
                          <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-200 pointer-events-none ${isAnimating ? "opacity-0" : "opacity-0 group-hover/add:opacity-100"}`}> 
                            <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-lg border border-gray-200">Thêm vào lịch</div>
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Meal Selection Buttons */
                    <div className="flex items-center justify-center gap-3 animate-in fade-in-0 zoom-in-95 duration-300">
                      {mealPeriods.map((period, index) => (
                        <div key={period.id} className="relative group/meal">
                          <div className={`transition-all duration-300 rounded-lg ${hoveredMeal === period.id ? "bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 p-[2px]" : "bg-transparent"}`}>
                            <div
                              className={`w-12 h-12 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-2 flex items-center justify-center cursor-pointer ${hoveredMeal === period.id ? "rounded-[6px]" : ""} ${isAddingMeal && hoveredMeal === period.id ? "opacity-50" : ""}`}
                              style={{ animationDelay: `${index * 100}ms` }}
                              onMouseEnter={() => !isAddingMeal && setHoveredMeal(period.id)}
                              onMouseLeave={() => !isAddingMeal && setHoveredMeal(null)}
                              onClick={(e) => !isAddingMeal && handleMealSelect(e, period.id)}
                            >
                              {isAddingMeal && hoveredMeal === period.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                              ) : (
                                <span className="text-xl">{period.icon}</span>
                              )}
                            </div>
                          </div>
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/meal:opacity-100 transition-all duration-200 pointer-events-none">
                            <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-lg border border-gray-200">{period.label}</div>
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-white"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* Not available: only show calories prediction */
                  <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame size={18} className="text-orange-500" />
                      <span className="text-lg font-bold text-gray-900">+{recipe.calories}</span>
                    </div>
                    <div className="text-xs text-gray-600">Calories sẽ tăng</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-5 flex-1 flex flex-col">
            {/* Description */}
            <div className="mb-3">
              <p className="text-gray-700 text-sm leading-relaxed">{truncateText(recipe.description, 100)}</p>
            </div>

            {/* Missing Ingredients (if any) */}
            {!isAvailable && missingIngredients.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  Thiếu nguyên liệu
                </h4>
                <div className="flex flex-wrap gap-1">
                  {missingIngredients.slice(0, 3).map((ingredient, index) => (
                    <Badge key={index} className="bg-red-100 text-red-700 text-xs px-2 py-1">
                      {ingredient.ingredient_name}
                    </Badge>
                  ))}
                  {missingIngredients.length > 3 && (
                    <Badge className="bg-red-100 text-red-700 text-xs px-2 py-1">
                      +{missingIngredients.length - 3} khác
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Spacer to push macros to bottom */}
            <div className="flex-1"></div>

            {/* Macros - Simple Design */}
            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Flame size={12} />
                  <span>Calories</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{recipe.calories}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Beef size={12} />
                  <span>Protein</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{recipe.protein}g</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Wheat size={12} />
                  <span>Carbs</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{recipe.carbs}g</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Droplets size={12} />
                  <span>Fat</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{recipe.fat}g</span>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{ingredients?.length || 0} nguyên liệu</span>
                <span>Tổng: {recipe.total_time} phút</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <FoodDetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        recipe={recipe}
        nutritions={nutritions}
        ingredients={ingredients}
        missingIngredients={missingIngredients}
      />
    </>
  )
}