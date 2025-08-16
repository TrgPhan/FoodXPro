import { MealPlan, UserPreferences, Macro } from "./types"

// Cache constants
export const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
export const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Chat constants
export const TYPING_SPEED = 10 // milliseconds per character
export const TYPING_DELAY = 1000 // delay before bot responds

// Food suggestions
export const FOOD_SUGGESTIONS = {
  gain: [
    {
      id: "gain1",
      name: "Cơm chiên trứng",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Gạo", "Trứng", "Hành lá", "Dầu ăn", "Nước mắm"],
      calories: 450,
      protein: 18,
      carbs: 65,
      fat: 15,
      fiber: 3,
    },
    {
      id: "gain2",
      name: "Thịt bò xào hành tây",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Thịt bò", "Hành tây", "Tỏi", "Dầu ăn", "Gia vị"],
      calories: 380,
      protein: 35,
      carbs: 12,
      fat: 22,
      fiber: 2,
    },
    {
      id: "gain3",
      name: "Bánh mì sandwich",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Bánh mì", "Thịt", "Rau cải", "Sốt", "Gia vị"],
      calories: 420,
      protein: 25,
      carbs: 55,
      fat: 18,
      fiber: 4,
    },
  ],
  lose: [
    {
      id: "lose1",
      name: "Salad cà chua",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Cà chua", "Dưa leo", "Hành tây", "Dầu oliu", "Gia vị"],
      calories: 120,
      protein: 4,
      carbs: 15,
      fat: 8,
      fiber: 6,
    },
    {
      id: "lose2",
      name: "Cá hồi nướng",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Cá hồi", "Chanh", "Gia vị", "Dầu oliu", "Rau thơm"],
      calories: 280,
      protein: 42,
      carbs: 2,
      fat: 12,
      fiber: 1,
    },
    {
      id: "lose3",
      name: "Gà nướng",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Ức gà", "Gia vị", "Chanh", "Tỏi", "Dầu oliu"],
      calories: 220,
      protein: 38,
      carbs: 3,
      fat: 8,
      fiber: 2,
    },
  ],
  maintain: [
    {
      id: "maintain1",
      name: "Gạo lứt với rau",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Gạo lứt", "Rau cải", "Dầu ăn", "Gia vị", "Nước mắm"],
      calories: 320,
      protein: 12,
      carbs: 58,
      fat: 6,
      fiber: 8,
    },
    {
      id: "maintain2",
      name: "Thịt bò nạc",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Thịt bò nạc", "Gia vị", "Dầu ăn", "Tỏi", "Hành"],
      calories: 290,
      protein: 32,
      carbs: 8,
      fat: 16,
      fiber: 3,
    },
    {
      id: "maintain3",
      name: "Trứng luộc",
      image: "/placeholder.svg?height=200&width=300&bg=gray&text=gray",
      ingredients: ["Trứng gà", "Muối", "Nước", "Gia vị"],
      calories: 155,
      protein: 13,
      carbs: 1,
      fat: 11,
      fiber: 0,
    },
  ],
}

// Task prompts
export const TASK_PROMPTS = [
  {
    id: "1",
    title: "GỢI Ý MÓN TỪ NGUYÊN LIỆU",
    description: "Gợi ý cho tôi các món ăn từ nguyên liệu có sẵn trong tủ lạnh",
    icon: "🍳",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    id: "2",
    title: "HỎI CÁCH NẤU ĂN",
    description: "Hướng dẫn chi tiết cách nấu các món ăn cụ thể",
    icon: "👨‍🍳",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    id: "3",
    title: "TƯ VẤN SỨC KHỎE",
    description: "Tư vấn dinh dưỡng và lời khuyên về sức khỏe",
    icon: "💪",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
]

// Mock data for food screen
export const AVAILABLE_FOODS = [
  {
    id: "1",
    name: "Cơm chiên trứng",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "15 phút",
    difficulty: "Dễ",
    calories: 450,
    protein: 18,
    carbs: 65,
    fat: 15,
    fiber: 3,
  },
  {
    id: "2",
    name: "Salad cà chua",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "10 phút",
    difficulty: "Rất dễ",
    calories: 120,
    protein: 4,
    carbs: 15,
    fat: 8,
    fiber: 6,
  },
  {
    id: "3",
    name: "Thịt bò xào hành tây",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "20 phút",
    difficulty: "Trung bình",
    calories: 380,
    protein: 35,
    carbs: 12,
    fat: 22,
    fiber: 2,
  },
  {
    id: "7",
    name: "Bún bò Huế",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "45 phút",
    difficulty: "Khó",
    calories: 650,
    protein: 45,
    carbs: 75,
    fat: 25,
    fiber: 8,
  },
  {
    id: "8",
    name: "Phở gà",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "40 phút",
    difficulty: "Trung bình",
    calories: 480,
    protein: 38,
    carbs: 68,
    fat: 12,
    fiber: 6,
  },
  {
    id: "9",
    name: "Bánh xèo",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "30 phút",
    difficulty: "Trung bình",
    calories: 420,
    protein: 22,
    carbs: 58,
    fat: 18,
    fiber: 4,
  },
  {
    id: "10",
    name: "Gỏi cuốn",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "20 phút",
    difficulty: "Dễ",
    calories: 180,
    protein: 15,
    carbs: 25,
    fat: 6,
    fiber: 5,
  },
  {
    id: "11",
    name: "Cơm tấm",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "25 phút",
    difficulty: "Dễ",
    calories: 520,
    protein: 32,
    carbs: 72,
    fat: 18,
    fiber: 3,
  },
  {
    id: "12",
    name: "Bún chả",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: [],
    cookingTime: "35 phút",
    difficulty: "Trung bình",
    calories: 480,
    protein: 28,
    carbs: 65,
    fat: 16,
    fiber: 4,
  },
]

export const UNAVAILABLE_FOODS = [
  {
    id: "4",
    name: "Sushi cá hồi",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: ["Nori", "Wasabi", "Gừng ngâm"],
    cookingTime: "30 phút",
    difficulty: "Khó",
    calories: 320,
    protein: 28,
    carbs: 45,
    fat: 8,
    fiber: 2,
  },
  {
    id: "5",
    name: "Pasta carbonara",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: ["Pasta", "Bacon", "Parmesan"],
    cookingTime: "25 phút",
    difficulty: "Trung bình",
    calories: 580,
    protein: 22,
    carbs: 65,
    fat: 28,
    fiber: 4,
  },
  {
    id: "6",
    name: "Bánh mì sandwich",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: ["Bánh mì", "Pate", "Rau cải"],
    cookingTime: "10 phút",
    difficulty: "Dễ",
    calories: 420,
    protein: 25,
    carbs: 55,
    fat: 18,
    fiber: 4,
  },
  {
    id: "13",
    name: "Chả cá Lã Vọng",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: ["Cá lăng", "Nghệ", "Thì là"],
    cookingTime: "50 phút",
    difficulty: "Khó",
    calories: 380,
    protein: 42,
    carbs: 45,
    fat: 12,
    fiber: 6,
  },
  {
    id: "14",
    name: "Bánh mì thịt nướng",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: ["Bánh mì", "Thịt nướng", "Pate"],
    cookingTime: "15 phút",
    difficulty: "Dễ",
    calories: 350,
    protein: 25,
    carbs: 48,
    fat: 14,
    fiber: 2,
  },
  {
    id: "15",
    name: "Lẩu thái",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: ["Nước cốt dừa", "Sả", "Lá chanh"],
    cookingTime: "60 phút",
    difficulty: "Khó",
    calories: 580,
    protein: 35,
    carbs: 28,
    fat: 32,
    fiber: 8,
  },
  {
    id: "16",
    name: "Mì quảng",
    image: "/placeholder.svg?height=120&width=200&bg=gray&text=gray",
    missingIngredients: ["Mì quảng", "Tôm khô", "Đậu phộng"],
    cookingTime: "40 phút",
    difficulty: "Trung bình",
    calories: 520,
    protein: 38,
    carbs: 68,
    fat: 18,
    fiber: 6,
  },
]



// Profile screen data
export const CALORIE_DATA = {
  current: 2400,
  goal: 2600,
}

export const MACROS = [
  { name: "Protein", current: 120, goal: 150, color: "bg-red-500", unit: "g" },
  { name: "Carbs", current: 280, goal: 320, color: "bg-blue-500", unit: "g" },
  { name: "Fat", current: 85, goal: 100, color: "bg-yellow-500", unit: "g" },
]

// Daily macros data for calendar screen
export const DAILY_MACROS: Record<string, Macro[]> = {
  "T2": [
    { name: "Protein", current: 120, goal: 150, color: "bg-red-500", unit: "g" },
    { name: "Carbs", current: 280, goal: 320, color: "bg-blue-500", unit: "g" },
    { name: "Fat", current: 85, goal: 100, color: "bg-yellow-500", unit: "g" },
  ],
  "T3": [
    { name: "Protein", current: 135, goal: 150, color: "bg-red-500", unit: "g" },
    { name: "Carbs", current: 300, goal: 320, color: "bg-blue-500", unit: "g" },
    { name: "Fat", current: 92, goal: 100, color: "bg-yellow-500", unit: "g" },
  ],
  "T4": [
    { name: "Protein", current: 110, goal: 150, color: "bg-red-500", unit: "g" },
    { name: "Carbs", current: 260, goal: 320, color: "bg-blue-500", unit: "g" },
    { name: "Fat", current: 78, goal: 100, color: "bg-yellow-500", unit: "g" },
  ],
  "T5": [
    { name: "Protein", current: 145, goal: 150, color: "bg-red-500", unit: "g" },
    { name: "Carbs", current: 310, goal: 320, color: "bg-blue-500", unit: "g" },
    { name: "Fat", current: 95, goal: 100, color: "bg-yellow-500", unit: "g" },
  ],
  "T6": [
    { name: "Protein", current: 125, goal: 150, color: "bg-red-500", unit: "g" },
    { name: "Carbs", current: 290, goal: 320, color: "bg-blue-500", unit: "g" },
    { name: "Fat", current: 88, goal: 100, color: "bg-yellow-500", unit: "g" },
  ],
  "T7": [
    { name: "Protein", current: 130, goal: 150, color: "bg-red-500", unit: "g" },
    { name: "Carbs", current: 295, goal: 320, color: "bg-blue-500", unit: "g" },
    { name: "Fat", current: 90, goal: 100, color: "bg-yellow-500", unit: "g" },
  ],
  "CN": [
    { name: "Protein", current: 115, goal: 150, color: "bg-red-500", unit: "g" },
    { name: "Carbs", current: 275, goal: 320, color: "bg-blue-500", unit: "g" },
    { name: "Fat", current: 82, goal: 100, color: "bg-yellow-500", unit: "g" },
  ],
}

export const NUTRIENTS = [
  { name: "Cholesterol", current: 180, goal: 200, unit: "mg" },
  { name: "Calcium", current: 800, goal: 1000, unit: "mg" },
  { name: "Vitamin C", current: 75, goal: 90, unit: "mg" },
  { name: "Iron", current: 12, goal: 18, unit: "mg" },
  { name: "Sodium", current: 1800, goal: 2300, unit: "mg" },
  { name: "Fiber", current: 22, goal: 25, unit: "g" },
]

export const WEIGHT_DATA = [
  { day: "T2", weight: 70, date: "15/01" },
  { day: "T3", weight: 69.8, date: "16/01" },
  { day: "T4", weight: 69.5, date: "17/01" },
  { day: "T5", weight: 69.7, date: "18/01" },
  { day: "T6", weight: 69.3, date: "19/01" },
  { day: "T7", weight: 69.1, date: "20/01" },
  { day: "CN", weight: 68.9, date: "21/01" },
]

// Navigation items
export const NAVIGATION_ITEMS = [
  { id: "storage", label: "STORAGE", color: "text-green-600" },
  { id: "food", label: "FOOD", color: "text-orange-600" },
  { id: "chat", label: "CHAT", color: "text-blue-600" },
  { id: "calendar", label: "CALENDAR", color: "text-red-600" },
  { id: "profile", label: "PROFILE", color: "text-purple-600" },
]

// Month and day names
export const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
]

export const DAY_NAMES = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

// Meal plans
export const MEAL_PLANS: Record<number, MealPlan> = {
  15: { breakfast: "Phở bò", lunch: "Cơm gà", dinner: "Salad rau củ" },
  20: { breakfast: "Bánh mì", lunch: "Bún chả", dinner: "Cơm chiên dương châu" },
  25: { breakfast: "Cháo tôm", lunch: "Mì quảng", dinner: "Lẩu thái" },
  28: { breakfast: "Xôi gà", lunch: "Cơm tấm", dinner: "Gỏi cuốn" },
}

// Default user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  dietaryRestrictions: [],
  allergies: [],
  preferredCuisine: [],
  calorieGoal: 2000,
  weightGoal: 'maintain',
}

// Search filter options
export const DIFFICULTY_OPTIONS = ['Rất dễ', 'Dễ', 'Trung bình', 'Khó']
export const COOKING_TIME_OPTIONS = ['5 phút', '10 phút', '15 phút', '20 phút', '25 phút', '30 phút']
export const CUISINE_CATEGORIES = ['Việt Nam', 'Châu Á', 'Châu Âu', 'Mỹ', 'Trung Đông', 'Châu Phi'] 

// Calendar screen constants
export const WEEK_DAYS = [
  { id: "mon", label: "T2", date: "15/01", isToday: false },
  { id: "tue", label: "T3", date: "16/01", isToday: false },
  { id: "wed", label: "T4", date: "17/01", isToday: true },
  { id: "thu", label: "T5", date: "18/01", isToday: false },
  { id: "fri", label: "T6", date: "19/01", isToday: false },
  { id: "sat", label: "T7", date: "20/01", isToday: false },
  { id: "sun", label: "CN", date: "21/01", isToday: false },
]

export const MEAL_PERIODS = [
  { id: "breakfast", label: "Sáng", icon: "🌅", color: "orange", time: "6:00 - 10:00" },
  { id: "lunch", label: "Trưa", icon: "☀️", color: "green", time: "11:00 - 14:00" },
  { id: "snack", label: "Chiều", icon: "🌤️", color: "blue", time: "15:00 - 17:00" },
  { id: "dinner", label: "Tối", icon: "🌙", color: "purple", time: "18:00 - 22:00" },
]

export const MOCK_MEAL_DATA = {
  wed: {
    morning: [
      {
        id: "1",
        name: "Phở bò",
        image: "/placeholder.svg?height=120&width=200",
        cookingTime: "30 phút",
        difficulty: "Trung bình",
        isAvailable: true,
        calories: 450,
        protein: 25,
        carbs: 65,
        fat: 12,
      },
    ],
    lunch: [
      {
        id: "2",
        name: "Cơm gà nướng",
        image: "/placeholder.svg?height=120&width=200",
        cookingTime: "25 phút",
        difficulty: "Dễ",
        isAvailable: true,
        calories: 520,
        protein: 35,
        carbs: 70,
        fat: 15,
      },
    ],
    afternoon: [],
    night: [
      {
        id: "3",
        name: "Salad quinoa",
        image: "/placeholder.svg?height=120&width=200",
        cookingTime: "15 phút",
        difficulty: "Dễ",
        isAvailable: false,
        missingIngredients: ["Quinoa", "Dầu oliu"],
        calories: 280,
        protein: 12,
        carbs: 35,
        fat: 8,
      },
    ],
    macros: { calories: 1250, protein: 72, carbs: 170, fat: 35 },
  },
}

// Color classes for meal periods
export const MEAL_PERIOD_COLORS = {
  orange: "border-orange-200 bg-orange-50/50",
  green: "border-green-200 bg-green-50/50",
  blue: "border-blue-200 bg-blue-50/50",
  purple: "border-purple-200 bg-purple-50/50",
} 