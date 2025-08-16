"use client"

import { useRouter } from "next/navigation"
import RegisterForm from "@/components/auth/register-form"

export default function RegisterPage() {
  const router = useRouter()

  const handleRegisterSuccess = () => {
    // After successful registration, redirect to login page
    router.push("/login")
  }

  return <RegisterForm onSuccess={handleRegisterSuccess} />
}
