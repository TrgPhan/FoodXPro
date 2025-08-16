"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import FoodCard from "@/components/food-card"
import Header from "@/components/ui/header"
import { CheckCircle, XCircle, Utensils, RefreshCw, Loader2, AlertCircle, Settings } from "lucide-react"
import { useRecipes } from "@/hooks/useFood"
import { type SortBy, type SortOrder } from "@/lib/food"

// Sort options
const SORT_OPTIONS = [
  { value: "prep_time", label: "Thời gian chuẩn bị" },
  { value: "cook_time", label: "Thời gian nấu" },
  { value: "total_time", label: "Tổng thời gian" },
  { value: "calories", label: "Calories" },
  { value: "protein", label: "Protein" },
  { value: "fat", label: "Chất béo" },
  { value: "carbs", label: "Carbohydrates" },
]

const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Tăng dần" },
  { value: "desc", label: "Giảm dần" },
]

export default function FoodScreen() {
  const [showFilters, setShowFilters] = useState(false)
  const [includeAllergies, setIncludeAllergies] = useState(false)
  const [activeTab, setActiveTab] = useState("du")
  
  const {
    sufficientRecipes,
    insufficientRecipes,
    loading,
    sufficientLoading,
    insufficientLoading,
    error,
    sufficientParams,
    insufficientParams,
    setSufficientParams,
    setInsufficientParams,
    refresh,
  } = useRecipes({
    autoFetch: true,
    initialSufficientParams: {
      sort_by: "total_time",
      sort_order: "asc",
      include_allergies: false
    },
    initialInsufficientParams: {
      num_missing: 1,
      num_recipes: 100,
      sort_by: "total_time",
      sort_order: "asc"
    }
  })

  // Handle sort changes for sufficient recipes
  const handleSufficientSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSufficientParams({
      ...sufficientParams,
      sort_by: e.target.value as SortBy
    })
  }

  const handleSufficientSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSufficientParams({
      ...sufficientParams,
      sort_order: e.target.value as SortOrder
    })
  }

  // Handle sort changes for insufficient recipes
  const handleInsufficientSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInsufficientParams({
      ...insufficientParams,
      sort_by: e.target.value as SortBy
    })
  }

  const handleInsufficientSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInsufficientParams({
      ...insufficientParams,
      sort_order: e.target.value as SortOrder
    })
  }

  // Handle insufficient recipes parameters
  const handleNumMissingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1
    setInsufficientParams({
      ...insufficientParams,
      num_missing: Math.max(1, value)
    })
  }

  const handleNumRecipesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1
    setInsufficientParams({
      ...insufficientParams,
      num_recipes: Math.max(1, Math.min(1000, value))
    })
  }

  // Handle include allergies filter
  const handleIncludeAllergiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIncludeAllergies(checked)
    setSufficientParams({
      ...sufficientParams,
      include_allergies: checked
    })
  }

  // Sync includeAllergies state with sufficientParams
  useEffect(() => {
    setIncludeAllergies(sufficientParams.include_allergies || false)
  }, [sufficientParams.include_allergies])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setShowFilters(false) // Hide filters when switching tabs
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <Header
        icon={Utensils}
        title="Thực Đơn"
        subtitle="Khám phá các món ăn bạn có thể làm"
        gradientFrom="from-orange-500"
        gradientTo="to-amber-600"
      />

      <div className="flex-1 overflow-hidden">
        <div className="px-6 py-4 h-full">
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Tổng: {(sufficientRecipes?.length || 0) + (insufficientRecipes?.length || 0)} công thức
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Settings size={16} />
                Bộ lọc
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Filter Controls - Only show for active tab */}
          {showFilters && (
            <Card className="p-4 mb-4 bg-gray-50">
              {activeTab === "du" ? (
                /* Sufficient Recipes Controls */
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
                      <select
                        value={sufficientParams.sort_by || ""}
                        onChange={handleSufficientSortByChange}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">-- Chọn --</option>
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Thứ tự:</span>
                      <select
                        value={sufficientParams.sort_order || ""}
                        onChange={handleSufficientSortOrderChange}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">-- Chọn --</option>
                        {SORT_ORDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="include-allergies"
                        checked={includeAllergies}
                        onChange={handleIncludeAllergiesChange}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="include-allergies" className="text-sm font-medium text-gray-700">
                        Bao gồm công thức có thể gây dị ứng
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Insufficient Recipes Controls */
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Số nguyên liệu thiếu:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={insufficientParams.num_missing}
                        onChange={handleNumMissingChange}
                        className="w-20 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Số công thức hiển thị:</span>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={insufficientParams.num_recipes}
                        onChange={handleNumRecipesChange}
                        className="w-24 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
                      <select
                        value={insufficientParams.sort_by || ""}
                        onChange={handleInsufficientSortByChange}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">-- Chọn --</option>
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Thứ tự:</span>
                      <select
                        value={insufficientParams.sort_order || ""}
                        onChange={handleInsufficientSortOrderChange}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">-- Chọn --</option>
                        {SORT_ORDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-4 mb-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <div>
                  <h3 className="font-semibold">Có lỗi xảy ra</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </Card>
          )}

          <Tabs defaultValue="du" className="h-full flex flex-col" onValueChange={handleTabChange}>
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 flex-shrink-0">
              <TabsTrigger value="du" className="text-green-600 data-[state=active]:bg-green-50">
                <CheckCircle size={16} className="mr-2" />
                ĐỦ NGUYÊN LIỆU ({sufficientRecipes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="thieu" className="text-red-600 data-[state=active]:bg-red-50">
                <XCircle size={16} className="mr-2" />
                THIẾU NGUYÊN LIỆU ({insufficientRecipes?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="du" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pb-10">
                {sufficientLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-lg font-medium">Đang tải công thức...</span>
                    </div>
                  </div>
                ) : !sufficientRecipes || sufficientRecipes.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-600">
                      <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">Chưa có công thức nào</h3>
                      <p className="text-sm">
                        Hiện tại chưa có công thức nào bạn có thể làm được với nguyên liệu hiện có.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6 px-3 py-3">
                    {(sufficientRecipes || []).map((recipeData, index) => (
                      <FoodCard
                        key={`sufficient-recipe-${recipeData.recipe.id}-${index}`}
                        recipe={recipeData.recipe}
                        nutritions={recipeData.nutritions}
                        ingredients={recipeData.ingredients}
                        isAvailable={true}
                        missingIngredients={[]}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="thieu" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pb-10">
                {insufficientLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-lg font-medium">Đang tải công thức...</span>
                    </div>
                  </div>
                ) : !insufficientRecipes || insufficientRecipes.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-600">
                      <XCircle size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">Không có công thức thiếu nguyên liệu</h3>
                      <p className="text-sm">
                        Tuyệt vời! Bạn có thể làm tất cả các công thức với nguyên liệu hiện có.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6 px-3 py-3">
                    {(insufficientRecipes || []).map((recipeData, index) => (
                      <FoodCard
                        key={`insufficient-recipe-${recipeData.recipe.id}-${index}`}
                        recipe={recipeData.recipe}
                        nutritions={recipeData.nutritions}
                        ingredients={recipeData.ingredients}
                        isAvailable={false}
                        missingIngredients={recipeData.missing_ingredients}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
