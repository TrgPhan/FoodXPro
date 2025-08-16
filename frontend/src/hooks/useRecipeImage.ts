"use client"

import { useState, useEffect } from 'react'
import { getRecipeImage, getCachedRecipeImage } from '@/lib/recipe-images'

/**
 * Hook: useRecipeImage
 * @param recipeId number
 * @param recipeName string – only used for debug
 */
export function useRecipeImage(recipeId: number | undefined, recipeName?: string) {
  const initial = recipeId ? getCachedRecipeImage(recipeId) || '/placeholder.svg' : '/placeholder.svg'
  const [imageUrl, setImageUrl] = useState<string>(initial)

  useEffect(() => {
    if (!recipeId) return

    // First check cache
    const cached = getCachedRecipeImage(recipeId)
    if (cached) {
      setImageUrl(cached)
      return
    }

    const fetchImg = async () => {
      try {
        const url = await getRecipeImage(recipeId)
        setImageUrl(url)
      } catch (err) {
        console.error('useRecipeImage error:', err)
        setImageUrl('/placeholder.svg')
      }
    }

    fetchImg()
  }, [recipeId])

  return { imageUrl }
}
