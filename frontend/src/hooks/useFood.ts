"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  getSufficientRecipes, 
  getInsufficientRecipes,
  type RecipeWithDetails,
  type InsufficientRecipeWithDetails,
  type GetSufficientRecipesParams,
  type GetInsufficientRecipesParams,
  type SortBy,
  type SortOrder
} from "@/lib/food"

export interface UseRecipesOptions {
  autoFetch?: boolean
  initialSufficientParams?: GetSufficientRecipesParams
  initialInsufficientParams?: GetInsufficientRecipesParams
}

export interface UseRecipesReturn {
  // Data
  sufficientRecipes: RecipeWithDetails[]
  insufficientRecipes: InsufficientRecipeWithDetails[]
  
  // Loading states
  loading: boolean
  sufficientLoading: boolean
  insufficientLoading: boolean
  
  // Error states
  error: string | null
  sufficientError: string | null
  insufficientError: string | null
  
  // Parameters
  sufficientParams: GetSufficientRecipesParams
  insufficientParams: GetInsufficientRecipesParams
  setSufficientParams: (params: GetSufficientRecipesParams) => void
  setInsufficientParams: (params: GetInsufficientRecipesParams) => void
  
  // Actions
  fetchSufficientRecipes: () => Promise<void>
  fetchInsufficientRecipes: () => Promise<void>
  refresh: () => Promise<void>
}

export const useRecipes = (options: UseRecipesOptions = {}): UseRecipesReturn => {
  const { 
    autoFetch = true, 
    initialSufficientParams = {},
    initialInsufficientParams = { num_missing: 1, num_recipes: 100 }
  } = options
  
  // State
  const [sufficientRecipes, setSufficientRecipes] = useState<RecipeWithDetails[]>([])
  const [insufficientRecipes, setInsufficientRecipes] = useState<InsufficientRecipeWithDetails[]>([])
  const [sufficientParams, setSufficientParams] = useState<GetSufficientRecipesParams>(initialSufficientParams)
  const [insufficientParams, setInsufficientParams] = useState<GetInsufficientRecipesParams>(initialInsufficientParams)
  
  // Loading states
  const [sufficientLoading, setSufficientLoading] = useState(false)
  const [insufficientLoading, setInsufficientLoading] = useState(false)
  
  // Error states
  const [sufficientError, setSufficientError] = useState<string | null>(null)
  const [insufficientError, setInsufficientError] = useState<string | null>(null)
  
  // Computed values
  const loading = sufficientLoading || insufficientLoading
  const error = sufficientError || insufficientError
  
  // Fetch sufficient recipes
  const fetchSufficientRecipes = useCallback(async () => {
    setSufficientLoading(true)
    setSufficientError(null)
    
    try {
      const recipes = await getSufficientRecipes(sufficientParams)
      setSufficientRecipes(recipes)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách công thức có thể làm"
      setSufficientError(errorMessage)
      console.error("Error fetching sufficient recipes:", err)
    } finally {
      setSufficientLoading(false)
    }
  }, [sufficientParams])
  
  // Fetch insufficient recipes
  const fetchInsufficientRecipes = useCallback(async () => {
    setInsufficientLoading(true)
    setInsufficientError(null)
    
    try {
      const recipes = await getInsufficientRecipes(insufficientParams)
      setInsufficientRecipes(recipes)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách công thức thiếu nguyên liệu"
      setInsufficientError(errorMessage)
      console.error("Error fetching insufficient recipes:", err)
    } finally {
      setInsufficientLoading(false)
    }
  }, [insufficientParams])
  
  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchSufficientRecipes(), fetchInsufficientRecipes()])
  }, [fetchSufficientRecipes, fetchInsufficientRecipes])
  
  // Auto-fetch on mount and params changes
  useEffect(() => {
    if (autoFetch) {
      fetchSufficientRecipes()
    }
  }, [autoFetch, fetchSufficientRecipes])

  useEffect(() => {
    if (autoFetch) {
      fetchInsufficientRecipes()
    }
  }, [autoFetch, fetchInsufficientRecipes])
  
  return {
    // Data
    sufficientRecipes,
    insufficientRecipes,
    
    // Loading states
    loading,
    sufficientLoading,
    insufficientLoading,
    
    // Error states
    error,
    sufficientError,
    insufficientError,
    
    // Parameters
    sufficientParams,
    insufficientParams,
    setSufficientParams,
    setInsufficientParams,
    
    // Actions
    fetchSufficientRecipes,
    fetchInsufficientRecipes,
    refresh,
  }
}


