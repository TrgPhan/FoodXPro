"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import IngredientForm, { IngredientData } from "@/components/ingredient-form"
import { addIngredient } from "@/lib/ingredients"

interface AddIngredientCardProps {
  onSave?: (ingredient: IngredientData) => void
  onRefresh?: () => void
}

export default function AddIngredientCard({ onSave, onRefresh }: AddIngredientCardProps) {
  let [currentState, setCurrentState] = useState<'button' | 'form'>('button')
  let [savedData, setSavedData] = useState<IngredientData | null>(null)

  let handleAddNew = () => {
    setCurrentState('form')
  }

  let handleSave = async (ingredient: IngredientData) => {
    // Validate required fields
    if (!ingredient.name.trim()) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!")
      return
    }

    try {
      let response = await addIngredient({
        name: ingredient.name,
        add_date: new Date().toISOString().split('T')[0],
        expire_date: ingredient.expire_date
      })

      if (response.status === 'success') {
        // Reset to button state to avoid duplicate cards
        setCurrentState('button')
        setSavedData(null)
        onSave?.(ingredient)
        onRefresh?.()
      } else {
        alert(`Lỗi: ${response.message}`)
      }
    } catch (error) {
      console.error('Error adding ingredient:', error)
      alert('Có lỗi xảy ra khi thêm nguyên liệu')
    }
  }

  let handleCancel = () => {
    setCurrentState('button')
  }

  // Render Add Button
  if (currentState === 'button') {
    return (
      <Card
        onClick={handleAddNew}
        className="group relative flex items-center justify-center h-[368px] bg-gradient-to-br from-slate-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 cursor-pointer transition-all duration-300 border-2 border-dashed border-gray-200 hover:border-green-300 hover:shadow-xl hover:scale-[1.02] rounded-xl overflow-hidden"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10 text-center text-gray-500 group-hover:text-green-600 transition-colors duration-300">
          {/* Icon Container */}
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mb-4 mx-auto group-hover:shadow-lg group-hover:border-green-200 transition-all duration-300">
            <Plus size={28} className="text-gray-600 group-hover:text-green-600 transition-colors" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">Thêm Nguyên Liệu</h3>
          <p className="text-sm text-gray-600 max-w-xs">
            Nhấn để thêm nguyên liệu mới vào kho của bạn
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-8 h-8 bg-green-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-4 left-4 w-6 h-6 bg-orange-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100" />
      </Card>
    )
  }

  // Render Form
  if (currentState === 'form') {
    return (
      <Card className="h-[368px] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative bg-white border border-gray-200">
        <IngredientForm
          isOpen={true}
          onClose={handleCancel}
          onSave={handleSave}
        />
      </Card>
    )
  }



  return null
} 