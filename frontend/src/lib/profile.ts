import { UserProfile, ApiResponse, UserProfileForm } from './types'
import { authenticatedRequest } from './auth'

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Get user profile
export let getUserProfile = async (): Promise<UserProfile> => {
  try {
    let data = await authenticatedRequest<UserProfile>(`${API_BASE_URL}/profile/get`, {
      method: 'GET'
    })
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

// Edit user profile
export let editUserProfile = async (profileData: UserProfileForm): Promise<UserProfile> => {
  try {
    let data = await authenticatedRequest<UserProfile>(`${API_BASE_URL}/profile/edit`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// Add new user profile  
export let addUserProfile = async (profileData: UserProfileForm): Promise<UserProfile> => {
  try {
    let data = await authenticatedRequest<UserProfile>(`${API_BASE_URL}/profile/add`, {
      method: 'POST',
      body: JSON.stringify(profileData)
    })
    return data
  } catch (error) {
    console.error('Error adding user profile:', error)
    throw error
  }
}
