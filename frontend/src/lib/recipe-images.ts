"use client"

import { authenticatedRequest } from './auth'

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Simple in-memory cache for recipe images
const imageCache = new Map<number, string>()

/**
 * Fetch recipe image url by recipe_id with caching
 */
export const getRecipeImage = async (recipe_id: number): Promise<string> => {
  // Check cache first
  if (imageCache.has(recipe_id)) {
    return imageCache.get(recipe_id) as string
  }

  try {
    const queryParams = new URLSearchParams()
    queryParams.append('recipe_id', recipe_id.toString())

    const endpoint = `${API_BASE_URL}/recipes/get-recipe-image?${queryParams.toString()}`
    console.log(`🌐 Fetching recipe image from ${endpoint}`)

    const data = await authenticatedRequest<string>(endpoint, { method: 'GET' })

    let finalUrl = '/placeholder.svg'
    if (data && typeof data === 'string' && data.trim() !== '') {
      if (data.startsWith('http://') || data.startsWith('https://')) {
        finalUrl = data
      } else if (data.startsWith('/')) {
        finalUrl = `${API_BASE_URL}${data}`
      } else {
        finalUrl = `${API_BASE_URL}/${data}`
      }
    }
    // Save to cache
    imageCache.set(recipe_id, finalUrl)
    return finalUrl
  } catch (err) {
    console.error('Error fetch recipe image:', err)
    const fallback = '/placeholder.svg'
    imageCache.set(recipe_id, fallback)
    return fallback
  }
}

export const getCachedRecipeImage = (recipe_id: number): string | null => {
  return imageCache.get(recipe_id) || null
}

export const clearRecipeImageCache = () => imageCache.clear()
