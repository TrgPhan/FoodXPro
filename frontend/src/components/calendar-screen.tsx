"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Plus, Loader2, Check, X } from "lucide-react"
import FoodCard from "@/components/food-card"
import Header from "@/components/ui/header"
import { MEAL_PERIODS, MEAL_PERIOD_COLORS } from "@/lib/constants"
import { useDailyMeals } from "@/hooks/useDailyMeals"
import { DailyMeals } from "@/lib/daily-meals"
import { CalendarPopup } from "@/components/ui/calendar-popup"

export default function CalendarScreen() {
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [currentWeek, setCurrentWeek] = useState<Date[]>([])
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined)
  const [editingMealId, setEditingMealId] = useState<number | null>(null)
  const [editServings, setEditServings] = useState<string>("1")

  // Helper function to convert Date to YYYY-MM-DD string using local timezone
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Daily meals hook
  const {
    dailyMeals,
    dailyMealsWithCalories,
    loading,
    error,
    fetchDailyMeals,
    nutritionData,
    mealSummary,
    editMeal,
    deleteMeal
  } = useDailyMeals()

  // Generate current week dates
  useEffect(() => {
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDayOfWeek + 1) // Start from Monday

    const weekDates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDates.push(date)
    }
    setCurrentWeek(weekDates)

    // Set selected day to today
    const todayKey = `day-${today.getDate()}-${today.getMonth()}-${today.getFullYear()}`
    
    // Convert today to string format using local timezone
    const todayDateString = formatDateToString(today)
    
    setSelectedDay(todayKey)
    setSelectedDate(todayDateString)
    setSelectedCalendarDate(today)
  }, [])

  // Fetch meals when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchDailyMeals(selectedDate)
    }
  }, [selectedDate, fetchDailyMeals])



  // Generate week days data
  const weekDays = currentWeek.map((date, index) => {
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    const isToday = date.toDateString() === new Date().toDateString()
    const dayKey = `day-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`
    
    // Convert date to string format using local timezone
    const dateString = formatDateToString(date)

    return {
      id: dayKey,
      label: dayNames[index],
      date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
      isToday,
      fullDate: date,
      dateString
    }
  })

  const handleDayClick = (day: typeof weekDays[0]) => {
    setSelectedDay(day.id)
    setSelectedDate(day.dateString)
    
    // Scroll to top of the calendar screen with smooth animation
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollArea) {
      // Get current scroll position
      const currentScrollTop = scrollArea.scrollTop
      
      // Animate scroll to top
      const animateScroll = () => {
        const startTime = performance.now()
        const duration = 800 // 800ms for smooth animation
        
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)
          const easedProgress = easeOutCubic(progress)
          
          scrollArea.scrollTop = currentScrollTop * (1 - easedProgress)
          
          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        }
        
        requestAnimationFrame(animate)
      }
      
      animateScroll()
    }
  }

  const handleCalendarDateSelect = (date: Date) => {
    console.log('🎯 Calendar date selected:', date.toDateString())
    setSelectedCalendarDate(date)
    
    // Convert date to string format for API using local timezone
    const dateString = formatDateToString(date)
    console.log('📅 Formatted date string:', dateString)
    
    // Find the corresponding day in weekDays
    let selectedDayData = weekDays.find(day => day.dateString === dateString)
    console.log('🔍 Found in current week:', !!selectedDayData)
    
    // If the selected date is not in current week, update the week to include this date
    if (!selectedDayData) {
      console.log('🔄 Updating week to include selected date')
      
      // Calculate the start of the week containing the selected date
      const selectedDayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
      const startOfWeek = new Date(date)
      
      // Adjust to start from Monday (1) instead of Sunday (0)
      const daysToSubtract = selectedDayOfWeek === 0 ? 6 : selectedDayOfWeek - 1
      startOfWeek.setDate(date.getDate() - daysToSubtract)
      
      console.log('📅 Selected day of week:', selectedDayOfWeek)
      console.log('📅 Start of week:', startOfWeek.toDateString())

      // Generate new week dates
      const newWeekDates: Date[] = []
      for (let i = 0; i < 7; i++) {
        const weekDate = new Date(startOfWeek)
        weekDate.setDate(startOfWeek.getDate() + i)
        newWeekDates.push(weekDate)
      }
      
      // Update current week
      setCurrentWeek(newWeekDates)
      
      // Create the selected day data
      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
      const dayKey = `day-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`
      const isToday = date.toDateString() === new Date().toDateString()
      
      // Calculate the correct index for dayNames array
      // dayNames: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
      // getDay(): 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
      const dayIndex = selectedDayOfWeek === 0 ? 0 : selectedDayOfWeek - 1
      
      selectedDayData = {
        id: dayKey,
        label: dayNames[dayIndex],
        date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        isToday,
        fullDate: date,
        dateString
      }
    }
    
    // Update selected day and date
    if (selectedDayData) {
      setSelectedDay(selectedDayData.id)
      setSelectedDate(dateString)
      
      // Scroll to top of the calendar screen with smooth animation
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollArea) {
        // Get current scroll position
        const currentScrollTop = scrollArea.scrollTop
        
        // Animate scroll to top
        const animateScroll = () => {
          const startTime = performance.now()
          const duration = 800 // 800ms for smooth animation
          
          const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
          
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easedProgress = easeOutCubic(progress)
            
            scrollArea.scrollTop = currentScrollTop * (1 - easedProgress)
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          
          requestAnimationFrame(animate)
        }
        
        animateScroll()
      }
    }
  }

  const handleFoodAction = (action: string, id: string) => {
    console.log(`${action} food:`, id)
  }

  const handleAddMeal = (mealPeriod: string) => {
    console.log(`Add meal to ${mealPeriod}`)
  }

  const handleFoodEdit = (meal: any, eatAt: string) => {
    setEditingMealId(meal.id)
    setEditServings((meal.servings_eaten || 1).toString())
  }

  const confirmFoodEdit = async (meal: any, eatAt: string) => {
    try {
      const servings = Number.parseFloat(editServings) || 1
      await editMeal({
        recipe_id: meal.id,
        eat_date: selectedDate,
        eat_at: eatAt as any,
        new_servings_eaten: servings
      })
    } catch (error) {
      console.error('Edit meal error', error)
    } finally {
      setEditingMealId(null)
    }
  }

  const cancelFoodEdit = () => { setEditingMealId(null) }

  const handleFoodDelete = async (meal: any, eatAt: string) => {
    if(!confirm('Bạn chắc chắn muốn xoá?')) return
    try {
      await deleteMeal({ recipe_id: meal.id, eat_date: selectedDate, eat_at: eatAt as any })
    } catch(err){ console.error(err) }
  }

  const MacroSummary = ({ macros }: { macros: any }) => (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
        <span className="text-gray-600 font-medium">{macros.calories} kcal</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        <span className="text-gray-600 font-medium">{macros.protein}g protein</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        <span className="text-gray-600 font-medium">{macros.carbs}g carbs</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
        <span className="text-gray-600 font-medium">{macros.fat}g fat</span>
      </div>
    </div>
  )

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-white flex flex-col">
      <Header
        icon={Calendar}
        title="Meal Planner"
        subtitle="Quản lý bữa ăn thông minh"
      />

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4">
            {/* Daily Summary - Moved to top */}
            <Card className="p-4 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {weekDays.find((d) => d.id === selectedDay)?.label} -{" "}
                  {weekDays.find((d) => d.id === selectedDay)?.date}
                </h3>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm text-gray-600">Đang tải...</span>
                  </div>
                ) : error ? (
                  <div className="text-sm text-red-600">Lỗi tải dữ liệu</div>
                ) : nutritionData ? (
                  <MacroSummary macros={{
                    calories: nutritionData.calories,
                    protein: nutritionData.protein,
                    carbs: nutritionData.carbs,
                    fat: nutritionData.fat,
                  }} />
                ) : (
                  <div className="text-sm text-gray-500">Không có dữ liệu</div>
                )}
              </div>
            </Card>

            {/* Meal Periods Cards */}
            {loading ? (
              <div className="flex items-center justify-center py-12 h-[600px]">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin mx-auto mb-4 text-red-500" />
                  <p className="text-gray-600">Đang tải bữa ăn...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-red-600 mb-2">Lỗi tải dữ liệu</p>
                  <p className="text-sm text-gray-600 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDailyMeals(selectedDate)}
                  >
                    Thử lại
                  </Button>
                </div>
              </div>
            ) : dailyMealsWithCalories ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {MEAL_PERIODS.map((period) => {
                  const meals = (dailyMealsWithCalories[period.id as keyof typeof dailyMealsWithCalories] as any[]) || []

                  return (
                    <Card key={period.id} className={`p-4 ${MEAL_PERIOD_COLORS[period.color as keyof typeof MEAL_PERIOD_COLORS]}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{period.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{period.label}</h3>
                            <p className="text-xs text-gray-500">{period.time}</p>
                          </div>
                        </div>
                      </div>

                      <ScrollArea className="h-[200px] lg:max-h-[200px]">
                        <div className="space-y-1 pr-4 lg:pr-0">
                          {meals.length > 0 ? (
                            meals.map((meal) => (
                              <div key={meal.id} className="transform scale-95">
                                <Card className="p-4 bg-white hover:shadow-md transition-all duration-200 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                      <img
                                        src={meal.image || (require("@/lib/recipe-images").getCachedRecipeImage(meal.id) || "/placeholder.svg")}
                                        alt={meal.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900 text-sm">{meal.name}</h4>
                                                                             <div className="flex items-center gap-2 mt-1">
                                         <div className="flex items-center gap-1">
                                           <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                           <span className="text-xs text-gray-600 font-medium">{meal.calories || 0} kcal</span>
                                         </div>
                                         {meal.servings_eaten !== undefined && (
                                           <div className="flex items-center gap-1">
                                             <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                             <span className="text-xs text-gray-600 font-medium">{meal.servings_eaten}x</span>
                                           </div>
                                         )}
                                       </div>
                                    </div>
                                    <div className="flex gap-1">
                                      {editingMealId === meal.id ? (
                                        <div className="flex items-center gap-2">
                                          <input type="number" min="0.1" step="0.1" value={editServings} onChange={(e)=>setEditServings(e.target.value)} className="w-16 h-6 text-xs text-center border rounded" />
                                          <button onClick={()=>confirmFoodEdit(meal, period.id)} className="w-6 h-6 bg-green-500 rounded flex items-center justify-center"><Check size={12} className="text-white"/></button>
                                          <button onClick={cancelFoodEdit} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><X size={12} className="text-gray-600"/></button>
                                        </div>
                                      ) : (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleFoodEdit(meal, period.id);
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <span className="text-xs">✏️</span>
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleFoodDelete(meal, period.id);
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <span className="text-xs">🗑️</span>
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Plus size={20} className="text-gray-400" />
                              </div>
                              <p className="text-sm">Chưa có món ăn nào</p>
                              <p className="text-xs">Nhấn "Thêm" để thêm món ăn</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-500">Không có dữ liệu bữa ăn</p>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-3 w-full">
                {weekDays.map((day) => {
                  const isSelected = selectedDay === day.id
                  // Get nutrition data for this day (will be loaded when clicked)
                  const dayMacros = nutritionData && selectedDate === day.dateString ? {
                    calories: nutritionData.calories,
                    protein: nutritionData.protein,
                    carbs: nutritionData.carbs,
                    fat: nutritionData.fat,
                  } : {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                  }

                  return (
                    <Card
                      key={day.id}
                      className={`p-4 cursor-pointer transition-all duration-200 ${isSelected
                        ? "ring-2 ring-red-500 bg-red-50 border-red-200"
                        : day.isToday
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                        }`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="text-center space-y-2">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500 font-medium">{day.label}</span>
                          <span className="text-xs text-gray-400">{day.date}</span>
                          {day.isToday && (
                            <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-700">
                              Hôm nay
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-center gap-1">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${dayMacros.calories > 0 ? "bg-orange-400" : "bg-gray-200"}`}
                          ></div>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${dayMacros.protein > 0 ? "bg-red-400" : "bg-gray-200"}`}
                          ></div>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${dayMacros.carbs > 0 ? "bg-blue-400" : "bg-gray-200"}`}
                          ></div>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${dayMacros.fat > 0 ? "bg-yellow-400" : "bg-gray-200"}`}
                          ></div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Calendar Popup - Bottom Right */}
        <div className="absolute bottom-6 right-6">
          <CalendarPopup
            selectedDate={selectedCalendarDate}
            onDateSelect={handleCalendarDateSelect}
          />
        </div>
      </div>
    </div>
  )
}
