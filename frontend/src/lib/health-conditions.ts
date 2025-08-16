import { authenticatedRequest } from './auth'
import { ApiResponse } from './types'

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Types for health condition data
export interface HealthCondition {
  id: number
  name: string
}

export interface HealthConditionSearchResult {
  id: number
  name: string
}

// Search health conditions by name
export let searchHealthConditions = async (name: string, limit: number = 10): Promise<HealthConditionSearchResult[]> => {
  try {
    let queryParams = new URLSearchParams()
    queryParams.append('name', name)
    queryParams.append('limit', limit.toString())

    let data = await authenticatedRequest<HealthConditionSearchResult[]>(`${API_BASE_URL}/health-conditions/search?${queryParams.toString()}`, {
      method: 'GET'
    })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error searching health conditions:', error)
    throw error
  }
}
