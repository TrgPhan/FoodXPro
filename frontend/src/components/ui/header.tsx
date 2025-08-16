import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface HeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  primaryButton?: {
    label: string
    icon: LucideIcon
    onClick: () => void
  }
  secondaryButton?: {
    label: string
    icon: LucideIcon
    onClick: () => void
  }
  gradientFrom?: string
  gradientTo?: string
}

export default function Header({
  icon: Icon,
  title,
  subtitle,
  primaryButton,
  secondaryButton,
  gradientFrom = "from-red-500",
  gradientTo = "to-rose-600",
}: HeaderProps) {
  return (
    <div className="px-6 py-3.5 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center`}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
            <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {secondaryButton && (
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={secondaryButton.onClick}>
              <secondaryButton.icon size={16} />
              {secondaryButton.label}
            </Button>
          )}
          {primaryButton && (
            <Button className={`gap-2 bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:from-red-600 hover:to-rose-700`} onClick={primaryButton.onClick}>
              <primaryButton.icon size={16} />
              {primaryButton.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
