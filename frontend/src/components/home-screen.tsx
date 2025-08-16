"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    UtensilsCrossed,
    Package,
    MessageCircle,
    Calendar,
    TrendingUp,
    Sparkles,
    Shield,
    Users,
    ArrowRight,
    CheckCircle,
    Star,
    Play,
    Heart,
    Brain,
    User,
} from "lucide-react"
import { useRouter } from "next/navigation"

const features = [
    {
        icon: Package,
        title: "Quản Lý Kho Nguyên Liệu",
        description: "Theo dõi nguyên liệu trong tủ lạnh, hạn sử dụng và tự động nhắc nhở khi sắp hết hạn",
        color: "from-green-500 to-emerald-600",
        bgColor: "bg-green-50",
    },
    {
        icon: UtensilsCrossed,
        title: "Thực Đơn Thông Minh",
        description: "Gợi ý món ăn dựa trên nguyên liệu có sẵn và mục tiêu sức khỏe",
        color: "from-orange-500 to-red-600",
        bgColor: "bg-orange-50",
    },
    {
        icon: MessageCircle,
        title: "Chatbot Tư Vấn Dinh Dưỡng",
        description: "Trò chuyện với AI để được tư vấn dinh dưỡng, hướng dẫn nấu ăn và giải đáp thắc mắc",
        color: "from-purple-500 to-pink-600",
        bgColor: "bg-purple-50",
    },
    {
        icon: Calendar,
        title: "Lịch Sử Dinh Dưỡng Người Dùng",
        description: "Lập kế hoạch bữa ăn hàng ngày và theo dõi lịch sử dinh dưỡng của người dùng",
        color: "from-blue-500 to-cyan-600",
        bgColor: "bg-blue-50",
    },
    {
        icon: User,
        title: "Hồ Sơ Sức Khỏe Người Dùng",
        description: "Quản lý thông tin cá nhân, dị ứng, tình trạng sức khỏe và mục tiêu dinh dưỡng",
        color: "from-indigo-500 to-purple-600",
        bgColor: "bg-indigo-50",
    },
]

const stats = [
    { number: "15K+", label: "Công thức nấu ăn", icon: UtensilsCrossed },
    { number: "98%", label: "Hài lòng", icon: Star },
    { number: "24/7", label: "Hỗ trợ AI", icon: Brain },
]

const testimonials = [
    {
        name: "Nguyễn Minh Anh",
        role: "Chuyên gia dinh dưỡng",
        content: "FoodXPro đã giúp tôi quản lý chế độ ăn hiệu quả hơn 80%. AI assistant rất thông minh và gợi ý món ăn phù hợp!",
        avatar: "👩‍⚕️",
        rating: 5,
    },
    {
        name: "Trần Văn Nam",
        role: "Đầu bếp chuyên nghiệp",
        content: "Tính năng gợi ý món ăn dựa trên nguyên liệu có sẵn thật tuyệt vời. Tiết kiệm thời gian và giảm lãng phí thực phẩm.",
        avatar: "👨‍🍳",
        rating: 5,
    },
    {
        name: "Lê Thị Hoa",
        role: "Mẹ của 2 con",
        content: "Ứng dụng giúp tôi lên thực đơn cân bằng cho cả gia đình. Con em ăn ngon hơn và sức khỏe cải thiện rõ rệt!",
        avatar: "👩‍👧‍👦",
        rating: 5,
    },
]

export default function HomeScreen() {
    const router = useRouter()
    const [activeFeature, setActiveFeature] = useState(0)

    const handleGetStarted = () => {
        router.push("/register")
    }

    const handleLogin = () => {
        router.push("/login")
    }

    return (
        <div className="h-full bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 flex flex-col">
            <ScrollArea className="h-full">
                <div className="min-h-screen">
                    {/* Hero Section */}
                    <section className="relative px-8 py-16 text-center overflow-hidden">
                        {/* Background Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-20 left-20 text-6xl opacity-10">🥗</div>
                            <div className="absolute top-40 right-32 text-5xl opacity-10">🍎</div>
                            <div className="absolute bottom-32 left-16 text-7xl opacity-10">🥕</div>
                            <div className="absolute bottom-20 right-20 text-6xl opacity-10">🥑</div>
                            <div className="absolute top-60 left-1/2 text-5xl opacity-10">🍅</div>
                        </div>

                        <div className="relative z-10 max-w-4xl mx-auto">
                            {/* Logo */}
                            <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                                <UtensilsCrossed size={48} className="text-white" />
                            </div>

                            <Badge className="mb-6 bg-green-100 text-green-800 border-green-200 px-4 py-2">
                                <Sparkles size={16} className="mr-2" />
                                Ứng dụng quản lý dinh dưỡng thông minh cho người Việt Nam
                            </Badge>

                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Quản Lý Dinh Dưỡng
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-orange-600 to-yellow-600">
                                    Thông Minh
                                </span>
                            </h1>

                            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                                Tối ưu hóa việc quản lý nguyên liệu, gợi ý món ăn từ AI và theo dõi dinh dưỡng. Biến việc nấu nướng
                                thành trải nghiệm thú vị và khoa học cho sức khỏe gia đình.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                                <Button
                                    onClick={handleGetStarted}
                                    className="px-8 py-4 text-lg bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 hover:from-green-600 hover:via-orange-600 hover:to-yellow-600 shadow-xl transform hover:scale-105 transition-all duration-200"
                                >
                                    <Sparkles size={20} className="mr-2" />
                                    Bắt Đầu Miễn Phí
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleLogin}
                                    className="px-8 py-4 text-lg bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
                                >
                                    <Play size={20} className="mr-2" />
                                    Đăng Nhập
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                                {stats.map((stat, index) => {
                                    const Icon = stat.icon
                                    return (
                                        <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                                            <div className="text-center">
                                                <Icon size={24} className="mx-auto mb-2 text-green-600" />
                                                <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                                                <div className="text-sm text-gray-600">{stat.label}</div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="px-8 py-16 bg-white/50 backdrop-blur-sm">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-16">
                                <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
                                    <TrendingUp size={16} className="mr-2" />
                                    Tính năng nổi bật
                                </Badge>
                                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                    Tại Sao Chọn <span className="text-green-600">FoodXPro</span>?
                                </h2>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                    Khám phá những tính năng độc đáo giúp bạn quản lý dinh dưỡng một cách thông minh và hiệu quả
                                </p>
                            </div>

                            <div className="grid grid-cols-5 gap-8">
                                {features.map((feature, index) => {
                                    const Icon = feature.icon
                                    return (
                                        <Card
                                            key={index}
                                            className={`p-7 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 ${activeFeature === index ? "ring-2 ring-green-400 shadow-xl" : ""
                                                }`}
                                            onMouseEnter={() => setActiveFeature(index)}
                                        >
                                            <div
                                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                                            >
                                                <Icon size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Testimonials */}
                    <section className="px-8 py-16 bg-gradient-to-r from-green-500 to-emerald-600">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <Badge className="mb-4 bg-white/20 text-white border-white/30">
                                    <Star size={16} className="mr-2" />
                                    Khách hàng nói gì
                                </Badge>
                                <h2 className="text-4xl font-bold text-white mb-4">Được Tin Tưởng Bởi Hàng Nghìn Người</h2>
                                <p className="text-xl text-green-100 max-w-2xl mx-auto">
                                    Khám phá những câu chuyện thành công từ cộng đồng FoodXPro
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                {testimonials.map((testimonial, index) => (
                                    <Card key={index} className="p-8 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                                        <div className="flex items-center mb-4">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} size={16} className="text-yellow-400 fill-current" />
                                            ))}
                                        </div>
                                        <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl">{testimonial.avatar}</div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                                <div className="text-sm text-gray-600">{testimonial.role}</div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="px-8 py-16 text-center bg-gradient-to-br from-orange-50 to-yellow-50">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Sẵn Sàng Bắt Đầu Hành Trình Dinh Dưỡng?</h2>
                            <p className="text-xl text-gray-600 mb-8">
                                Tham gia cùng hàng nghìn người đã tin tưởng FoodXPro để quản lý dinh dưỡng thông minh
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    onClick={handleGetStarted}
                                    className="px-8 py-4 text-lg bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 hover:from-green-600 hover:via-orange-600 hover:to-yellow-600 shadow-xl transform hover:scale-105 transition-all duration-200"
                                >
                                    Đăng Ký Miễn Phí
                                    <ArrowRight size={20} className="ml-2" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleLogin}
                                    className="px-8 py-4 text-lg bg-white/80 backdrop-blur-sm"
                                >
                                    Đã có tài khoản? Đăng nhập
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </ScrollArea>
        </div>
    )
}
