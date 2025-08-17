import { authenticatedRequest } from './auth'
import { ApiResponse } from './types'
import { appDataCache } from './cache'

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Types for ingredient data
export interface Ingredient {
  id: number
  name: string
  add_date: string
  expire_date?: string
  image?: string // Optional image URL
  ingredients?: string[] // Optional ingredients list
}

export interface IngredientSearchResult {
  id: number
  name: string
}



export interface GetIngredientsParams {
  limit?: number
  offset?: number
  sort_by?: 'name' | 'date'
  sort_order?: 'asc' | 'desc'
}

export interface AddIngredientParams {
  name: string
  add_date: string
  expire_date?: string
}

export interface EditIngredientParams {
  id: number
  expire_date?: string
}

// Get ingredients with pagination and sorting
export let getIngredients = async (params?: GetIngredientsParams): Promise<Ingredient[]> => {
  try {
    let queryParams = new URLSearchParams()
    
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

    let url = `${API_BASE_URL}/ingredients/get`
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }

    let data = await authenticatedRequest<Ingredient[]>(url, { method: 'GET' })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    throw error
  }
}

// Add new ingredient
export let addIngredient = async (ingredientData: AddIngredientParams): Promise<ApiResponse> => {
  try {
    let data = await authenticatedRequest<ApiResponse>(`${API_BASE_URL}/ingredients/add`, {
      method: 'POST',
      body: JSON.stringify(ingredientData)
    })
    appDataCache.invalidateRecipes()
    return data
  } catch (error) {
    console.error('Error adding ingredient:', error)
    throw error
  }
}

// Delete ingredient
export let deleteIngredient = async (id: number): Promise<ApiResponse> => {
  try {
    let data = await authenticatedRequest<ApiResponse>(`${API_BASE_URL}/ingredients/delete/${id}`, {
      method: 'DELETE'
    })
    appDataCache.invalidateRecipes()
    return data
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    throw error
  }
}

// Edit ingredient
export let editIngredient = async (ingredientData: EditIngredientParams): Promise<ApiResponse> => {
  try {
    let data = await authenticatedRequest<ApiResponse>(`${API_BASE_URL}/ingredients/edit`, {
      method: 'PUT',
      body: JSON.stringify(ingredientData)
    })
    appDataCache.invalidateRecipes()
    return data
  } catch (error) {
    console.error('Error editing ingredient:', error)
    throw error
  }
}

// Search ingredients by name
export let searchIngredients = async (name: string, limit: number = 10): Promise<IngredientSearchResult[]> => {
  try {
    let queryParams = new URLSearchParams()
    queryParams.append('name', name)
    queryParams.append('limit', limit.toString())

    let data = await authenticatedRequest<IngredientSearchResult[]>(`${API_BASE_URL}/ingredients/search?${queryParams.toString()}`, {
      method: 'GET'
    })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error searching ingredients:', error)
    throw error
  }
}

// ---------------------------------------------------------------------------
// 🔄 Ingredient Image Cache (persistent across sessions)
// ---------------------------------------------------------------------------

const INGREDIENT_IMAGE_CACHE_KEY = 'ingredientImageCache'

// In-memory map for quick look-ups
const imageCache = new Map<number, string>()

// Load any previously persisted cache from localStorage
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(INGREDIENT_IMAGE_CACHE_KEY)
    if (stored) {
      const parsed: [number, string][] = JSON.parse(stored)
      parsed.forEach(([id, url]) => imageCache.set(id, url))
    }
  } catch (err) {
    console.warn('Failed to parse ingredient image cache from storage', err)
  }

  // Clear cache automatically on auth change (logout triggers this event)
  window.addEventListener('auth-change', () => {
    clearImageCache()
  })
}

// Persist the in-memory cache to localStorage
const persistCache = () => {
  if (typeof window === 'undefined') return
  try {
    const arr = Array.from(imageCache.entries())
    localStorage.setItem(INGREDIENT_IMAGE_CACHE_KEY, JSON.stringify(arr))
  } catch (err) {
    console.warn('Failed to persist ingredient image cache', err)
  }
}

// Get ingredient image by ingredient_id with caching
export let getIngredientImage = async (ingredient_id: number): Promise<string> => {
  // Check cache first
  if (imageCache.has(ingredient_id)) {
    console.log(`💾 Using cached image for ingredient ${ingredient_id}`)
    return imageCache.get(ingredient_id)!
  }

  try {
    let queryParams = new URLSearchParams()
    queryParams.append('ingredient_id', ingredient_id.toString())

    console.log(`🌐 Calling API: ${API_BASE_URL}/ingredients/get-ingredient-image?${queryParams.toString()}`)
    
    let data = await authenticatedRequest<string>(`${API_BASE_URL}/ingredients/get-ingredient-image?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log(`📡 API Response:`, data)
    console.log(`📡 Response type:`, typeof data)
    
    // Validate the returned URL
    let finalUrl = "/placeholder.svg"
    if (data && typeof data === 'string' && data.trim() !== '') {
      try {
        // If it's already a full URL, use it as is
        if (data.startsWith('http://') || data.startsWith('https://')) {
          console.log(`✅ Absolute URL received:`, data)
          finalUrl = data
        }
        
        // If it's a relative URL, construct full URL
        else if (data.startsWith('/')) {
          const fullUrl = `${API_BASE_URL}${data}`
          console.log(`✅ Constructed full URL from relative:`, fullUrl)
          finalUrl = fullUrl
        }
        
        // If it's just a path without leading slash, add it
        else {
          const fullUrl = `${API_BASE_URL}/${data}`
          console.log(`✅ Constructed full URL from path:`, fullUrl)
          finalUrl = fullUrl
        }
        
      } catch (urlError) {
        console.log(`⚠️ Invalid URL format:`, data)
        finalUrl = "/placeholder.svg"
      }
    } else {
      console.log(`⚠️ No valid image URL received, using placeholder`)
    }

    // Cache the result
    imageCache.set(ingredient_id, finalUrl)
    persistCache()
    console.log(`💾 Cached image for ingredient ${ingredient_id}:`, finalUrl)
    
    return finalUrl
  } catch (error) {
    console.error('Error fetching ingredient image:', error)
    const fallbackUrl = "/placeholder.svg"
    imageCache.set(ingredient_id, fallbackUrl)
    persistCache()
    return fallbackUrl
  }
}

// Clear image cache (useful for testing or memory management)
export let clearImageCache = (): void => {
  imageCache.clear()
  if (typeof window !== 'undefined') {
    localStorage.removeItem(INGREDIENT_IMAGE_CACHE_KEY)
  }
  console.log('🗑️ Ingredient image cache cleared')
}

// Get cached image without API call
export let getCachedImage = (ingredient_id: number): string | null => {
  return imageCache.get(ingredient_id) || null
}
