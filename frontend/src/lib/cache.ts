import { CacheItem, ChatSession, Message } from "./types"
import { CACHE_TTL, CACHE_CLEANUP_INTERVAL } from "./constants"

class Cache {
  private cache = new Map<string, CacheItem<any>>()
  private readonly DEFAULT_TTL = CACHE_TTL

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if item has expired
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    const item = this.cache.get(key)

    if (!item) {
      return false
    }

    // Check if item has expired
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Get all valid keys
  keys(): string[] {
    const now = Date.now()
    const validKeys: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp <= item.ttl) {
        validKeys.push(key)
      } else {
        this.cache.delete(key)
      }
    }

    return validKeys
  }

  // Get cache size (only valid items)
  size(): number {
    const now = Date.now()
    let count = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp <= item.ttl) {
        count++
      } else {
        this.cache.delete(key)
      }
    }

    return count
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Chat history specific cache
export class ChatCache extends Cache {
  private readonly CHAT_HISTORY_KEY = 'chat_history'
  private readonly CHAT_SETTINGS_KEY = 'chat_settings'

  // Save chat history
  saveChatHistory(messages: any[]): void {
    this.set(this.CHAT_HISTORY_KEY, messages)
  }

  // Get chat history
  getChatHistory(): any[] | null {
    return this.get(this.CHAT_HISTORY_KEY)
  }

  // Save chat settings
  saveChatSettings(settings: any): void {
    this.set(this.CHAT_SETTINGS_KEY, settings)
  }

  // Get chat settings
  getChatSettings(): any | null {
    return this.get(this.CHAT_SETTINGS_KEY)
  }

  // Clear chat history
  clearChatHistory(): void {
    this.delete(this.CHAT_HISTORY_KEY)
  }

  // Clear all chat data
  clearChatData(): void {
    this.delete(this.CHAT_HISTORY_KEY)
    this.delete(this.CHAT_SETTINGS_KEY)
  }
}

// Chat session management using localStorage
export class ChatSessionManager {
  private readonly CHAT_SESSIONS_KEY = "food_app_chat_sessions"
  private readonly CURRENT_SESSION_KEY = "food_app_current_session"

  // Get all chat sessions
  getAllSessions(): ChatSession[] {
    if (typeof window === "undefined") return []

    try {
      const sessions = localStorage.getItem(this.CHAT_SESSIONS_KEY)
      if (!sessions) return []

      return JSON.parse(sessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
    } catch (error) {
      console.error("Error loading chat sessions:", error)
      return []
    }
  }

  // Save all chat sessions
  saveSessions(sessions: ChatSession[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.CHAT_SESSIONS_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error("Error saving chat sessions:", error)
    }
  }

  // Create new chat session
  createNewSession(): ChatSession {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random()}`,
      title: "Chat mới",
      messages: [
        {
          id: "welcome-1",
          text: "Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn gợi ý món ăn, hướng dẫn nấu ăn và tư vấn sức khỏe. Bạn muốn tôi giúp gì hôm nay?",
          isBot: true,
          timestamp: new Date(),
          isTyping: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      toolData: null
    }

    const sessions = this.getAllSessions()
    sessions.unshift(newSession) // Add to beginning
    this.saveSessions(sessions)
    this.setCurrentSession(newSession.id)

    return newSession
  }

  // Update existing session
  updateSession(sessionId: string, messages: Message[]): void {
    const sessions = this.getAllSessions()
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId)

    if (sessionIndex !== -1) {
      sessions[sessionIndex].messages = messages
      sessions[sessionIndex].updatedAt = new Date()

      // Auto-generate title from first user message
      const firstUserMessage = messages.find((m) => !m.isBot && m.text.trim())
      if (firstUserMessage && sessions[sessionIndex].title === "Chat mới") {
        sessions[sessionIndex].title =
          firstUserMessage.text.slice(0, 30) + (firstUserMessage.text.length > 30 ? "..." : "")
      }

      this.saveSessions(sessions)
    }
  }

  // Delete session
  deleteSession(sessionId: string): void {
    const sessions = this.getAllSessions()
    const filteredSessions = sessions.filter((s) => s.id !== sessionId)
    this.saveSessions(filteredSessions)

    // If current session was deleted, clear it
    if (this.getCurrentSessionId() === sessionId) {
      this.clearCurrentSession()
    }
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(this.CURRENT_SESSION_KEY)
  }

  // Set current session
  setCurrentSession(sessionId: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.CURRENT_SESSION_KEY, sessionId)
  }

  // Clear current session
  clearCurrentSession(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.CURRENT_SESSION_KEY)
  }

  // Get session by ID
  getSession(sessionId: string): ChatSession | null {
    const sessions = this.getAllSessions()
    return sessions.find((s) => s.id === sessionId) || null
  }
}

// Persistent cache using localStorage with 10-minute TTL
export class AppDataCache {
  private readonly INGREDIENTS_KEY = 'foodxpro_ingredients'
  private readonly PROFILE_KEY = 'foodxpro_profile'
  private readonly CACHE_VERSION_KEY = 'foodxpro_cache_version'
  private readonly CURRENT_VERSION = '1.0'
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds - reduced for faster refresh
  // 🔥 Recipe cache prefixes
  private readonly SUFFICIENT_RECIPES_PREFIX = 'foodxpro_sufficient_recipes_'
  private readonly INSUFFICIENT_RECIPES_PREFIX = 'foodxpro_insufficient_recipes_'

  // Check if cache item is valid (not expired)
  private isCacheItemValid(item: any): boolean {
    if (!item || !item.timestamp || !item.data) return false
    const now = Date.now()
    return (now - item.timestamp) < this.CACHE_TTL
  }

  // Get item from localStorage
  private getFromStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      const parsed = JSON.parse(item)
      if (this.isCacheItemValid(parsed)) {
        return parsed.data
      } else {
        // Remove expired item
        localStorage.removeItem(key)
        return null
      }
    } catch (error) {
      console.warn(`Failed to get ${key} from cache:`, error)
      return null
    }
  }

  // Save item to localStorage with timestamp
  private saveToStorage<T>(key: string, data: T): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        version: this.CURRENT_VERSION
      }
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn(`Failed to save ${key} to cache:`, error)
    }
  }

  // Remove item from localStorage
  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove ${key} from cache:`, error)
    }
  }

  // Save ingredients to persistent cache
  saveIngredients(ingredients: any[]): void {
    this.saveToStorage(this.INGREDIENTS_KEY, ingredients)
    console.log('📦 Ingredients cached to localStorage:', ingredients.length, 'items')
  }

  // Get cached ingredients from persistent storage
  getCachedIngredients(): any[] | null {
    const ingredients = this.getFromStorage<any[]>(this.INGREDIENTS_KEY)
    if (ingredients) {
      console.log('✅ Using cached ingredients from localStorage:', ingredients.length, 'items')
    }
    return ingredients
  }

  // Save profile to persistent cache
  saveProfile(profile: any): void {
    this.saveToStorage(this.PROFILE_KEY, profile)
    console.log('📦 Profile cached to localStorage:', profile.username || 'unknown')
  }

  // Get cached profile from persistent storage
  getCachedProfile(): any | null {
    const profile = this.getFromStorage<any>(this.PROFILE_KEY)
    if (profile) {
      console.log('✅ Using cached profile from localStorage:', profile.username || 'unknown')
    }
    return profile
  }

  // ------------------------------------------------------------------
  // Recipe caching
  // ------------------------------------------------------------------
  private generateRecipesKey(prefix: string, params: any = {}): string {
    let paramString = 'default'
    try {
      paramString = encodeURIComponent(JSON.stringify(params || {}))
    } catch (_) { }
    return `${prefix}${paramString}`
  }

  // Sufficient recipes
  saveSufficientRecipes(recipes: any[], params: any = {}): void {
    const key = this.generateRecipesKey(this.SUFFICIENT_RECIPES_PREFIX, params)
    this.saveToStorage(key, recipes)
    console.log('📦 Sufficient recipes cached:', recipes.length, 'items')
  }

  getCachedSufficientRecipes(params: any = {}): any[] | null {
    const key = this.generateRecipesKey(this.SUFFICIENT_RECIPES_PREFIX, params)
    const data = this.getFromStorage<any[]>(key)
    if (data) {
      console.log('✅ Using cached sufficient recipes:', data.length, 'items')
    }
    return data
  }

  // Insufficient recipes
  saveInsufficientRecipes(recipes: any[], params: any = {}): void {
    const key = this.generateRecipesKey(this.INSUFFICIENT_RECIPES_PREFIX, params)
    this.saveToStorage(key, recipes)
    console.log('📦 Insufficient recipes cached:', recipes.length, 'items')
  }

  getCachedInsufficientRecipes(params: any = {}): any[] | null {
    const key = this.generateRecipesKey(this.INSUFFICIENT_RECIPES_PREFIX, params)
    const data = this.getFromStorage<any[]>(key)
    if (data) {
      console.log('✅ Using cached insufficient recipes:', data.length, 'items')
    }
    return data
  }

  // Invalidate recipe cache
  invalidateRecipes(): void {
    if (typeof window === 'undefined') return
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith(this.SUFFICIENT_RECIPES_PREFIX) || k.startsWith(this.INSUFFICIENT_RECIPES_PREFIX))) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    if (keysToRemove.length) {
      console.log('🗑️ Recipes cache invalidated')
    }
  }

  // Clear all app data from persistent storage
  clearAppData(): void {
    this.removeFromStorage(this.INGREDIENTS_KEY)
    this.removeFromStorage(this.PROFILE_KEY)
    this.removeFromStorage(this.CACHE_VERSION_KEY)
    console.log('🗑️ App cache cleared from localStorage')
  }

  // Check if ingredients are cached and valid
  hasIngredients(): boolean {
    return this.getCachedIngredients() !== null
  }

  // Check if profile is cached and valid
  hasProfile(): boolean {
    return this.getCachedProfile() !== null
  }

  // Force delete specific cache item
  delete(key: string): void {
    if (key === 'app_ingredients') {
      this.removeFromStorage(this.INGREDIENTS_KEY)
      console.log('🗑️ Ingredients cache invalidated')
    } else if (key === 'app_profile') {
      this.removeFromStorage(this.PROFILE_KEY)
      console.log('🗑️ Profile cache invalidated')
    } else if (key === 'app_recipes') {
      this.invalidateRecipes()
      console.log('🗑️ Recipes cache invalidated')
    }
  }

  // Smart cache invalidation - only clear if older than 30 seconds
  smartInvalidateIngredients(): void {
    const cachedItem = this.getFromStorage<any[]>(this.INGREDIENTS_KEY)
    if (cachedItem) {
      const item = localStorage.getItem(this.INGREDIENTS_KEY)
      if (item) {
        const parsed = JSON.parse(item)
        const age = Date.now() - parsed.timestamp
        // Only invalidate if cache is older than 30 seconds
        if (age > 30 * 1000) {
          this.delete('app_ingredients')
        } else {
          console.log('⏰ Cache is fresh, skipping invalidation')
        }
      }
    }
  }
}

// Preload app data after login
export const preloadAppData = async (): Promise<void> => {
  try {
    console.log('🚀 Starting app data preload...')

    const { getIngredients } = await import('./ingredients')
    const { getUserProfile } = await import('./profile')
    const { preloadTodayMeals } = await import('./daily-meals')
    const { getSufficientRecipes, getInsufficientRecipes } = await import('./food')

    // Load data in parallel
    const [ingredients, profile, todayMeals, _sufficientRecipes, _insufficientRecipes] = await Promise.allSettled([
      getIngredients(),
      getUserProfile(),
      preloadTodayMeals(),
      getSufficientRecipes({}),
      getInsufficientRecipes({ num_missing: 1, num_recipes: 100 })
    ])

    // Cache successful results
    if (ingredients.status === 'fulfilled') {
      appDataCache.saveIngredients(ingredients.value)
    } else {
      console.warn('Failed to preload ingredients:', ingredients.reason)
    }

    if (profile.status === 'fulfilled') {
      appDataCache.saveProfile(profile.value)
    } else {
      console.warn('Failed to preload profile:', profile.reason)
    }

    if (todayMeals.status === 'fulfilled') {
      console.log('✅ Today\'s meals preloaded successfully')
    } else {
      console.warn('Failed to preload today\'s meals:', todayMeals.reason)
    }

    console.log('✅ App data preload completed')
  } catch (error) {
    console.error('❌ App data preload failed:', error)
  }
}

// Clear cache on logout
export const clearAppCache = (): void => {
  appDataCache.clearAppData()
  chatCache.clearChatData()
}

// Create global cache instances
export const chatCache = new ChatCache()
export const chatSessionManager = new ChatSessionManager()
export const appDataCache = new AppDataCache()

// Auto cleanup every 5 minutes (only for in-memory caches)
if (typeof window !== 'undefined') {
  setInterval(() => {
    chatCache.cleanup()
    // appDataCache uses localStorage, no cleanup needed
  }, CACHE_CLEANUP_INTERVAL)
}

export default Cache 