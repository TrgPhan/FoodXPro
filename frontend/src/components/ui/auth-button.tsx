"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, User, LogOut, Shield } from "lucide-react"
import { isAuthenticated, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function AuthButton() {
  const [authenticated, setAuthenticated] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setAuthenticated(isAuthenticated())
    
    // Listen for auth changes
    const handleAuthChange = () => {
      setAuthenticated(isAuthenticated())
    }
    
    window.addEventListener('storage', handleAuthChange)
    window.addEventListener('auth-change', handleAuthChange)
    
    return () => {
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [])

  const handleLogin = () => {
    router.push('/login')
  }

  const handleLogout = () => {
    logout()
    setAuthenticated(false)
    setShowDropdown(false)
    // Refresh the page or redirect to home
    window.location.reload()
  }

  const handleChangePassword = () => {
    setShowDropdown(false)
    router.push('/change-password')
  }

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown)
  }

  if (!authenticated) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 bg-white/80 hover:bg-white border-gray-200"
        onClick={handleLogin}
      >
        <LogIn size={16} />
        Đăng nhập
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 p-0"
        onClick={handleProfileClick}
      >
        <User size={18} className="text-gray-600" />
      </Button>
      
      {showDropdown && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={handleChangePassword}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
          >
            <Shield size={16}/>
            <span className="text-sm">Đổi mật khẩu</span>
          </button>
          <div className="h-px bg-gray-200 my-1"></div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      )}
      
      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
