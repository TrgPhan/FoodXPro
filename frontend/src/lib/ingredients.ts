import { authenticatedRequest } from './auth'
import { ApiResponse } from './types'

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
