"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, UtensilsCrossed, Leaf, ArrowLeft, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/auth"
import type { ChangePasswordRequest } from "@/lib/auth"

interface ChangePasswordFormProps {
    onSuccess?: () => void
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
    const [formData, setFormData] = useState<ChangePasswordRequest>({
        password: "",
    })
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        // Validate required fields
        if (!formData.password.trim() || !confirmPassword.trim()) {
            setError("Vui lòng điền đầy đủ thông tin")
            setIsLoading(false)
            return
        }

        // Validate password match
        if (formData.password !== confirmPassword) {
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

        try {
            const response = await authAPI.changePassword(formData)
            setSuccess("Đổi mật khẩu thành công!")
            setTimeout(() => {
                onSuccess?.()
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại")
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
                <div className="absolute top-20 left-20 text-6xl opacity-5">🔒</div>
                <div className="absolute top-40 right-32 text-5xl opacity-5">🛡️</div>
                <div className="absolute bottom-32 left-16 text-7xl opacity-5">🔐</div>
                <div className="absolute bottom-20 right-20 text-6xl opacity-5">⚡</div>
                <div className="absolute top-60 left-1/2 text-5xl opacity-5">🔑</div>
            </div>

            <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 relative z-10">
                <div className="text-center mb-8">
                    {/* App Logo */}
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Shield size={36} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Đổi mật khẩu</h1>
                    <p className="text-gray-600">
                        Cập nhật mật khẩu cho <span className="font-semibold text-green-600">FoodXPro</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Bảo mật tài khoản của bạn</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            {success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700 font-medium">
                            Mật khẩu mới
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
                        <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
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
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                        className="w-full h-12 bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 hover:from-green-600 hover:via-orange-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Đang cập nhật...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Shield size={18} />
                                Cập nhật mật khẩu
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
                        Quay lại{" "}
                        <button 
                            onClick={() => router.push("/")}
                            className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                        >
                            trang chủ
                        </button>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Bảo vệ tài khoản của bạn! 🔒</p>
                </div>
            </Card>
        </div>
    )
}
