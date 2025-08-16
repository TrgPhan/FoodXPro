"use client"

import { useRouter } from "next/navigation"
import ChangePasswordForm from "@/components/auth/change-password-form"

export default function ChangePasswordPage() {
  const router = useRouter()

  const handleChangePasswordSuccess = () => {
    router.push("/")
  }

  return <ChangePasswordForm onSuccess={handleChangePasswordSuccess} />
}
