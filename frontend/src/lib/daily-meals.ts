"use client"

import { authenticatedRequest } from './auth'

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Cache constants
const DAILY_MEALS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

// Types for daily meals API responses
export interface MealItem {
  id: number
  name: string
  image: string
  servings_eaten?: number
  calories?: number
}

export interface NutritionItem {
  id: number
  name: string
  value: number
  unit: string
}

export interface DailyMeals {
  breakfast: MealItem[]
  lunch: MealItem[]
  dinner: MealItem[]
  snack: MealItem[]
  nutrition: NutritionItem[]
}

export interface GetDailyMealsParams {
  day: string // Format: "2025-08-15"
}

// Types for adding meals
export type EatAtType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface AddMealParams {
  recipe_id: number
  eat_at: EatAtType
  servings_eaten: number
}

export interface AddMealResponse {
  success: boolean
  message: string
  meal?: MealItem
}

export interface EditMealParams {
  recipe_id: number
  eat_date: string
  eat_at: EatAtType
  new_servings_eaten: number
}

export interface DeleteMealParams {
  recipe_id: number
  eat_date: string
  eat_at: EatAtType
}

export interface ApiResponse {
  success: boolean
  message: string
}

// Cache key generator for daily meals
const getDailyMealsCacheKey = (day: string): string => {
  return `daily_meals_${day}`
}

// Cache helper functions
const isCacheItemValid = (item: any): boolean => {
  if (!item || !item.timestamp || !item.data) return false
  const now = Date.now()
  return (now - item.timestamp) < DAILY_MEALS_CACHE_TTL
}

const getFromCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null
    const parsed = JSON.parse(item)
    if (isCacheItemValid(parsed)) {
      return parsed.data
    } else {
      // Remove expired item
      localStorage.removeItem(key)
      return null
    }
  } catch (error) {
    console.warn(`Failed to get ${key} from cache:`, error)
    return null
  }
}

const saveToCache = <T>(key: string, data: T): void => {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.warn(`Failed to save ${key} to cache:`, error)
  }
}

// Add meal to daily meals
export let addMeal = async (params: AddMealParams): Promise<AddMealResponse> => {
  try {
    console.log('🍽️ Adding meal to daily meals:', params)
    
    const query = new URLSearchParams()
    query.append('recipe_id', params.recipe_id.toString())
    query.append('eat_at', params.eat_at)
    query.append('servings_eaten', params.servings_eaten.toString())
    const url = `${API_BASE_URL}/daily-meals/add?${query.toString()}`
    
    const data = await authenticatedRequest<AddMealResponse>(url, { method: 'POST' })
    
    // Clear today's cache after adding meal
    const today = new Date().toISOString().split('T')[0]
    clearDailyMealsCache(today)
    
    console.log('✅ Meal added successfully:', data)
    return data
  } catch (error) {
    console.error('Error adding meal:', error)
    throw error
  }
}

// Get daily meals for a specific day with caching
export let getDailyMeals = async (params: GetDailyMealsParams): Promise<DailyMeals> => {
  try {
    const cacheKey = getDailyMealsCacheKey(params.day)
    
    // Check cache first
    const cachedData = getFromCache<DailyMeals>(cacheKey)
    if (cachedData) {
      console.log('✅ Using cached daily meals for:', params.day)
      return cachedData
    }

    // Fetch from API if not cached
    let queryParams = new URLSearchParams()
    queryParams.append('day', params.day)

    let url = `${API_BASE_URL}/daily-meals/get?${queryParams.toString()}`

    let data = await authenticatedRequest<DailyMeals>(url, { method: 'GET' })
    
    // Cache the result
    saveToCache(cacheKey, data)
    console.log('📦 Daily meals cached for:', params.day)
    
    return data
  } catch (error) {
    console.error('Error fetching daily meals:', error)
    throw error
  }
}

// Get today's meals (current date)
export let getTodayMeals = async (): Promise<DailyMeals> => {
  const today = new Date().toISOString().split('T')[0] // Format: "2025-01-15"
  return getDailyMeals({ day: today })
}

// Preload today's meals after login
export let preloadTodayMeals = async (): Promise<void> => {
  try {
    console.log('🚀 Preloading today\'s meals...')
    const todayMeals = await getTodayMeals()
    console.log('✅ Today\'s meals preloaded successfully')
  } catch (error) {
    console.warn('Failed to preload today\'s meals:', error)
  }
}

// Helper function to get nutrition by name (for mapping with user profile)
export let getNutritionByName = (nutritionList: NutritionItem[], name: string): NutritionItem | undefined => {
  return nutritionList.find(nutrition => nutrition.name === name)
}

// Helper function to get total calories from nutrition
export let getTotalCalories = (nutritionList: NutritionItem[]): number => {
  const calories = getNutritionByName(nutritionList, 'Calories')
  return calories ? calories.value : 0
}

// Helper function to get macros from nutrition
export let getMacros = (nutritionList: NutritionItem[]) => {
  return {
    protein: getNutritionByName(nutritionList, 'Protein')?.value || 0,
    fat: getNutritionByName(nutritionList, 'Total Fat')?.value || 0,
    carbs: getNutritionByName(nutritionList, 'Total Carbohydrate')?.value || 0,
    fiber: getNutritionByName(nutritionList, 'Dietary Fiber')?.value || 0,
    sugar: getNutritionByName(nutritionList, 'Total Sugars')?.value || 0
  }
}

// Helper function to get all nutrition data for profile mapping
export let getNutritionForProfile = (nutritionList: NutritionItem[]) => {
  return {
    calories: getTotalCalories(nutritionList),
    protein: getNutritionByName(nutritionList, 'Protein')?.value || 0,
    fat: getNutritionByName(nutritionList, 'Total Fat')?.value || 0,
    carbs: getNutritionByName(nutritionList, 'Total Carbohydrate')?.value || 0,
    fiber: getNutritionByName(nutritionList, 'Dietary Fiber')?.value || 0,
    sugar: getNutritionByName(nutritionList, 'Total Sugars')?.value || 0,
    cholesterol: getNutritionByName(nutritionList, 'Cholesterol')?.value || 0,
    sodium: getNutritionByName(nutritionList, 'Sodium')?.value || 0,
    calcium: getNutritionByName(nutritionList, 'Calcium')?.value || 0,
    vitaminC: getNutritionByName(nutritionList, 'Vitamin C')?.value || 0,
    iron: getNutritionByName(nutritionList, 'Iron')?.value || 0,
    potassium: getNutritionByName(nutritionList, 'Potassium')?.value || 0
  }
}

// Helper function to get meal summary for calendar
export let getMealSummary = (dailyMeals: DailyMeals) => {
  const totalMeals = dailyMeals.breakfast.length + dailyMeals.lunch.length + 
                    dailyMeals.dinner.length + dailyMeals.snack.length
  
  const nutrition = getNutritionForProfile(dailyMeals.nutrition)
  
  return {
    totalMeals,
    hasBreakfast: dailyMeals.breakfast.length > 0,
    hasLunch: dailyMeals.lunch.length > 0,
    hasDinner: dailyMeals.dinner.length > 0,
    hasSnack: dailyMeals.snack.length > 0,
    nutrition
  }
}

// Cache for sufficient recipes to avoid repeated API calls
let recipesCache: any[] | null = null
let recipesCacheTimestamp = 0
const RECIPES_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Helper function to get calories from sufficient recipes by name
export let getCaloriesFromRecipes = async (mealName: string): Promise<number> => {
  try {
    // Check cache first
    const now = Date.now()
    if (recipesCache && (now - recipesCacheTimestamp) < RECIPES_CACHE_TTL) {
      console.log('✅ Using cached recipes for calories lookup')
    } else {
      // Import getSufficientRecipes dynamically to avoid circular dependency
      const { getSufficientRecipes } = await import('./food')
      
      // Get all sufficient recipes
      console.log('🌐 Fetching recipes for calories lookup')
      recipesCache = await getSufficientRecipes()
      recipesCacheTimestamp = now
      console.log('📦 Recipes cached for calories lookup')
    }
    
    // Find recipe by name (case insensitive)
    const recipe = recipesCache?.find(r => 
      r.recipe.name.toLowerCase().includes(mealName.toLowerCase()) ||
      mealName.toLowerCase().includes(r.recipe.name.toLowerCase())
    )
    
    if (recipe) {
      console.log(`✅ Found calories for "${mealName}": ${recipe.recipe.calories} cal`)
    } else {
      console.log(`⚠️ No calories found for "${mealName}"`)
    }
    
    return recipe ? recipe.recipe.calories : 0
  } catch (error) {
    console.error('Error getting calories from recipes:', error)
    return 0
  }
}

// Clear daily meals cache for a specific day
export let clearDailyMealsCache = (day?: string): void => {
  if (day) {
    const cacheKey = getDailyMealsCacheKey(day)
    localStorage.removeItem(cacheKey)
    console.log('🗑️ Daily meals cache cleared for:', day)
  } else {
    // Clear all daily meals cache
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('daily_meals_')) {
        localStorage.removeItem(key)
      }
    })
    console.log('🗑️ All daily meals cache cleared')
  }
}

// Edit meal (update servings_eaten)
export let editMeal = async (params: EditMealParams): Promise<ApiResponse> => {
  try {
    console.log('✏️ Editing meal:', params)
    const query = new URLSearchParams()
    query.append('recipe_id', params.recipe_id.toString())
    query.append('eat_date', params.eat_date)
    query.append('eat_at', params.eat_at)
    query.append('new_servings_eaten', params.new_servings_eaten.toString())
    const url = `${API_BASE_URL}/daily-meals/edit?${query.toString()}`
    const data = await authenticatedRequest<ApiResponse>(url, { method: 'PUT' })
    console.log('✅ Meal edited:', data)
    // Clear cache for that date
    clearDailyMealsCache(params.eat_date)
    return data
  } catch (error) {
    console.error('Error editing meal:', error)
    throw error
  }
}

// Delete meal
export let deleteMeal = async (params: DeleteMealParams): Promise<ApiResponse> => {
  try {
    console.log('🗑️ Deleting meal:', params)
    const query = new URLSearchParams()
    query.append('recipe_id', params.recipe_id.toString())
    query.append('eat_date', params.eat_date)
    query.append('eat_at', params.eat_at)
    const url = `${API_BASE_URL}/daily-meals/delete?${query.toString()}`
    const data = await authenticatedRequest<ApiResponse>(url, { method: 'DELETE' })
    console.log('✅ Meal deleted:', data)
    clearDailyMealsCache(params.eat_date)
    return data
  } catch (error) {
    console.error('Error deleting meal:', error)
    throw error
  }
}
