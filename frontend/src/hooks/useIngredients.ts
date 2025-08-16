import { useState, useEffect } from "react"
import { IngredientData } from "@/components/ingredient-form"
import { 
  getIngredients, 
  addIngredient as apiAddIngredient, 
  editIngredient as apiEditIngredient, 
  deleteIngredient as apiDeleteIngredient,
  searchIngredients as apiSearchIngredients,
  Ingredient 
} from "@/lib/ingredients"
import { appDataCache } from "@/lib/cache"

export function useIngredients() {
  let [ingredients, setIngredients] = useState<Ingredient[]>([])
  let [loading, setLoading] = useState(false)
  let [error, setError] = useState<string | null>(null)

  // Load ingredients from cache or API (force refresh option)
  let fetchIngredients = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      // Try cache first unless force refresh
      if (!forceRefresh) {
        let cachedIngredients = appDataCache.getCachedIngredients()
        if (cachedIngredients) {
          console.log('✅ Using cached ingredients (fetchIngredients)')
          setIngredients(cachedIngredients)
          setLoading(false)
          return
        }
      }
      
      // Fetch from API
      console.log('🌐 Fetching ingredients from API (fetchIngredients)')
      let data = await getIngredients()
      let ingredientsData = Array.isArray(data) ? data : []
      
      // Always update state with fresh data
      setIngredients(ingredientsData)
      
      // Cache the result for future use
      appDataCache.saveIngredients(ingredientsData)
      console.log(`✅ Fetched ${ingredientsData.length} ingredients from API`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ingredients')
      console.error('Error fetching ingredients:', err)
      setIngredients([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Load initial data - check cache first to avoid duplicate API calls
  useEffect(() => {
    // Only fetch if no cached data exists
    const cachedIngredients = appDataCache.getCachedIngredients()
    if (cachedIngredients) {
      console.log('✅ Using existing cached ingredients, skipping API call')
      setIngredients(cachedIngredients)
      setLoading(false)
    } else {
      console.log('🚀 No cache found, fetching from API')
      fetchIngredients()
    }
  }, [])

  // Add new ingredient - fetch real data immediately after success
  let addIngredient = async (ingredient: IngredientData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Make API call first
      let response = await apiAddIngredient({
        name: ingredient.name,
        add_date: new Date().toISOString().split('T')[0],
        expire_date: ingredient.expire_date
      })
      
      if (response.status === 'success') {
        // Success: Immediately fetch fresh data from API to get real ingredient with correct ID
        console.log('✅ Ingredient added successfully, fetching fresh data...')
        appDataCache.delete('app_ingredients') // Clear cache to force fresh fetch
        await fetchIngredients(true) // Force refresh from API
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ingredient')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update existing ingredient with optimistic update
  let updateIngredient = async (updatedIngredient: IngredientData) => {
    const originalIngredients = [...ingredients]
    
    try {
      setLoading(true)
      
      // Optimistic update - update ingredient in UI immediately
      const updatedIngredients = ingredients.map(ing => 
        ing.id === parseInt(updatedIngredient.id) 
          ? { 
              ...ing, 
              name: updatedIngredient.name,
              expire_date: updatedIngredient.expire_date
            }
          : ing
      )
      setIngredients(updatedIngredients)
      
      // Make API call
      let response = await apiEditIngredient({
        id: parseInt(updatedIngredient.id),
        expire_date: updatedIngredient.expire_date
      })
      
      if (response.status === 'success') {
        // Success: Update cache with new data
        appDataCache.saveIngredients(updatedIngredients)
      } else {
        // Revert optimistic update on failure
        setIngredients(originalIngredients)
        throw new Error(response.message)
      }
    } catch (err) {
      // Revert optimistic update on error
      setIngredients(originalIngredients)
      setError(err instanceof Error ? err.message : 'Failed to update ingredient')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete ingredient with optimistic update
  let deleteIngredient = async (id: number) => {
    const originalIngredients = [...ingredients]
    
    try {
      setLoading(true)
      
      // Optimistic update - remove ingredient from UI immediately
      const filteredIngredients = ingredients.filter(ing => ing.id !== id)
      setIngredients(filteredIngredients)
      
      // Make API call
      let response = await apiDeleteIngredient(id)
      
      if (response.status === 'success') {
        // Success: Update cache with new data
        appDataCache.saveIngredients(filteredIngredients)
      } else {
        // Revert optimistic update on failure
        setIngredients(originalIngredients)
        throw new Error(response.message)
      }
    } catch (err) {
      // Revert optimistic update on error
      setIngredients(originalIngredients)
      setError(err instanceof Error ? err.message : 'Failed to delete ingredient')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Search ingredients
  let searchIngredients = async (searchTerm: string) => {
    try {
      let results = await apiSearchIngredients(searchTerm)
      return results
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search ingredients')
      return []
    }
  }

  return {
    ingredients,
    loading,
    error,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    searchIngredients,
    refreshIngredients: () => fetchIngredients(true) // Always force refresh when called manually
  }
} 