"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface CalendarPopupProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  triggerClassName?: string
}

export function CalendarPopup({ 
  selectedDate, 
  onDateSelect, 
  triggerClassName 
}: CalendarPopupProps) {
  const [date, setDate] = React.useState<Date | undefined>(selectedDate)

  React.useEffect(() => {
    setDate(selectedDate)
  }, [selectedDate])

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      onDateSelect(newDate)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-12 h-12 p-0 justify-center bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90 transition-all duration-200",
            triggerClassName
          )}
        >
          <CalendarIcon className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={vi}
          className="rounded-md border"
          classNames={{
            day: "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
            today: "bg-blue-50 text-blue-900 rounded-md data-[selected=true]:rounded-lg border-2 border-blue-500 font-semibold",
            outside: "text-muted-foreground aria-selected:text-muted-foreground",
            disabled: "text-muted-foreground opacity-50",
            hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
