import { authenticatedRequest } from './auth'
import { ApiResponse } from './types'

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Types for allergy data
export interface Allergy {
  id: number
  name: string
}

export interface AllergySearchResult {
  id: number
  name: string
}

// Search allergies by name
export let searchAllergies = async (name: string, limit: number = 10): Promise<AllergySearchResult[]> => {
  try {
    let queryParams = new URLSearchParams()
    queryParams.append('name', name)
    queryParams.append('limit', limit.toString())

    let data = await authenticatedRequest<AllergySearchResult[]>(`${API_BASE_URL}/allergies/search?${queryParams.toString()}`, {
      method: 'GET'
    })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error searching allergies:', error)
    throw error
  }
}
