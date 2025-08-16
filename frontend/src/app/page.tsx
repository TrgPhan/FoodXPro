"use client"

import { useState, useEffect } from "react"
import { Package, UtensilsCrossed, MessageCircle, Calendar, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import AuthButton from "@/components/ui/auth-button"

// Components
import HomeScreen from "@/components/home-screen"
import StoreScreen from "@/components/store-screen"
import FoodScreen from "@/components/food-screen"
import ChatScreen from "@/components/chat-screen"
import CalendarScreen from "@/components/calendar-screen"
import ProfileScreen from "@/components/profile-screen"

const navigationItems = [
  { id: "home", label: "TRANG CHỦ", icon: Package, color: "text-gray-600", requireAuth: false },
  { id: "storage", label: "KHO NGUYÊN LIỆU", icon: Package, color: "text-green-600", requireAuth: true },
  { id: "food", label: "THỰC ĐƠN", icon: UtensilsCrossed, color: "text-orange-600", requireAuth: true },
  { id: "chat", label: "CHATBOT GỢI Ý", icon: MessageCircle, color: "text-blue-600", requireAuth: true },
  { id: "calendar", label: "LỊCH ĂN UỐNG", icon: Calendar, color: "text-red-600", requireAuth: true },
  { id: "profile", label: "HỒ SƠ SỨC KHỎE", icon: User, color: "text-purple-600", requireAuth: true },
]

export default function FoodApp() {
  const [activeTab, setActiveTab] = useState("home")
  const [authenticated, setAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const isAuth = isAuthenticated()
        setAuthenticated(isAuth)

        if (isAuth) {
          // Switch to storage tab when authenticated
          setActiveTab("storage")
        }
      } catch (error) {
        console.error("Failed to check auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleTabClick = (tabId: string, requireAuth: boolean) => {
    if (requireAuth && !authenticated) {
      // Show login prompt or redirect to login
      router.push("/login")
      return
    }
    setActiveTab(tabId)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen />
      case "storage":
        return authenticated ? <StoreScreen /> : <HomeScreen />
      case "food":
        return authenticated ? <FoodScreen /> : <HomeScreen />
      case "chat":
        return authenticated ? <ChatScreen /> : <HomeScreen />
      case "calendar":
        return authenticated ? <CalendarScreen /> : <HomeScreen />
      case "profile":
        return <ProfileScreen />
      default:
        return <HomeScreen />
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Đang khởi tạo FoodXPro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200 flex flex-col shadow-lg">
        <div className="py-4 px-7 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">FoodXPro</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems
              .filter(item => !authenticated || item.id !== "home") // Hide HOME tab when authenticated
              .map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleTabClick(item.id, item.requireAuth)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${isActive
                        ? "bg-gradient-to-r from-green-50 to-orange-50 text-gray-900 font-medium border border-green-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <Icon size={20} className={isActive ? item.color : ""} />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  </li>
                )
              })}
          </ul>
        </nav>

        <div className="p-3.5 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">© 2024 FoodXPro</div>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">{renderContent()}</div>
    </div>
  )
}
