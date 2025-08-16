"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Calendar,
  Scale,
  Ruler,
  Heart,
  AlertTriangle,
  Edit,
  UserIcon as Male,
  UserIcon as Female,
  Target,
} from "lucide-react"
import UserProfileForm from "@/components/user-profile-form"
import { UserProfile } from "@/lib/types"

interface UserCardProps {
  userData: UserProfile
  onProfileUpdate?: () => void
}

export default function UserCard({ userData, onProfileUpdate }: UserCardProps) {
  const [showForm, setShowForm] = useState(false)

  const handleFormSuccess = () => {
    console.log("Profile updated successfully!")
    setShowForm(false)
    onProfileUpdate?.()
  }

  // Calculate BMI
  const calculateBMI = () => {
    const heightInMeters = userData.height / 100
    const bmi = userData.weight / (heightInMeters * heightInMeters)
    return bmi.toFixed(1)
  }

  // Get BMI status
  const getBMIStatus = () => {
    const bmi = Number.parseFloat(calculateBMI())
    if (bmi < 18.5) return { status: "Thiếu cân", color: "text-sky-700 bg-sky-50 border-sky-200" }
    if (bmi < 25) return { status: "Bình thường", color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
    if (bmi < 30) return { status: "Thừa cân", color: "text-amber-700 bg-amber-50 border-amber-200" }
    return { status: "Béo phì", color: "text-red-700 bg-red-50 border-red-200" }
  }

  const bmiStatus = getBMIStatus()

  // Get gender info
  const getGenderInfo = () => {
    if (userData.sex.toLowerCase() === "male") {
      return {
        icon: Male,
        color: "text-blue-700 bg-blue-50 border-blue-200",
        label: "Nam",
        emoji: "👨",
      }
    } else if (userData.sex.toLowerCase() === "female") {
      return {
        icon: Female,
        color: "text-pink-700 bg-pink-50 border-pink-200",
        label: "Nữ",
        emoji: "👩",
      }
    }
    return {
      icon: User,
      color: "text-gray-700 bg-gray-50 border-gray-200",
      label: "Khác",
      emoji: "👤",
    }
  }

  const genderInfo = getGenderInfo()
  const GenderIcon = genderInfo.icon

  // Convert goal to Vietnamese
  const getGoalInVietnamese = (goal: string) => {
    switch (goal.toLowerCase()) {
      case 'bulking':
        return 'Tăng Cân'
      case 'maintaining':
        return 'Duy Trì'
      case 'cutting':
        return 'Giảm Cân'
      default:
        return goal
    }
  }

  return (
    <Card className="h-full bg-white border border-gray-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
              {genderInfo.emoji}
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">{userData.full_name || "Người dùng"}</h3>
              <p className="text-xs text-gray-500">Thông tin cá nhân</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm" variant="outline" className="gap-2 text-xs">
            <Edit size={12} />
            Sửa
          </Button>
        </div>

      </div>

      {/* Main Content */}
      <div className="px-4 pb-6 flex-1 flex flex-col space-y-3">
        {/* Basic Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Age */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-slate-600" />
              <span className="text-xs font-medium text-slate-700">Tuổi</span>
            </div>
            <div className="text-base font-semibold text-slate-800">{userData.age || 0}</div>
          </div>

          {/* Gender */}
          <div className={`p-3 rounded-lg border ${genderInfo.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <GenderIcon size={14} />
              <span className="text-xs font-medium">Giới tính</span>
            </div>
            <div className="text-base font-semibold">{genderInfo.label}</div>
          </div>

          {/* Weight */}
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <Scale size={14} className="text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Cân nặng</span>
            </div>
            <div className="text-base font-semibold text-emerald-800">{userData.weight || 0} kg</div>
          </div>

          {/* Height */}
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Ruler size={14} className="text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Chiều cao</span>
            </div>
            <div className="text-base font-semibold text-orange-800">{userData.height || 0} cm</div>
          </div>

          {/* BMI */}
          <div className="p-3 rounded-lg border bg-red-50 border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <User size={14} className="text-red-600" />
              <span className="text-xs font-medium text-red-700">BMI</span>
              <Badge
                className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 font-medium border-0"
              >
                {bmiStatus.status}
              </Badge>
            </div>
            <div className="text-base font-semibold text-red-800">{calculateBMI()}</div>
          </div>

          {/* Goal */}
          <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-violet-600" />
              <span className="text-xs font-medium text-violet-700">Mục tiêu</span>
            </div>
            <div className="text-base font-semibold text-violet-800">{getGoalInVietnamese(userData.goal)}</div>
          </div>
        </div>


      </div>

      {/* User Profile Form */}
      <UserProfileForm 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onSuccess={handleFormSuccess}
        isEdit={true}
        initialData={userData}
      />
    </Card>
  )
}
