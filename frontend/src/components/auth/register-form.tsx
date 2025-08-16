"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, User, UtensilsCrossed, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authAPI, authStorage } from "@/lib/auth"
import type { RegisterData, RegisterRequest } from "@/lib/auth"

interface RegisterFormProps {
    onSuccess?: () => void
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        full_name: "",
        password: "",
        confirmPassword: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp")
            setIsLoading(false)
            return
        }

        // Validate password strength
        if (formData.password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự")
            setIsLoading(false)
            return
        }

        // Validate required fields
        if (!formData.username.trim() || !formData.email.trim() || !formData.full_name.trim()) {
            setError("Vui lòng điền đầy đủ thông tin")
            setIsLoading(false)
            return
        }

        // Validate username length
        if (formData.username.length < 3) {
            setError("Tên đăng nhập phải có ít nhất 3 ký tự")
            setIsLoading(false)
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setError("Email không hợp lệ")
            setIsLoading(false)
            return
        }

        // Validate full name length
        if (formData.full_name.length < 2) {
            setError("Họ và tên phải có ít nhất 2 ký tự")
            setIsLoading(false)
            return
        }

        try {
            const registerData: RegisterRequest = {
                username: formData.username,
                email: formData.email,
                full_name: formData.full_name,
                password: formData.password
            }
            const response = await authAPI.register(registerData)
            // Redirect to login page immediately after successful registration
            router.push("/login")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đăng ký thất bại")
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 p-4">
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
                <div className="absolute top-16 left-24 text-6xl opacity-5">🥬</div>
                <div className="absolute top-32 right-28 text-5xl opacity-5">🥒</div>
                <div className="absolute bottom-28 left-20 text-7xl opacity-5">🌽</div>
                <div className="absolute bottom-16 right-24 text-6xl opacity-5">🥦</div>
                <div className="absolute top-52 left-1/2 text-5xl opacity-5">🍋</div>
                <div className="absolute top-72 right-16 text-4xl opacity-5">🥝</div>
            </div>

            <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 relative z-10">
                <div className="text-center mb-8">
                    {/* App Logo */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <UtensilsCrossed size={36} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Tham gia cùng chúng tôi!</h1>
                    <p className="text-gray-600">
                        Tạo tài khoản <span className="font-semibold text-green-600">FoodXPro</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Bắt đầu hành trình quản lý thực phẩm thông minh</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-gray-700 font-medium">
                            Họ và tên
                        </Label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                id="full_name"
                                name="full_name"
                                type="text"
                                placeholder="Nhập họ và tên đầy đủ"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="pl-12 h-12 border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
                                required
                            />
                        </div>
                    </div>

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
                                placeholder="Tên đăng nhập (không dấu cách)"
                                value={formData.username}
                                onChange={handleChange}
                                className="pl-12 h-12 border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium">
                            Email
                        </Label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                value={formData.email}
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

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                            Xác nhận mật khẩu
                        </Label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="pl-12 pr-12 h-12 border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-500 via-green-500 to-emerald-500 hover:from-blue-600 hover:via-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Đang tạo tài khoản...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} />
                                Tạo tài khoản miễn phí
                            </div>
                        )}
                    </Button>
                </form>

                {/* Benefits */}
                <div className="mt-6 p-4 bg-green-50 rounded-xl">
                    <h4 className="font-semibold text-green-800 mb-2 text-sm">Tại sao chọn FoodXPro?</h4>
                    <ul className="text-xs text-green-700 space-y-1">
                        <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            Quản lý thực phẩm thông minh
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            Theo dõi dinh dưỡng chi tiết
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            AI gợi ý món ăn phù hợp
                        </li>
                    </ul>
                </div>

                <div className="mt-6 text-center">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-gray-400 text-sm">hoặc</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <p className="text-gray-600">
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    )
}
