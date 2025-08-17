"use client"

import { authenticatedRequest } from './auth'
import { appDataCache } from './cache'

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Types for API responses
export interface Recipe {
  id: number
  name: string
  image_url: string
  description: string
  prep_time: number
  additional_time: number | null
  cook_time: number
  chill_time: number | null
  total_time: number
  servings: number
  yields: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface Nutrition {
  id: number
  name: string
  unit: string
  value: number
  percent: number
}

export interface Ingredient {
  ingredient_id: number
  ingredient_name: string
  required_amount: number
  unit: string | null
}

export interface MissingIngredient {
  ingredient_name: string
  required_amount: number
  unit: string
}

export interface RecipeWithDetails {
  recipe: Recipe
  nutritions: Nutrition[]
  ingredients: Ingredient[]
}

export interface InsufficientRecipeWithDetails {
  recipe: Recipe
  nutritions: Nutrition[]
  ingredients: Ingredient[]
  missing_ingredients: MissingIngredient[]
  missing_count: number
}

// Sort options for recipes
export type SortBy = 
  | "prep_time"
  | "cook_time" 
  | "total_time"
  | "calories"
  | "protein"
  | "fat"
  | "carbs"

export type SortOrder = "asc" | "desc"

export interface GetSufficientRecipesParams {
  sort_by?: SortBy
  sort_order?: SortOrder
  include_allergies?: boolean
}

export interface GetInsufficientRecipesParams {
  num_missing: number
  num_recipes: number
  sort_by?: SortBy
  sort_order?: SortOrder
}

// Get sufficient recipes
export let getSufficientRecipes = async (params?: GetSufficientRecipesParams): Promise<RecipeWithDetails[]> => {
  try {
    // Try cache first
    const cached = appDataCache.getCachedSufficientRecipes(params || {})
    if (cached) {
      return cached
    }
    let queryParams = new URLSearchParams()
    
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)
    if (params?.include_allergies !== undefined) queryParams.append('include_allergies', params.include_allergies.toString())

    let url = `${API_BASE_URL}/recipes/get-sufficient-recipes`
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }

    let data = await authenticatedRequest<RecipeWithDetails[]>(url, { method: 'GET' })
    if (Array.isArray(data)) {
      appDataCache.saveSufficientRecipes(data, params || {})
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching sufficient recipes:', error)
    throw error
  }
}

// Get insufficient recipes  
export let getInsufficientRecipes = async (params: GetInsufficientRecipesParams): Promise<InsufficientRecipeWithDetails[]> => {
  try {
    const cached = appDataCache.getCachedInsufficientRecipes(params || {})
    if (cached) {
      return cached
    }
    let queryParams = new URLSearchParams()
    
    queryParams.append('num_missing', params.num_missing.toString())
    queryParams.append('num_recipes', params.num_recipes.toString())
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.sort_order) queryParams.append('sort_order', params.sort_order)

    let url = `${API_BASE_URL}/recipes/get-insufficient-recipes?${queryParams.toString()}`

    let data = await authenticatedRequest<InsufficientRecipeWithDetails[]>(url, { method: 'GET' })
    if (Array.isArray(data)) {
      appDataCache.saveInsufficientRecipes(data, params || {})
    }
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching insufficient recipes:', error)
    throw error
  }
}
