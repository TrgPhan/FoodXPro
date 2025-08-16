"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Edit, 
  Trash2, 
  Calendar, 
  Package, 
  ShoppingBag, 
  Plus, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon
} from "lucide-react"
import IngredientForm, { IngredientData } from "@/components/ingredient-form"
import { deleteIngredient, editIngredient } from "@/lib/ingredients"

interface IngredientCardProps {
  id: number
  name: string
  image?: string
  ingredients?: string[]
  add_date?: string
  expire_date?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  cookingTime?: string
  difficulty?: string
  onEdit?: (ingredient: IngredientData) => void
  onDelete?: (id: number) => void
  onRefresh?: () => void
}

// Utility function to format dates
const formatDate = (dateString?: string) => {
  if (!dateString) return "Không có"
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Calculate days until expiry
const getDaysUntilExpiry = (expireDate?: string) => {
  if (!expireDate) return null
  const today = new Date()
  const expiry = new Date(expireDate)
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Get status information based on expiry date
const getStatusInfo = (expireDate?: string) => {
  if (!expireDate) {
    return {
      badge: "Không có HSD",
      badgeClass: "bg-gray-100 text-gray-600",
      icon: ClockIcon
    }
  }

  const daysUntilExpiry = getDaysUntilExpiry(expireDate)
  
  if (daysUntilExpiry === null) {
    return {
      badge: "Không có HSD",
      badgeClass: "bg-gray-100 text-gray-600",
      icon: ClockIcon
    }
  }

  if (daysUntilExpiry < 0) {
    return {
      badge: "Đã hết hạn",
      badgeClass: "bg-red-100 text-red-700",
      icon: AlertTriangle
    }
  } else if (daysUntilExpiry <= 3) {
    return {
      badge: "Sắp hết hạn",
      badgeClass: "bg-orange-100 text-orange-700",
      icon: AlertTriangle
    }
  } else if (daysUntilExpiry <= 7) {
    return {
      badge: "Cần dùng sớm",
      badgeClass: "bg-yellow-100 text-yellow-700",
      icon: ClockIcon
    }
  } else {
    return {
      badge: "Còn hạn",
      badgeClass: "bg-green-100 text-green-700",
      icon: CheckCircle
    }
  }
}

let IngredientCard = ({ 
  id, 
  name, 
  image, 
  ingredients, 
  add_date, 
  expire_date, 
  calories,
  protein,
  carbs,
  fat,
  cookingTime,
  difficulty,
  onEdit, 
  onDelete, 
  onRefresh 
}: IngredientCardProps) => {
  let [isHovered, setIsHovered] = useState(false)
  let [isFormOpen, setIsFormOpen] = useState(false)
  let [editData, setEditData] = useState<IngredientData | undefined>()

  const daysUntilExpiry = getDaysUntilExpiry(expire_date)
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0
  const statusInfo = getStatusInfo(expire_date)
  const StatusIcon = statusInfo.icon

  let handleEdit = () => {
    setEditData({
      id: id.toString(),
      name,
      add_date: add_date || new Date().toISOString().split('T')[0],
      expire_date: expire_date || ""
    })
    setIsFormOpen(true)
  }

  let handleSave = async (ingredient: IngredientData) => {
    try {
      await editIngredient({
        id: parseInt(ingredient.id),
        expire_date: ingredient.expire_date
      })
      onEdit?.(ingredient)
      onRefresh?.()
      setIsFormOpen(false)
    } catch (error) {
      console.error('Error updating ingredient:', error)
      alert('Có lỗi xảy ra khi cập nhật nguyên liệu')
    }
  }

  let handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa nguyên liệu này?')) {
      try {
        await deleteIngredient(id)
        onDelete?.(id)
        onRefresh?.()
      } catch (error) {
        console.error('Error deleting ingredient:', error)
        alert('Có lỗi xảy ra khi xóa nguyên liệu')
      }
    }
  }

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 cursor-pointer bg-white hover:shadow-xl hover:scale-[1.02] ${
        isHovered
          ? "border-2 border-transparent bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 p-[1px]"
          : "border border-gray-200 hover:border-gray-300"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${isHovered ? "bg-white rounded-[7px]" : ""} h-full`}>
        {/* Header Section */}
        <div className="relative p-6 bg-gradient-to-br from-slate-50 to-gray-100 border-b border-gray-200">
          {/* Status Badge */}
          <div className="absolute top-4 right-4 z-10">
            <Badge className={`${statusInfo.badgeClass} border-0 shadow-sm text-xs font-medium`}>
              <StatusIcon size={12} className="mr-1" />
              {statusInfo.badge}
            </Badge>
          </div>

          {/* Main Content */}
          <div className="pr-20">
            {/* Icon Container */}
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mb-4">
              <ShoppingBag size={28} className="text-gray-600" />
            </div>

            {/* Food Name */}
            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight truncate">{name}</h3>


          </div>

          {/* Action Buttons Overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center gap-3 transition-all duration-300 z-20">
              <Button
                size="sm"
                variant="outline"
                className="w-12 h-12 rounded-full bg-white/90 hover:bg-white border-gray-200 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit()
                }}
              >
                <Edit size={16} className="text-gray-600" />
              </Button>
              <Button
                size="sm"
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Date Information */}
          <div className="space-y-3">
            {/* Add Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Plus size={14} />
                <span>Thêm vào</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatDate(add_date)}</span>
            </div>

            {/* Expiry Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} />
                <span>Hết hạn</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatDate(expire_date)}</span>
            </div>
          </div>

          {/* Days Counter - Large Display */}
          <div className="text-center py-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">
              {daysUntilExpiry !== null ? (isExpired ? Math.abs(daysUntilExpiry) : daysUntilExpiry) : "N/A"}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              {daysUntilExpiry !== null ? (isExpired ? "ngày quá hạn" : "ngày còn lại") : "Không có HSD"}
            </div>
          </div>

          {/* Additional Info if provided */}
          {(calories !== undefined || cookingTime) && (
            <div className="pt-4 border-t border-gray-100">
              {/* Nutritional Info Grid */}
              {calories !== undefined && protein !== undefined && carbs !== undefined && fat !== undefined && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="text-xs text-orange-600 font-medium">Calo</div>
                    <div className="text-sm font-bold text-orange-700">{calories}</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-xs text-red-600 font-medium">Protein</div>
                    <div className="text-sm font-bold text-red-700">{protein}g</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Carbs</div>
                    <div className="text-sm font-bold text-blue-700">{carbs}g</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="text-xs text-yellow-600 font-medium">Fat</div>
                    <div className="text-sm font-bold text-yellow-700">{fat}g</div>
                  </div>
                </div>
              )}

              {/* Cooking Time */}
              {cookingTime && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={14} />
                  <span>{cookingTime}</span>
                  {difficulty && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>{difficulty}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ingredients List */}
          {ingredients && ingredients.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="truncate">
                      • {ingredient}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Overlay */}
      <IngredientForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        editData={editData}
      />
    </Card>
  )
}

export default IngredientCard
