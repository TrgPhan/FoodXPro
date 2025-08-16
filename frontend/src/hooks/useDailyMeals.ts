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
  addMeal,
  AddMealParams,
  AddMealResponse,
  editMeal,
  EditMealParams,
  deleteMeal,
  DeleteMealParams,
  ApiResponse
} from '../lib/daily-meals'

export interface UseDailyMealsReturn {
  dailyMeals: DailyMeals | null
  dailyMealsWithCalories: DailyMeals | null
  loading: boolean
  error: string | null
  fetchDailyMeals: (day: string) => Promise<void>
  fetchTodayMeals: () => Promise<void>
  clearCache: (day?: string) => void
  nutritionData: ReturnType<typeof getNutritionForProfile> | null
  mealSummary: ReturnType<typeof getMealSummary> | null
  addMeal: (params: AddMealParams) => Promise<AddMealResponse>
  editMeal: (params: EditMealParams) => Promise<ApiResponse>
  deleteMeal: (params: DeleteMealParams) => Promise<ApiResponse>
}

export const useDailyMeals = (): UseDailyMealsReturn => {
  const [dailyMeals, setDailyMeals] = useState<DailyMeals | null>(null)
  const [dailyMealsWithCalories, setDailyMealsWithCalories] = useState<DailyMeals | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDailyMeals = useCallback(async (day: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDailyMeals({ day })
      setDailyMeals(data)
      setDailyMealsWithCalories(data) // Now calories come directly from API
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
      setDailyMealsWithCalories(data) // Now calories come directly from API
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

  const editMealInDaily = useCallback(async (params: EditMealParams): Promise<ApiResponse> => {
    try {
      setLoading(true)
      setError(null)
      const response = await editMeal(params)
      await fetchTodayMeals()
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit meal'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchTodayMeals])

  const deleteMealFromDaily = useCallback(async (params: DeleteMealParams): Promise<ApiResponse> => {
    try {
      setLoading(true)
      setError(null)
      const response = await deleteMeal(params)
      await fetchTodayMeals()
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete meal'
      setError(errorMessage)
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
    editMeal: editMealInDaily,
    deleteMeal: deleteMealFromDaily
  }
}
