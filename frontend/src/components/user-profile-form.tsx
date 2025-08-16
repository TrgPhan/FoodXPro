"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  User,
  Target,
  Activity,
  Heart,
  Scale,
  Ruler,
  Calendar,
  Zap,
  AlertTriangle,
} from "lucide-react"
import { UserProfileForm as UserProfileFormType, UserProfile } from "@/lib/types"
import { addUserProfile, editUserProfile } from "@/lib/profile"
import { searchAllergies, AllergySearchResult } from "@/lib/allergies"

interface UserProfileFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  isEdit?: boolean
  initialData?: UserProfile
}

interface FormData {
  full_name: string
  age: number
  sex: string
  weight: number
  height: number
  goal: string
  activity_level: string
  allergies: Array<{ id: number; name: string }>
  health_conditions: Array<{ id: number; name: string }>
}

const UserProfileForm = ({ isOpen, onClose, onSuccess, isEdit = false, initialData }: UserProfileFormProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedGenderId, setSelectedGenderId] = useState("")
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    age: 0,
    sex: "",
    weight: 0,
    height: 0,
    goal: "",
    activity_level: "",
    allergies: [],
    health_conditions: [],
  })
  const [allergyInput, setAllergyInput] = useState("")
  const [healthConditionInput, setHealthConditionInput] = useState("")
  const [allergySearchResults, setAllergySearchResults] = useState<AllergySearchResult[]>([])
  const [showAllergySearch, setShowAllergySearch] = useState(false)
  const [isSearchingAllergies, setIsSearchingAllergies] = useState(false)
  const [allergySearchCache, setAllergySearchCache] = useState<Map<string, AllergySearchResult[]>>(new Map())

  // Load initial data when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        full_name: initialData.full_name,
        age: initialData.age,
        sex: initialData.sex,
        weight: initialData.weight,
        height: initialData.height,
        goal: initialData.goal,
        activity_level: initialData.activity_level,
        allergies: initialData.allergies,
        health_conditions: initialData.health_conditions,
      })
      // Find and set the selected gender ID based on the sex value
      const selectedGender = genderOptions.find(option => option.value === initialData.sex)
      if (selectedGender) {
        setSelectedGenderId(selectedGender.id)
      }
    }
  }, [isEdit, initialData])



  const goals = [
    {
      id: "bulking",
      label: "Tăng Cân",
      value: "Bulking",
      desc: "Xây dựng cơ bắp",
      icon: "💪",
      color: "bg-green-50 border-green-200 text-green-700",
    },
    {
      id: "maintaining",
      label: "Duy Trì",
      value: "Maintaining",
      desc: "Giữ cân nặng hiện tại",
      icon: "⚖️",
      color: "bg-blue-50 border-blue-200 text-blue-700",
    },
    {
      id: "cutting",
      label: "Giảm Cân",
      value: "Cutting",
      desc: "Đốt cháy mỡ thừa",
      icon: "🔥",
      color: "bg-orange-50 border-orange-200 text-orange-700",
    },
  ]

  const activityLevels = [
    { id: "sedentary", label: "Ít Vận Động", value: "Sedentary", desc: "Chủ yếu ngồi làm việc", icon: "🪑" },
    { id: "lightly_active", label: "Nhẹ Nhàng", value: "Lightly Active", desc: "1-3 ngày/tuần", icon: "🚶" },
    { id: "moderately_active", label: "Trung Bình", value: "Moderately Active", desc: "3-5 ngày/tuần", icon: "🏃" },
    { id: "very_active", label: "Tích Cực", value: "Very Active", desc: "6-7 ngày/tuần", icon: "🏋️" },
    { id: "super_active", label: "Rất Tích Cực", value: "Super Active", desc: "2 lần/ngày", icon: "⚡" },
  ]

  const genderOptions = [
    { id: "male", label: "Nam", value: "male", icon: "👨", color: "bg-blue-50 border-blue-200 text-blue-700" },
    { id: "female", label: "Nữ", value: "female", icon: "👩", color: "bg-pink-50 border-pink-200 text-pink-700" },
    { id: "other", label: "Khác", value: "male", icon: "👤", color: "bg-gray-50 border-gray-200 text-gray-700" },
  ]

  const steps = [
    { title: "Thông Tin Cơ Bản", subtitle: "Cho chúng tôi biết về bạn", icon: User },
    { title: "Mục Tiêu", subtitle: "Bạn muốn đạt được điều gì?", icon: Target },
    { title: "Cường Độ Vận Động", subtitle: "Mức độ hoạt động của bạn", icon: Activity },
    { title: "Dị Ứng", subtitle: "Thông tin dị ứng thực phẩm", icon: Heart },
    { title: "Tình Trạng Sức Khỏe", subtitle: "Thông tin bệnh lý", icon: AlertTriangle },
  ]

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      // Convert form data to API format
      const apiData = {
        full_name: formData.full_name,
        age: formData.age,
        sex: formData.sex,
        weight: formData.weight,
        height: formData.height,
        goal: formData.goal,
        activity_level: formData.activity_level,
        allergy: formData.allergies.map(allergy => allergy.name), // Convert to array of strings
        health_condition: formData.health_conditions.map(condition => condition.name) // Convert to array of strings
      }
      
      if (isEdit) {
        await editUserProfile(apiData)
      } else {
        await addUserProfile(apiData)
      }
      
      onSuccess()
      onClose()
      setCurrentStep(0)
      setSelectedGenderId("")
      setFormData({
        full_name: "",
        age: 0,
        sex: "",
        weight: 0,
        height: 0,
        goal: "",
        activity_level: "",
        allergies: [],
        health_conditions: [],
      })
    } catch (error) {
      console.error("Error saving user profile:", error)
      alert("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.")
    }
  }

  // Search allergies function with debounce and cache
  const searchAllergiesHandler = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        
        // Show loading immediately for better UX
        if (query.trim().length >= 1) {
          setIsSearchingAllergies(true)
          setShowAllergySearch(true)
        } else {
          setAllergySearchResults([])
          setShowAllergySearch(false)
          setIsSearchingAllergies(false)
          return
        }

        timeoutId = setTimeout(async () => {
          const trimmedQuery = query.trim().toLowerCase()
          
          // Check cache first
          if (allergySearchCache.has(trimmedQuery)) {
            setAllergySearchResults(allergySearchCache.get(trimmedQuery) || [])
            setIsSearchingAllergies(false)
            return
          }

          try {
            const results = await searchAllergies(query, 10)
            
            // Cache the results
            setAllergySearchCache(prev => new Map(prev).set(trimmedQuery, results))
            setAllergySearchResults(results)
            setShowAllergySearch(true)
          } catch (error) {
            console.error('Error searching allergies:', error)
            setAllergySearchResults([])
          } finally {
            setIsSearchingAllergies(false)
          }
        }, 200) // Reduced to 200ms for faster response
      }
    })(),
    [allergySearchCache]
  )

  const addAllergy = () => {
    if (allergyInput.trim()) {
      // Check if allergy already exists
      const exists = formData.allergies.some(existing => existing.name.toLowerCase() === allergyInput.trim().toLowerCase())
      if (exists) {
        return
      }
      
      const newAllergy = {
        id: Date.now(),
        name: allergyInput.trim(),
      }
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy],
      }))
      setAllergyInput("")
      setShowAllergySearch(false)
      setAllergySearchResults([])
    }
  }

  const selectAllergyFromSearch = (allergy: AllergySearchResult) => {
    // Check if allergy already exists
    const exists = formData.allergies.some(existing => existing.name.toLowerCase() === allergy.name.toLowerCase())
    if (exists) {
      return
    }
    
    const newAllergy = {
      id: allergy.id,
      name: allergy.name,
    }
    setFormData((prev) => ({
      ...prev,
      allergies: [...prev.allergies, newAllergy],
    }))
    setAllergyInput("")
    setShowAllergySearch(false)
    setAllergySearchResults([])
  }

  const removeAllergy = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((allergy) => allergy.id !== id),
    }))
  }

  const addHealthCondition = () => {
    if (healthConditionInput.trim()) {
      const newCondition = {
        id: Date.now(),
        name: healthConditionInput.trim(),
      }
      setFormData((prev) => ({
        ...prev,
        health_conditions: [...prev.health_conditions, newCondition],
      }))
      setHealthConditionInput("")
    }
  }

  const removeHealthCondition = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      health_conditions: prev.health_conditions.filter((condition) => condition.id !== id),
    }))
  }

  if (!isOpen) return null

  const CurrentStepIcon = steps[currentStep].icon

      return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl mx-auto bg-white backdrop-blur-sm border-0 shadow-2xl my-2 overflow-hidden">
        {/* Header - Fixed purple gradient */}
        <div className="p-6 pb-4 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CurrentStepIcon size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{steps[currentStep].title}</h2>
                <p className="text-purple-100 text-xs">{steps[currentStep].subtitle}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X size={20} />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      index <= currentStep ? "bg-white text-purple-600" : "bg-white/20 text-white/60"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs text-purple-100 mt-1 hidden sm:block">Bước {index + 1}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/20 -z-10">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="min-h-[400px] flex flex-col">
            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-8 flex-1 flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Thông tin cơ bản</h3>
                  <p className="text-gray-600 text-sm">Hãy cho chúng tôi biết một số thông tin về bạn</p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4 flex-1 flex flex-col justify-center">
                  {/* Full Name and Age Input - Side by side */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Full Name Input - 2/3 width */}
                    <div className="col-span-2 space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <User size={18} className="text-purple-600" />
                        <label className="font-semibold text-base">Họ và tên</label>
                      </div>
                      <Input
                        type="text"
                        value={formData.full_name || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Nhập họ và tên"
                        className="h-12 text-base border-2 focus:border-purple-400"
                      />
                    </div>

                    {/* Age Input - 1/3 width */}
                    <div className="col-span-1 space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={18} className="text-purple-600" />
                        <label className="font-semibold text-base">Tuổi</label>
                      </div>
                      <Input
                        type="number"
                        value={formData.age || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, age: Number.parseInt(e.target.value) || 0 }))}
                        placeholder="Tuổi"
                        className="h-12 text-base border-2 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Gender Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User size={18} className="text-purple-600" />
                      <label className="font-semibold text-base">Giới tính</label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {genderOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedGenderId(option.id)
                            setFormData((prev) => ({ ...prev, sex: option.value }))
                          }}
                          className={`h-16 flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                            selectedGenderId === option.id
                              ? option.color + " border-current shadow-lg scale-105"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <div className="text-2xl mb-1">{option.icon}</div>
                          <div className="font-medium text-sm">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weight and Height */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Scale size={18} className="text-purple-600" />
                        <label className="font-semibold text-base">Cân nặng</label>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.weight || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, weight: Number.parseFloat(e.target.value) || 0 }))
                          }
                          placeholder="0"
                          className="h-12 text-base border-2 focus:border-purple-400 pr-12"
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          kg
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Ruler size={18} className="text-purple-600" />
                        <label className="font-semibold text-base">Chiều cao</label>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.height || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, height: Number.parseFloat(e.target.value) || 0 }))
                          }
                          placeholder="0"
                          className="h-12 text-base border-2 focus:border-purple-400 pr-12"
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          cm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Goals */}
            {currentStep === 1 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Mục tiêu của bạn</h3>
                  <p className="text-gray-600">Chọn mục tiêu phù hợp với kế hoạch của bạn</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto flex-1 flex items-center">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setFormData((prev) => ({ ...prev, goal: goal.value }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 ${
                        formData.goal === goal.value
                          ? goal.color + " border-current shadow-xl scale-105"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:shadow-lg"
                      }`}
                    >
                      <div className="text-3xl mb-2">{goal.icon}</div>
                      <div className="font-bold text-base mb-1">{goal.label}</div>
                      <div className="text-sm opacity-70 leading-relaxed">{goal.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Activity Level - 3 top, 2 bottom layout */}
            {currentStep === 2 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Mức độ hoạt động</h3>
                  <p className="text-gray-600">Chọn mức độ hoạt động phù hợp với lối sống của bạn</p>
                </div>

                <div className="max-w-4xl mx-auto flex-1 flex flex-col justify-center">
                  {/* Top row - 3 items */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {activityLevels.slice(0, 3).map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setFormData((prev) => ({ ...prev, activity_level: level.value }))}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 ${
                          formData.activity_level === level.value
                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xl scale-105"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:shadow-lg"
                        }`}
                      >
                        <div className="text-3xl mb-2">{level.icon}</div>
                        <div className="font-bold text-base mb-1">{level.label}</div>
                        <div className="text-xs opacity-70 leading-relaxed">{level.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Bottom row - 2 items centered */}
                  <div className="flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                      {activityLevels.slice(3, 5).map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setFormData((prev) => ({ ...prev, activity_level: level.value }))}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 ${
                            formData.activity_level === level.value
                              ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xl scale-105"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:shadow-lg"
                          }`}
                        >
                          <div className="text-3xl mb-2">{level.icon}</div>
                          <div className="font-bold text-base mb-1">{level.label}</div>
                          <div className="text-xs opacity-70 leading-relaxed">{level.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Allergies */}
            {currentStep === 3 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Dị ứng thực phẩm</h3>
                  <p className="text-gray-600 text-sm">Thêm các loại thực phẩm bạn dị ứng</p>
                </div>

                <div className="w-full space-y-4 flex-1 flex flex-col justify-start">
                  {/* Allergies Section */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <Heart size={20} className="text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Dị ứng thực phẩm</h4>
                        <p className="text-sm text-gray-600">Thêm các loại thực phẩm bạn không thể ăn</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2 relative">
                        <Input
                          value={allergyInput}
                          onChange={(e) => {
                            setAllergyInput(e.target.value)
                            searchAllergiesHandler(e.target.value)
                          }}
                          placeholder="Tìm kiếm dị ứng (ví dụ: Đậu phộng, Hải sản...)"
                          className="flex-1"
                          onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                                                     onFocus={() => {
                             if (allergyInput.trim().length >= 1) {
                               setShowAllergySearch(true)
                             }
                           }}
                          onBlur={() => {
                            // Delay hiding to allow clicking on search results
                            setTimeout(() => setShowAllergySearch(false), 200)
                          }}
                        />
                        <Button onClick={addAllergy} size="sm" className="bg-red-600 hover:bg-red-700">
                          <Plus size={16} />
                        </Button>
                        
                        {/* Search Results Dropdown */}
                        {showAllergySearch && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            {isSearchingAllergies ? (
                              <div className="p-3 text-center text-gray-500">
                                Đang tìm kiếm...
                              </div>
                            ) : allergySearchResults.length > 0 ? (
                              allergySearchResults.map((allergy) => (
                                <button
                                  key={allergy.id}
                                  onClick={() => selectAllergyFromSearch(allergy)}
                                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                >
                                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                    <Heart size={12} className="text-red-600" />
                                  </div>
                                  <span className="text-sm font-medium">{allergy.name}</span>
                                </button>
                              ))
                                                         ) : allergyInput.trim().length >= 1 ? (
                               <div className="p-3 text-center text-gray-500">
                                 Không tìm thấy kết quả
                               </div>
                             ) : null}
                          </div>
                        )}
                      </div>

                      {formData.allergies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.allergies.map((allergy) => (
                            <Badge key={allergy.id} className="bg-red-100 text-red-700 px-3 py-1">
                              {allergy.name}
                              <button
                                onClick={() => removeAllergy(allergy.id)}
                                className="ml-2 hover:text-red-900"
                              >
                                <X size={12} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Health Conditions */}
            {currentStep === 4 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Tình trạng sức khỏe</h3>
                  <p className="text-gray-600 text-sm">Thêm các vấn đề sức khỏe cần lưu ý</p>
                </div>

                <div className="w-full space-y-4 flex-1 flex flex-col justify-start">
                  {/* Health Conditions Section */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Tình trạng sức khỏe</h4>
                        <p className="text-sm text-gray-600">Thêm các vấn đề sức khỏe cần lưu ý</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={healthConditionInput}
                          onChange={(e) => setHealthConditionInput(e.target.value)}
                          placeholder="Nhập tình trạng sức khỏe (ví dụ: Tiểu đường, Huyết áp cao...)"
                          className="flex-1"
                          onKeyPress={(e) => e.key === "Enter" && addHealthCondition()}
                        />
                        <Button onClick={addHealthCondition} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Plus size={16} />
                        </Button>
                      </div>

                      {formData.health_conditions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.health_conditions.map((condition) => (
                            <Badge key={condition.id} className="bg-blue-100 text-blue-700 px-3 py-1">
                              {condition.name}
                              <button
                                onClick={() => removeHealthCondition(condition.id)}
                                className="ml-2 hover:text-blue-900"
                              >
                                <X size={12} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 h-12 px-6 border-2 bg-transparent text-base"
            >
              <ChevronLeft size={18} />
              Quay lại
            </Button>

            {currentStep === 4 ? (
              <Button
                onClick={handleSubmit}
                className="flex items-center gap-2 h-12 px-8 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg text-base"
              >
                {isEdit ? "Cập nhật" : "Hoàn thành"}
                <ChevronRight size={18} />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 h-12 px-8 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg text-base"
              >
                Tiếp tục
                <ChevronRight size={18} />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default UserProfileForm

