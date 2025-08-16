"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/ui/header"
import { User, Flame, Target, BarChart3, Beef, Wheat, Droplets, AlertTriangle, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WEIGHT_DATA } from "@/lib/constants"
import UserCard from "@/components/user-card"
import UserProfileForm from "@/components/user-profile-form"
import { UserProfile, NutritionGoal } from "@/lib/types"
import { getUserProfile } from "@/lib/profile"
import { isAuthenticated } from "@/lib/auth"
import { appDataCache } from "@/lib/cache"
import { useDailyMeals } from "@/hooks/useDailyMeals"

// Create default profile with all values set to 0
const createDefaultProfile = (): UserProfile => {
  return {
    full_name: "Người dùng",
    age: 0,
    sex: "Nam",
    weight: 0,
    height: 0,
    goal: "Duy trì",
    activity_level: "Ít vận động",
    allergies: [],
    health_conditions: [],
    nutritions_goal: [
      { name: "Calories", value: 0, unit: "kcal" },
      { name: "Protein", value: 0, unit: "g" },
      { name: "Carbs", value: 0, unit: "g" },
      { name: "Fat", value: 0, unit: "g" },
      { name: "Fiber", value: 0, unit: "g" },
      { name: "Sugar", value: 0, unit: "g" },
      { name: "Sodium", value: 0, unit: "mg" },
      { name: "Potassium", value: 0, unit: "mg" },
      { name: "Calcium", value: 0, unit: "mg" },
      { name: "Iron", value: 0, unit: "mg" },
      { name: "Vitamin A", value: 0, unit: "IU" },
      { name: "Vitamin C", value: 0, unit: "mg" }
    ]
  }
}

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [animateCharts, setAnimateCharts] = useState(false)
  const weightData = WEIGHT_DATA
  
  // Daily meals hook to get today's nutrition data
  const { nutritionData, fetchTodayMeals } = useDailyMeals()

  const fetchUserProfile = async (forceRefresh = false) => {
    if (!isAuthenticated()) {
      console.warn('User not authenticated, using default profile')
      // Instead of error, use default profile for unauthenticated users
      const defaultProfile = createDefaultProfile()
      setUserProfile(defaultProfile)
      setError(null)
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      if (!forceRefresh) {
        const cachedProfile = appDataCache.getCachedProfile()
        if (cachedProfile) {
          console.log('✅ Using cached profile')
          setUserProfile(cachedProfile)
          setLoading(false)
          return
        }
      }
      
      console.log('🌐 Fetching profile from API')
      const profile = await getUserProfile()
      setUserProfile(profile)
      appDataCache.saveProfile(profile)
    } catch (err) {
      console.warn('Failed to fetch profile, using default profile:', err)
      // Instead of showing error, use default profile with 0 values
      const defaultProfile = createDefaultProfile()
      setUserProfile(defaultProfile)
      appDataCache.saveProfile(defaultProfile)
      setError(null) // Clear any previous errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cachedProfile = appDataCache.getCachedProfile()
    if (cachedProfile) {
      console.log('✅ Using existing cached profile')
      setUserProfile(cachedProfile)
      setLoading(false)
    } else {
      console.log('🚀 No cache found, fetching profile from API')
      fetchUserProfile()
    }
    
    // Fetch today's meals for nutrition data
    if (isAuthenticated()) {
      console.log('🚀 Fetching today\'s meals for nutrition data')
      fetchTodayMeals()
    }
  }, [fetchTodayMeals])

  // Trigger animations when component mounts or data changes
  useEffect(() => {
    if (userProfile && nutritionData) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setAnimateCharts(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [userProfile, nutritionData])

  const handleProfileUpdate = () => {
    appDataCache.delete('app_profile')
    fetchUserProfile(true)
  }

  const handleAddProfileSuccess = () => {
    setShowAddForm(false)
    fetchUserProfile(true)
  }

  // Get nutrition goals from API data
  const getNutritionGoals = (): NutritionGoal[] => {
    if (!userProfile?.nutritions_goal) return []
    return userProfile.nutritions_goal
  }

  // Get main macros (Protein, Carbs, Fat)
  const getMainMacros = () => {
    const goals = getNutritionGoals()
    const macros = goals.filter(n => ['Protein', 'Carbs', 'Fat'].includes(n.name))
    
    return macros.map(macro => ({
      name: macro.name,
      current: nutritionData ? nutritionData[macro.name.toLowerCase() as keyof typeof nutritionData] || 0 : 0,
      goal: macro.value,
      color: macro.name === 'Protein' ? 'bg-red-500' : macro.name === 'Carbs' ? 'bg-blue-500' : 'bg-yellow-500',
      unit: macro.unit
    }))
  }

  // Get calories data
  const getCaloriesData = () => {
    const goals = getNutritionGoals()
    const calories = goals.find(n => n.name === 'Calories')
    return {
      current: nutritionData ? nutritionData.calories || 0 : 0,
      goal: calories?.value || 0
    }
  }

  // Get other nutrients for progress bars
  const getOtherNutrients = () => {
    const goals = getNutritionGoals()
    const mainMacros = ['Protein', 'Carbs', 'Fat']
    const otherNutrients = goals.filter(n => !mainMacros.includes(n.name))
    
    return otherNutrients.map(nutrient => {
      let currentValue = 0
      
      if (nutritionData) {
        // Map nutrition names to nutritionData keys
        const nutritionKey = nutrient.name.toLowerCase().replace(/\s+/g, '') as keyof typeof nutritionData
        currentValue = nutritionData[nutritionKey] || 0
        
        // Special mapping for some nutrients
        if (nutrient.name === 'Fiber') {
          currentValue = nutritionData.fiber || 0
        } else if (nutrient.name === 'Sugar') {
          currentValue = nutritionData.sugar || 0
        } else if (nutrient.name === 'Vitamin C') {
          currentValue = nutritionData.vitaminC || 0
        }
      }
      
      return {
        name: nutrient.name,
        current: currentValue,
        goal: nutrient.value,
        unit: nutrient.unit
      }
    })
  }

  const getIcon = (name: string) => {
    switch (name) {
      case "Protein":
        return <Beef size={14} className="text-red-600" />
      case "Carbs":
        return <Wheat size={14} className="text-blue-600" />
      case "Fat":
        return <Droplets size={14} className="text-yellow-600" />
      default:
        return <Beef size={14} className="text-gray-600" />
    }
  }

  const getColors = (color: string) => {
    const colorMap = {
      "bg-red-500": {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        bar: "bg-red-500",
      },
      "bg-blue-500": {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        bar: "bg-blue-500",
      },
      "bg-yellow-500": {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-700",
        bar: "bg-yellow-500",
      },
    }
    return colorMap[color as keyof typeof colorMap]
  }

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        <Header
          icon={User}
          title="Profile"
          subtitle="Theo dõi sức khỏe và dinh dưỡng"
          gradientFrom="from-purple-600"
          gradientTo="to-purple-800"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Removed error UI - now we always have userProfile (either from API or default)
  if (!userProfile) {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        <Header
          icon={User}
          title="Profile"
          subtitle="Theo dõi sức khỏe và dinh dưỡng"
          gradientFrom="from-purple-600"
          gradientTo="to-purple-800"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
            <div className="space-y-3">
              <Button onClick={() => fetchUserProfile(true)}>Retry</Button>
              {!error && (
                <div>
                  <p className="text-gray-600 mb-3">Bạn chưa có thông tin profile. Hãy tạo profile mới!</p>
                  <Button onClick={() => setShowAddForm(true)} className="bg-purple-600 hover:bg-purple-700">
                    Tạo Profile
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const macros = getMainMacros()
  const calorieData = getCaloriesData()
  const nutrients = getOtherNutrients()
  const caloriePercentage = (calorieData.current / calorieData.goal) * 100
  const remaining = calorieData.goal - calorieData.current

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <Header
        icon={User}
        title="Profile"
        subtitle="Theo dõi sức khỏe và dinh dưỡng"
        gradientFrom="from-purple-600"
        gradientTo="to-purple-800"
      />

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-6 py-4 space-y-6">
            {/* Top Row - User, Calories, and Macros */}
            <div className="grid grid-cols-12 gap-4">
              {/* User Card - 4 columns */}
              <div className="col-span-4">
                <UserCard userData={userProfile} onProfileUpdate={handleProfileUpdate} />
              </div>

              {/* Calories Card - 3 columns - Match Macros Height */}
              <div className="col-span-3">
                <Card className="bg-white border border-gray-200 shadow-sm h-full flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Flame size={20} className="text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Calories</h3>
                        <p className="text-xs text-gray-500">Hôm nay</p>
                      </div>
                    </div>
                  </div>

                  {/* Content - Flex to fill remaining space */}
                  <div className="px-4 pb-7 flex-1 flex flex-col justify-center">
                    <div className="flex justify-center mb-4">
                      {/* Donut Chart with Animation - Fixed size */}
                      <div className="flex-shrink-0">
                        <div className="relative w-40 h-40">
                          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#f3f4f6"
                              strokeWidth="2.5"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#f97316"
                              strokeWidth="2.5"
                              strokeDasharray={`${animateCharts ? caloriePercentage : 0}, 100`}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900 transition-all duration-1000 ease-out">
                                {animateCharts ? caloriePercentage.toFixed(0) : 0}%
                              </div>
                              <div className="text-xs text-gray-500">Hoàn thành</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calories Info Card */}
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame size={14} className="text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">Lượng calo</span>
                      </div>
                      <div className="text-base font-semibold text-orange-800 transition-all duration-1000 ease-out">
                        {animateCharts ? calorieData.current : 0} / {calorieData.goal.toFixed(0)} kcal
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Macros Card - 5 columns */}
              <div className="col-span-5">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <BarChart3 size={20} className="text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Macros</h3>
                        <p className="text-xs text-gray-500">Chất dinh dưỡng chính</p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-6 space-y-3">
                    {macros.map((macro) => {
                      const percentage = (macro.current / macro.goal) * 100
                      const colors = getColors(macro.color)

                      return (
                        <div key={macro.name} className={`${colors.bg} p-3 rounded-lg border ${colors.border}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {getIcon(macro.name)}
                            <span className="text-sm font-medium text-gray-800">{macro.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-base font-semibold text-gray-800 transition-all duration-1000 ease-out">
                              {animateCharts ? macro.current : 0}
                              <span className="text-xs font-normal text-gray-600 ml-0.5">{macro.unit}</span>
                            </div>
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`${colors.bar} h-1.5 rounded-full transition-all duration-1000 ease-out`}
                                  style={{ width: `${animateCharts ? Math.min(percentage, 100) : 0}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
                              / {macro.goal.toFixed(0)} {macro.unit}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>
            </div>

            {/* Health Information Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Allergies - 1 column */}
              <div className="col-span-1">
                <Card className="p-5 bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle size={18} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Dị ứng</h3>
                      <p className="text-xs text-gray-500">Thông tin dị ứng thực phẩm</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {userProfile?.allergies && userProfile.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userProfile.allergies.map((allergy: any) => (
                          <Badge key={allergy.id} className="bg-red-100 text-red-700 px-3 py-1 text-xs font-medium">
                            {allergy.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Không có thông tin dị ứng</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Health Conditions - 1 column */}
              <div className="col-span-1">
                <Card className="p-5 bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Heart size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Bệnh lý</h3>
                      <p className="text-xs text-gray-500">Tình trạng sức khỏe</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {userProfile?.health_conditions && userProfile.health_conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userProfile.health_conditions.map((condition: any) => (
                          <Badge
                            key={condition.id}
                            className="bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium"
                          >
                            {condition.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Không có thông tin bệnh lý</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Bottom Row - Weight Chart and Nutrients */}
            <div className="grid grid-cols-10 gap-4">
              {/* Weight Chart - 6 columns */}
              <div className="col-span-6">
                <Card className="p-5 bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <User size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Cân nặng theo ngày</h3>
                      <p className="text-xs text-gray-500">7 ngày gần nhất</p>
                    </div>
                  </div>

                  <div className="h-64 relative">
                    <svg className="w-full h-full" viewBox="0 0 700 240">
                      <defs>
                        <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <line
                          key={i}
                          x1="60"
                          y1={40 + i * 30}
                          x2="640"
                          y2={40 + i * 30}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Y-axis labels */}
                      {[11, 10.5, 10, 9.5, 9, 8.5].map((weight, i) => (
                        <text key={i} x="50" y={45 + i * 30} textAnchor="end" className="text-xs fill-gray-600">
                          {weight}kg
                        </text>
                      ))}

                      {/* Weight line and area */}
                      <path
                        d={`M 80 ${190 - (weightData[0].weight - 8.5) * 60} ${weightData
                          .map((point, index) => `L ${80 + index * 80} ${190 - (point.weight - 8.5) * 60}`)
                          .join(" ")}`}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        className="transition-all duration-1000 ease-out"
                        style={{
                          strokeDasharray: animateCharts ? "none" : "0, 1000",
                          strokeDashoffset: animateCharts ? 0 : 1000,
                        }}
                      />

                      {/* Filled area */}
                      <path
                        d={`M 80 190 L 80 ${190 - (weightData[0].weight - 8.5) * 60} ${weightData
                          .map((point, index) => `L ${80 + index * 80} ${190 - (point.weight - 8.5) * 60}`)
                          .join(" ")} L ${80 + (weightData.length - 1) * 80} 190 Z`}
                        fill="url(#weightGradient)"
                        className="transition-all duration-1000 ease-out"
                        style={{ 
                          opacity: animateCharts ? 1 : 0
                        }}
                      />

                      {/* Data points */}
                      {weightData.map((point, index) => (
                        <g key={index}>
                          <circle
                            cx={80 + index * 80}
                            cy={190 - (point.weight - 8.5) * 60}
                            r="3"
                            fill="#6366f1"
                            className="transition-all duration-1000 ease-out"
                            style={{
                              opacity: animateCharts ? 1 : 0,
                              transform: animateCharts ? "scale(1)" : "scale(0)",
                            }}
                          />
                          <text x={80 + index * 80} y={210} textAnchor="middle" className="text-xs fill-gray-600">
                            {point.day}
                          </text>
                          <text x={80 + index * 80} y={225} textAnchor="middle" className="text-xs fill-gray-500">
                            {point.date}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </Card>
              </div>



              {/* Nutrients Progress Bars - 4 columns */}
              <div className="col-span-4">
                <Card className="p-5 bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                      <User size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Chất dinh dưỡng</h3>
                      <p className="text-xs text-gray-500">Tiến độ hôm nay</p>
                    </div>
                  </div>

                  <ScrollArea className="h-64">
                    <div className="space-y-4 pr-4">
                      {nutrients.map((nutrient, index) => (
                        <div key={nutrient.name}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700">{nutrient.name}</span>
                            <span className="text-gray-600 transition-all duration-1000 ease-out text-xs">
                              {animateCharts ? nutrient.current : 0}/{nutrient.goal} {nutrient.unit}
                            </span>
                          </div>
                          <Progress
                            value={animateCharts ? (nutrient.current / nutrient.goal) * 100 : 0}
                            className="h-1.5 transition-all duration-1000 ease-out"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Add Profile Form */}
      <UserProfileForm 
        isOpen={showAddForm} 
        onClose={() => setShowAddForm(false)} 
        onSuccess={handleAddProfileSuccess}
        isEdit={false}
      />
    </div>
  )
}
