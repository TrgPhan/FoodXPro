"use client"

import { authenticatedRequest } from './auth'

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

const CACHE_KEY = 'recipeImageCache'

// Simple in-memory cache for recipe images
const imageCache = new Map<number, string>()

// Load existing cache from localStorage (if any)
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (stored) {
      const parsed: [number, string][] = JSON.parse(stored)
      parsed.forEach(([id, url]) => imageCache.set(id, url))
    }
  } catch (err) {
    console.warn('Failed to parse recipe image cache from storage', err)
  }

  // Clear cache on auth-change (logout triggers this)
  window.addEventListener('auth-change', () => {
    clearRecipeImageCache()
  })
}

const persistCache = () => {
  if (typeof window === 'undefined') return
  try {
    const arr = Array.from(imageCache.entries())
    localStorage.setItem(CACHE_KEY, JSON.stringify(arr))
  } catch (err) {
    console.warn('Failed to persist recipe image cache', err)
  }
}

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
    // Only cache if it's not a placeholder
    if (finalUrl !== '/placeholder.svg') {
      imageCache.set(recipe_id, finalUrl)
      persistCache()
      console.log(`💾 Cached recipe image for ${recipe_id}:`, finalUrl)
    } else {
      console.log(`🚫 Not caching placeholder for recipe ${recipe_id}`)
    }
    return finalUrl
  } catch (err) {
    console.error('Error fetch recipe image:', err)
    const fallback = '/placeholder.svg'
    // Don't cache placeholder
    console.log(`🚫 Not caching placeholder for recipe ${recipe_id} (error fallback)`)
    return fallback
  }
}

export const getCachedRecipeImage = (recipe_id: number): string | null => {
  return imageCache.get(recipe_id) || null
}

export const clearRecipeImageCache = () => {
  imageCache.clear()
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY)
  }
}
