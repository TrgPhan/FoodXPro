// Chat related types
export interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
  isTyping: boolean
  foodSuggestions?: FoodSuggestion[]
  toolData?: any
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  toolData: any
}

export interface FoodItem {
  id: string
  name: string
  image: string
  ingredients: string[]
  // Storage specific fields
  manufacturingDate?: Date
}

export interface FoodSuggestion {
  id: string
  name: string
  image: string
  ingredients: string[]
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
}

export interface TaskPrompt {
  id: string
  title: string
  description: string
  icon: string
  color: string
}

// Cache related types
export interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // time to live in milliseconds
}

// Profile related types
export interface CalorieData {
  current: number
  goal: number
}

export interface Macro {
  name: string
  current: number
  goal: number
  color: string
  unit: string
}

export interface Nutrient {
  name: string
  current: number
  goal: number
  unit: string
}

export interface WeightData {
  day: string
  weight: number
  date: string
}

// Food screen types
export interface FoodItemWithDetails {
  id: string
  name: string
  image: string
  missingIngredients: string[]
  cookingTime: string
  difficulty: string
}

// Navigation types
export interface NavigationItem {
  id: string
  label: string
  icon: any
  color: string
}

// Calendar related types
export interface MealPlan {
  breakfast: string
  lunch: string
  dinner: string
}

export interface CalendarDay {
  day: number
  date: string
  hasMealPlan: boolean
  mealPlan?: MealPlan
  isToday: boolean
  isCurrentMonth: boolean
}

// Search and filter types
export interface SearchFilters {
  query: string
  category?: string
  difficulty?: string
  cookingTime?: string
}

// User preferences types
export interface UserPreferences {
  dietaryRestrictions: string[]
  allergies: string[]
  preferredCuisine: string[]
  calorieGoal: number
  weightGoal: 'gain' | 'lose' | 'maintain'
}

// Error and loading states
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// API response types
export interface ApiResponse {
  status: 'success' | 'failed'
  message: string
}

export interface ApiDataResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

// User profile types
export interface UserProfile {
  full_name: string
  age: number
  sex: string
  weight: number
  height: number
  goal: string
  activity_level: string
  allergies: Allergy[]
  health_conditions: HealthCondition[]
  nutritions_goal: NutritionGoal[]
}

export interface NutritionGoal {
  name: string
  value: number
  unit: string
}

export interface Allergy {
  id: number
  name: string
}

export interface HealthCondition {
  id: number
  name: string
}

export interface UserProfileForm {
  full_name: string
  age: number
  sex: string
  weight: number
  height: number
  goal: string
  activity_level: string
  allergy: string[]
  health_condition: string[]
} 