"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  getDailyMeals, 
  getTodayMeals, 
  DailyMeals, 
  MealItem,
  getNutritionForProfile,
  getMealSummary,
  clearDailyMealsCache,
  getMealWithCalories,
  addMeal,
  editMeal,
  AddMealParams,
  AddMealResponse,
  EditMealParams,
  EditMealResponse
} from '../lib/daily-meals'

export interface UseDailyMealsReturn {
  dailyMeals: DailyMeals | null
  dailyMealsWithCalories: (DailyMeals & { 
    breakfast: (MealItem & { calories: number })[]
    lunch: (MealItem & { calories: number })[]
    dinner: (MealItem & { calories: number })[]
    snack: (MealItem & { calories: number })[]
  }) | null
  loading: boolean
  error: string | null
  fetchDailyMeals: (day: string) => Promise<void>
  fetchTodayMeals: () => Promise<void>
  clearCache: (day?: string) => void
  nutritionData: ReturnType<typeof getNutritionForProfile> | null
  mealSummary: ReturnType<typeof getMealSummary> | null
  addMeal: (params: AddMealParams) => Promise<AddMealResponse>
  editMeal: (params: EditMealParams) => Promise<EditMealResponse>
}

export const useDailyMeals = (): UseDailyMealsReturn => {
  const [dailyMeals, setDailyMeals] = useState<DailyMeals | null>(null)
  const [dailyMealsWithCalories, setDailyMealsWithCalories] = useState<(DailyMeals & { 
    breakfast: (MealItem & { calories: number })[]
    lunch: (MealItem & { calories: number })[]
    dinner: (MealItem & { calories: number })[]
    snack: (MealItem & { calories: number })[]
  }) | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDailyMeals = useCallback(async (day: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDailyMeals({ day })
      setDailyMeals(data)
      
      // Get meals with calories
      const mealsWithCalories = {
        ...data,
        breakfast: await Promise.all(data.breakfast.map(getMealWithCalories)),
        lunch: await Promise.all(data.lunch.map(getMealWithCalories)),
        dinner: await Promise.all(data.dinner.map(getMealWithCalories)),
        snack: await Promise.all(data.snack.map(getMealWithCalories))
      }
      setDailyMealsWithCalories(mealsWithCalories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily meals')
      console.error('Error in useDailyMeals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTodayMeals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTodayMeals()
      setDailyMeals(data)
      
      // Get meals with calories
      const mealsWithCalories = {
        ...data,
        breakfast: await Promise.all(data.breakfast.map(getMealWithCalories)),
        lunch: await Promise.all(data.lunch.map(getMealWithCalories)),
        dinner: await Promise.all(data.dinner.map(getMealWithCalories)),
        snack: await Promise.all(data.snack.map(getMealWithCalories))
      }
      setDailyMealsWithCalories(mealsWithCalories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch today\'s meals')
      console.error('Error in useDailyMeals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearCache = useCallback((day?: string) => {
    clearDailyMealsCache(day)
    if (!day) {
      setDailyMeals(null)
      setDailyMealsWithCalories(null)
    }
  }, [])

  const addMealToDaily = useCallback(async (params: AddMealParams): Promise<AddMealResponse> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await addMeal(params)
      
      // Refresh today's meals after adding
      await fetchTodayMeals()
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add meal'
      setError(errorMessage)
      console.error('Error adding meal:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchTodayMeals])

  // Computed values
  const nutritionData = dailyMeals ? getNutritionForProfile(dailyMeals.nutrition) : null
  const mealSummary = dailyMeals ? getMealSummary(dailyMeals) : null

  return {
    dailyMeals,
    dailyMealsWithCalories,
    loading,
    error,
    fetchDailyMeals,
    fetchTodayMeals,
    clearCache,
    nutritionData,
    mealSummary,
    addMeal: addMealToDaily,
    editMeal: editMeal
  }
}
