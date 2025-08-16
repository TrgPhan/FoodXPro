"use client"

import { useState, useEffect } from "react"
import { Search, Warehouse } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import Header from "@/components/ui/header"
import IngredientCard from "@/components/ingredient-card"
import AddIngredientCard from "@/components/add-ingredient-card"
import { Ingredient } from "@/lib/ingredients"
import { useIngredients } from "@/hooks/useIngredients"

export default function StoreScreen() {
  let { ingredients, addIngredient, updateIngredient, deleteIngredient, searchIngredients, refreshIngredients } = useIngredients()
  let [searchTerm, setSearchTerm] = useState("")
  let [filteredItems, setFilteredItems] = useState<Ingredient[]>([])

  // Filter ingredients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(ingredients)
    } else {
      let filtered = ingredients.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredItems(filtered)
    }
  }, [searchTerm, ingredients])

  return (
    <div className="h-full bg-white flex flex-col">
      <Header
        icon={Warehouse}
        title="Kho Nguyên Liệu"
        subtitle="Quản lý nguyên liệu và thực phẩm"
        gradientFrom="from-green-500"
        gradientTo="to-emerald-600"
      />

      <div className="px-4 py-3 border-b bg-white flex-shrink-0">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm kiếm nguyên liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-2"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Add New Card */}
              <AddIngredientCard onSave={addIngredient} onRefresh={refreshIngredients} />

              {/* Food Items */}
              {filteredItems.map((food) => (
                <IngredientCard
                  key={food.id}
                  id={food.id}
                  name={food.name}
                  image={food.image || "/placeholder.svg"} // Use API image if available
                  ingredients={food.ingredients || []} // Use API ingredients if available
                  add_date={food.add_date}
                  expire_date={food.expire_date}
                  onEdit={updateIngredient}
                  onDelete={deleteIngredient}
                  onRefresh={refreshIngredients}
                />
              ))}
            </div>

            {filteredItems.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Không tìm thấy nguyên liệu nào</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
