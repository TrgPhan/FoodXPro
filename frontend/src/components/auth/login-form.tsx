"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, User, Lock, UtensilsCrossed, Leaf, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authAPI, authStorage } from "@/lib/auth"
import type { LoginRequest } from "@/lib/auth"

interface LoginFormProps {
    onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
    const [formData, setFormData] = useState<LoginRequest>({
        username: "",
        password: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Validate required fields
        if (!formData.username.trim() || !formData.password.trim()) {
            setError("Vui lòng điền đầy đủ thông tin")
            setIsLoading(false)
            return
        }

        try {
            const response = await authAPI.login(formData)
            authStorage.setAuth(response)
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đăng nhập thất bại")
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 p-4">
            {/* Back to Home Button */}
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-6 left-6 gap-2 text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white/90 backdrop-blur-sm"
                onClick={() => router.push("/")}
            >
                <ArrowLeft size={16} />
                Quay về trang chủ
            </Button>

            {/* Background Food Icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 text-6xl opacity-5">🥗</div>
                <div className="absolute top-40 right-32 text-5xl opacity-5">🍎</div>
                <div className="absolute bottom-32 left-16 text-7xl opacity-5">🥕</div>
                <div className="absolute bottom-20 right-20 text-6xl opacity-5">🥑</div>
                <div className="absolute top-60 left-1/2 text-5xl opacity-5">🍅</div>
            </div>

            <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 relative z-10">
                <div className="text-center mb-8">
                    {/* App Logo */}
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <UtensilsCrossed size={36} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại!</h1>
                    <p className="text-gray-600">
                        Đăng nhập vào <span className="font-semibold text-green-600">FoodXPro</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Quản lý thực phẩm thông minh của bạn</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700 font-medium">
                            Tên đăng nhập
                        </Label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                value={formData.username}
                                onChange={handleChange}
                                className="pl-12 h-12 border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700 font-medium">
                            Mật khẩu
                        </Label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className="pl-12 pr-12 h-12 border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 hover:from-green-600 hover:via-orange-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Đang đăng nhập...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Leaf size={18} />
                                Bắt đầu quản lý thực phẩm
                            </div>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-gray-400 text-sm">hoặc</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <p className="text-gray-600">
                        Chưa có tài khoản?{" "}
                        <Link href="/register" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                            Đăng ký miễn phí
                        </Link>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Tham gia cộng đồng quản lý thực phẩm thông minh! 🌱</p>
                </div>
            </Card>
        </div>
    )
}
