"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, Bot, User, Square, Plus, Trash2, MessageCircle, Menu, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import Header from "@/components/ui/header"
import FoodCard from "@/components/food-card"
import IngredientCard from "@/components/ingredient-card"
import { chatSessionManager } from "@/lib/cache"
import type { Message, ChatSession } from "@/lib/types"
import { TYPING_SPEED, TYPING_DELAY } from "@/lib/constants"
import { sendChatMessage } from "@/lib/chat"
import { Card } from "@/components/ui/card"

// Tool data interface for API responses
interface ToolRaws {
  tool: string
  raws?: any
  raw_data?: any
}

// Utility function to parse markdown-like formatting
const parseMarkdown = (text: string) => {
  // Bold: **text** -> <strong>text</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

  // Italic: *text* -> <em>text</em>
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>")

  // Underline: __text__ -> <u>text</u>
  text = text.replace(/__(.*?)__/g, "<u>$1</u>")

  return text
}

// const taskPrompts: any[] = [] // Removed legacy prompts

export default function ChatScreen() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [currentTypingMessageId, setCurrentTypingMessageId] = useState<string | null>(null)
  const [typingText, setTypingText] = useState("")
  const [typingInterval, setTypingInterval] = useState<NodeJS.Timeout | null>(null)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [isNewChatButtonPressed, setIsNewChatButtonPressed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)

  // Load chat sessions on mount - only from local cache
  useEffect(() => {
    const sessions = chatSessionManager.getAllSessions()
    setChatSessions(sessions)

    const currentId = chatSessionManager.getCurrentSessionId()
    if (currentId && sessions.find((s: ChatSession) => s.id === currentId)) {
      setCurrentSessionId(currentId)
      const currentSession = chatSessionManager.getSession(currentId)
      if (currentSession) {
        setMessages(currentSession.messages)
      }
    } else if (sessions.length > 0) {
      // Load first session if no current session
      setCurrentSessionId(sessions[0].id)
      setMessages(sessions[0].messages)
      chatSessionManager.setCurrentSession(sessions[0].id)
    }
  }, [])

  // Save messages when they change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      chatSessionManager.updateSession(currentSessionId, messages)
      // Refresh sessions to update titles
      setChatSessions(chatSessionManager.getAllSessions())
    }
  }, [messages, currentSessionId])

  // Helper to render tool-specific data returned from API
  const renderToolData = (tools?: ToolRaws[]) => {
    if (!tools || tools.length === 0) return null

    console.log("🔍 renderToolData called with:", tools)

    // Handle the actual API response structure
    // The API returns: { data: { tools: ["get_daily_meals"], raws: [{...}] } }
    // But we're receiving the tools array directly
    return tools.map((toolObj, idx) => {
      // For the actual API response structure, we need to handle it differently
      const toolName = (toolObj as any).tool || toolObj
      const raws = (toolObj as any).raws || (toolObj as any).raw_data || toolObj
      
      console.log(`🔧 Processing tool: ${toolName}`, { toolObj, raws })
      
      switch (toolName) {
          case "get_ingredients":
            if (Array.isArray(raws)) {
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {raws.map((ing: any) => (
                    <IngredientCard
                      key={ing.id}
                      id={typeof ing.id === 'string' ? parseInt(ing.id) : ing.id}
                      name={ing.name}
                      image={ing.image}
                      add_date={ing.add_date}
                      expire_date={ing.expire_date ?? ing.exprire_date}
                    />
                  ))}
                </div>
              )
            }
            return null

          case "get_daily_meals":
            // Handle the actual structure from API
            const periods = ["breakfast", "lunch", "dinner", "snack"]
            const mealsData = Array.isArray(raws) ? raws[0] : raws
            
            console.log("🍽️ get_daily_meals data:", { raws, mealsData })
            
            return (
              <div key={idx} className="space-y-4">
                {periods.map((p) => {
                  const meals = mealsData[p]
                  if (!meals || meals.length === 0) return null
                  return (
                    <div key={p}>
                      <h4 className="font-semibold capitalize mb-2">{p}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {meals.map((meal: any) => (
                          <Card key={meal.id} className="p-4 bg-white hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={meal.image || meal.image_url}
                                  alt={meal.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-sm">{meal.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    <span className="text-xs text-gray-600 font-medium">{meal.calories || 0} kcal</span>
                                  </div>
                                  {meal.servings_eaten !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                      <span className="text-xs text-gray-600 font-medium">{meal.servings_eaten}x</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )

          case "get_sufficient_recipes":
          case "get_insufficient_recipes":
            // Handle the actual structure from API
            const list = Array.isArray(raws) ? raws : [raws]
            console.log("🍳 Recipe list data:", { toolName, list, raws })
            console.log("🍳 First item structure:", list[0])
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {list.map((item: any) => {
                  const recipe = item.recipe || item
                  const nutritions = item.nutritions || []
                  const ingredients = item.ingredients || []
                  const missingIngredients = item.missing_ingredients || []
                  const isAvailable = toolName !== "get_insufficient_recipes"
                  
                  console.log("🍳 Processing recipe:", { 
                    recipe, 
                    recipeImage: recipe?.image_url,
                    nutritions, 
                    ingredients, 
                    missingIngredients, 
                    isAvailable 
                  })
                  
                  return (
                    <FoodCard
                      key={recipe.id}
                      recipe={recipe}
                      nutritions={nutritions}
                      ingredients={ingredients}
                      isAvailable={isAvailable}
                      missingIngredients={missingIngredients}
                    />
                  )
                })}
              </div>
            )

          case "recipe_retrieve_tool":
            // Handle recipe retrieval tool which returns text result
            const result = raws.result || raws
            console.log("📖 Recipe retrieve result:", { result })
            
            // Return null to hide the result display
            return null

          case "get_daily_nutrition_gaps":
            // Handle daily nutrition gaps tool
            const nutritionData = raws
            console.log("📊 Nutrition gaps data:", { nutritionData })
            
            const lackItems = nutritionData.lack || []
            const excessItems = nutritionData.excess || []
            
            return (
              <div key={idx} className="space-y-4">
                {/* Lacking Nutrients */}
                {lackItems.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <h4 className="font-semibold text-orange-900">Dinh dưỡng thiếu hụt</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lackItems.map((item: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-sm text-orange-600 font-medium">
                              {item.percent_achieved.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(item.percent_achieved, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Đã ăn: {item.consumed_value} {item.unit}</span>
                            <span>Cần thêm: {item.remaining_value.toFixed(1)} {item.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Excess Nutrients */}
                {excessItems.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <h4 className="font-semibold text-red-900">Dinh dưỡng vượt quá</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {excessItems.map((item: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-red-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-sm text-red-600 font-medium">
                              {item.percent_achieved.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(item.percent_achieved, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Đã ăn: {item.consumed_value} {item.unit}</span>
                            <span>Vượt quá: {item.excess_value} {item.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-sm text-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span className="font-medium">Tóm tắt</span>
                    </div>
                    <p>
                      Bạn có <span className="font-medium text-orange-600">{lackItems.length}</span> dinh dưỡng thiếu hụt 
                      {excessItems.length > 0 && (
                        <> và <span className="font-medium text-red-600">{excessItems.length}</span> dinh dưỡng vượt quá</>
                      )}
                      . Hãy bổ sung thêm thực phẩm giàu dinh dưỡng để đạt mục tiêu hàng ngày.
                    </p>
                  </div>
                </div>
              </div>
            )

        case "suggest_meals_diverse":
          const suggestionsData = raws
          console.log("🍽️ Meal suggestions data:", { suggestionsData })
          
          // Group suggestions by meal period
          const mealGroups: { [key: string]: any[] } = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
          }
          
          if (suggestionsData.suggestions) {
            suggestionsData.suggestions.forEach((suggestion: any) => {
              const meal = suggestion.meal.toLowerCase()
              if (meal.includes('breakfast')) {
                mealGroups.breakfast.push(suggestion)
              } else if (meal.includes('lunch')) {
                mealGroups.lunch.push(suggestion)
              } else if (meal.includes('dinner')) {
                mealGroups.dinner.push(suggestion)
              } else if (meal.includes('snack')) {
                mealGroups.snack.push(suggestion)
              }
            })
          }
          
          const mealPeriods = [
            { id: 'breakfast', label: 'Bữa sáng', icon: '🌅' },
            { id: 'lunch', label: 'Bữa trưa', icon: '☀️' },
            { id: 'dinner', label: 'Bữa tối', icon: '🌙' },
            { id: 'snack', label: 'Bữa phụ', icon: '🍎' }
          ]
          
          return (
            <div key={idx} className="space-y-6">
              {mealPeriods.map((period) => {
                const suggestions = mealGroups[period.id]
                if (!suggestions || suggestions.length === 0) return null
                
                return (
                  <div key={period.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{period.icon}</span>
                      <h4 className="font-semibold text-gray-900">{period.label}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {suggestions.map((suggestion: any) => {
                        const recipe = suggestion.recipe
                        const nutritions = suggestion.nutritions || []
                        const missingIngredients = suggestion.missing_ingredients || []
                        const missingCount = suggestion.missing_count || 0
                        const isAvailable = missingCount === 0
                        
                        return (
                          <FoodCard
                            key={recipe.id}
                            recipe={recipe}
                            nutritions={nutritions}
                            ingredients={[]}
                            isAvailable={isAvailable}
                            missingIngredients={missingIngredients}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )

          default:
            return (
              <pre key={idx} className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(raws, null, 2)}
              </pre>
            )
      }
    })
  }

  const typeMessage = (messageId: string, text: string, callback?: () => void) => {
    // Clear any existing typing interval
    if (typingInterval) {
      clearInterval(typingInterval)
    }

    setCurrentTypingMessageId(messageId)
    setTypingText("")
    let currentIndex = 0

    const interval = setInterval(() => {
      if (currentIndex >= text.length) {
        clearInterval(interval)
        setCurrentTypingMessageId(null)
        setTypingText("")
        setTypingInterval(null)

        // Update message to not typing
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isTyping: false } : msg)))

        if (callback) callback()
        return
      }

      setTypingText(text.slice(0, currentIndex + 1))
      currentIndex++
    }, TYPING_SPEED)

    setTypingInterval(interval)
  }

  const stopTyping = () => {
    if (typingInterval) {
      clearInterval(typingInterval)
      setTypingInterval(null)
    }

    if (currentTypingMessageId) {
      // Complete the current message
      setMessages((prev) => prev.map((msg) => (msg.id === currentTypingMessageId ? { ...msg, isTyping: false } : msg)))
      setCurrentTypingMessageId(null)
      setTypingText("")
    }
  }

  const addBotMessage = (
    text: string,
    toolData?: ToolRaws[],
    delay = TYPING_DELAY,
  ) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const messageId = `bot-${Date.now()}-${Math.random()}`
        const botResponse: Message = {
          id: messageId,
          text,
          isBot: true,
          timestamp: new Date(),
          isTyping: true,
          toolData,
        }

        setMessages((prev) => [...prev, botResponse])

        typeMessage(messageId, text, () => {
          resolve()
        })
      }, delay)
    })
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentSessionId || isLoading) return

    const userMessage = inputText.trim()
    setInputText("")
    setIsLoading(true)

    const newMessage: Message = {
      id: `user-${Date.now()}`,
      text: userMessage,
      isBot: false,
      timestamp: new Date(),
      isTyping: false,
    }

    setMessages((prev) => [...prev, newMessage])

    // Show typing indicator
    setShowTypingIndicator(true)

    try {
      // Send message to API and get structured response
      const chatResponse = await sendChatMessage({
        session_id: currentSessionId,
        message: userMessage,
      })

      console.log("📡 Chat API response:", chatResponse)

      // Hide typing indicator
      setShowTypingIndicator(false)

      // Add bot response with typing effect and tool data if available
      // Extract tool data from the API response structure
      let toolData: ToolRaws[] | undefined
      
      console.log("🔍 Full chat response structure:", chatResponse)
      console.log("🔍 chatResponse.data:", chatResponse.data)
      console.log("🔍 chatResponse.data?.tools:", chatResponse.data?.tools)
      console.log("🔍 chatResponse.data?.raws:", chatResponse.data?.raws)
      
      if (chatResponse.data?.tools && chatResponse.data?.raws) {
        // API returns: { data: { tools: ["get_daily_meals"], raws: [{...}] } }
        const toolNames = Array.isArray(chatResponse.data.tools) ? chatResponse.data.tools : []
        console.log("🔧 Tool names:", toolNames)
        console.log("🔧 Raw data:", chatResponse.data.raws)
        
        if (typeof toolNames[0] === 'string') {
          toolData = (toolNames as string[]).map((toolName: string, idx: number) => ({
            tool: toolName,
            raws: chatResponse.data!.raws![idx] || chatResponse.data!.raws!
          }))
          console.log("🔧 Created toolData:", toolData)
        } else {
          toolData = toolNames as ToolRaws[]
        }
      } else if ((chatResponse as any).tools) {
        // Fallback for old structure
        toolData = (chatResponse as any).tools
        console.log("🔧 Using fallback toolData:", toolData)
      }
      
      console.log("🔧 Final toolData for rendering:", toolData)
      
      await addBotMessage(chatResponse.response, toolData)
    } catch (error) {
      console.error("Chat API error:", error)
      // Hide typing indicator
      setShowTypingIndicator(false)
      // Fallback response if API fails
      await addBotMessage("Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskClick = async (_task?: any) => {
    // Legacy function stub
  }

  const handleNewChat = () => {
    setIsNewChatButtonPressed(true)
    setTimeout(() => {
      // Use only local cache for session management
      const newSession = chatSessionManager.createNewSession()
      setChatSessions(chatSessionManager.getAllSessions())
      setCurrentSessionId(newSession.id)
      setMessages(newSession.messages)
      setIsNewChatButtonPressed(false)
    }, 150)
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // Use only local cache
    chatSessionManager.setCurrentSession(sessionId)
    const session = chatSessionManager.getSession(sessionId)
    if (session) {
      setMessages(session.messages)
    }
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    // Use only local cache
    chatSessionManager.deleteSession(sessionId)
    const updatedSessions = chatSessionManager.getAllSessions()
    setChatSessions(updatedSessions)

    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        handleSelectSession(updatedSessions[0].id)
      } else {
        handleNewChat()
      }
    }
  }

  const handleShowHistory = () => {
    setShowChatHistory(!showChatHistory)
  }

  return (
    <div className="h-full bg-white flex">
      {/* Overlay for clicking outside to close sidebar */}
      {showChatHistory && (
        <div
          className="fixed inset-0 bg-opacity-25 z-15 cursor-pointer"
          onClick={() => setShowChatHistory(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header
          icon={MessageCircle}
          title="AI Chat Assistant"
          subtitle="Trò chuyện với AI để được hỗ trợ về ẩm thực và sức khỏe"
          secondaryButton={{
            label: "Lịch sử",
            icon: Menu,
            onClick: handleShowHistory,
          }}
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
        />

        {/* Chatbot Capabilities Description - Only show when no messages */}
        {messages.length <= 1 && (
          <div className="px-6 py-4 border-b border-gray-100">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Title */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">🤖 Tôi có thể giúp bạn</h2>
              <p className="text-gray-600">Khám phá những gì AI có thể làm cho bạn</p>
            </div>

            {/* Capabilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 text-center bg-white">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">🍳</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Gợi ý món ăn</h3>
                <p className="text-xs text-gray-600">Dựa trên nguyên liệu có sẵn trong tủ lạnh của bạn</p>
              </div>

              <div className="p-3 text-center bg-white">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Phân tích dinh dưỡng</h3>
                <p className="text-xs text-gray-600">Kiểm tra khoảng trống dinh dưỡng hàng ngày</p>
              </div>

              <div className="p-3 text-center bg-white">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">📋</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Quản lý thực phẩm</h3>
                <p className="text-xs text-gray-600">Xem danh sách nguyên liệu và bữa ăn</p>
              </div>

              <div className="p-3 text-center bg-white">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">👨‍🍳</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Hướng dẫn nấu ăn</h3>
                <p className="text-xs text-gray-600">Công thức chi tiết và tư vấn sức khỏe</p>
              </div>

              <div className="p-3 text-center bg-white">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">🍽️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Thực đơn đa dạng</h3>
                <p className="text-xs text-gray-600">Đề xuất bữa ăn cân bằng và phong phú</p>
              </div>

              <div className="p-3 text-center bg-white">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">✅</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Kiểm tra công thức</h3>
                <p className="text-xs text-gray-600">Xem món nào có thể làm với nguyên liệu hiện có</p>
              </div>
            </div>
          </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Legacy task prompts removed */}

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  <div className={`flex gap-3 ${message.isBot ? "justify-start" : "justify-end"}`}>
                    {message.isBot && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] p-4 rounded-lg ${message.isBot ? "bg-gray-100 text-gray-800" : "bg-blue-500 text-white"
                        }`}
                    >
                      <div
                        className="text-sm leading-relaxed whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html:
                            message.isTyping && currentTypingMessageId === message.id
                              ? parseMarkdown(typingText + "|")
                              : parseMarkdown(message.text),
                        }}
                      />
                      <p className={`text-xs mt-2 ${message.isBot ? "text-gray-500" : "text-blue-100"}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.isTyping && currentTypingMessageId === message.id && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={stopTyping}
                            className="h-6 px-2 text-xs bg-transparent"
                          >
                            <Square size={12} className="mr-1" />
                            Dừng
                          </Button>
                        </div>
                      )}
                    </div>
                    {!message.isBot && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-green-600" />
                      </div>
                    )}
                  </div>

                  {/* Food Suggestions - Show below each message that has them */}
                  {!message.isTyping && (
                    <div className="mt-4 ml-11">
                      {renderToolData(message.toolData)}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {showTypingIndicator && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-blue-600" />
                  </div>
                  <div className="max-w-[70%] p-4 rounded-lg bg-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 border-t flex-shrink-0">
          <div className="flex gap-3">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn của bạn..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 py-2"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} className="px-4 py-2" disabled={isLoading}>
              <Send size={14} className="mr-2" />
              {isLoading ? "Đang gửi..." : "Gửi"}
            </Button>
          </div>
        </div>
      </div>

      {/* Chat History Sidebar - Slide from right */}
      <div className={`fixed top-0 right-0 h-full bg-white/95 backdrop-blur-sm border-l border-gray-200/50 shadow-2xl transition-transform duration-300 ease-in-out z-30 ${showChatHistory ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '360px' }}>
        <div className="px-6 py-5.5 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 flex-shrink-0">
          <Button
            onClick={handleNewChat}
            className={`w-full justify-start gap-3 py-3 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg transition-all duration-150 ${isNewChatButtonPressed
              ? 'scale-95 shadow-xl shadow-blue-500/25'
              : 'scale-100 shadow-lg'
              }`}
          >
            <Plus size={18} />
            Chat mới
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-2 py-6">
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                      }`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <MessageCircle size={16} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-gray-500">{session.updatedAt.toLocaleDateString()}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
