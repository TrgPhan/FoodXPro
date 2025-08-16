"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Package, CalendarIcon as CalendarIconLucide, Save, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { searchIngredients } from "@/lib/ingredients"

export interface IngredientData {
  id: string
  name: string
  add_date: string
  expire_date: string
}

interface IngredientFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (ingredient: IngredientData) => void
  editData?: IngredientData
}

export default function IngredientForm({ isOpen, onClose, onSave, editData }: IngredientFormProps) {
  const [name, setName] = useState(editData?.name || "")
  const [expireDate, setExpireDate] = useState<Date | undefined>(
    editData?.expire_date ? new Date(editData.expire_date) : undefined,
  )
  const [searchResults, setSearchResults] = useState<Array<{id: number, name: string}>>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchCache, setSearchCache] = useState<Map<string, Array<{id: number, name: string}>>>(new Map())

  // Optimized search function with cache
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (searchTerm: string) => {
        clearTimeout(timeoutId)
        
        // Show loading immediately for better UX
        if (searchTerm.trim().length >= 1) {
          setIsSearching(true)
          setShowSearchResults(true)
        } else {
          setSearchResults([])
          setShowSearchResults(false)
          setIsSearching(false)
          return
        }

        timeoutId = setTimeout(async () => {
          const trimmedTerm = searchTerm.trim().toLowerCase()
          
          // Check cache first
          if (searchCache.has(trimmedTerm)) {
            setSearchResults(searchCache.get(trimmedTerm) || [])
            setIsSearching(false)
            return
          }

          try {
            const results = await searchIngredients(trimmedTerm, 5)
            
            // Cache the results
            setSearchCache(prev => new Map(prev).set(trimmedTerm, results))
            setSearchResults(results)
          } catch (error) {
            console.error('Error searching ingredients:', error)
            setSearchResults([])
          } finally {
            setIsSearching(false)
          }
        }, 200) // Reduced to 200ms for faster response
      }
    })(),
    [searchCache]
  )

  useEffect(() => {
    if (editData) {
      setName(editData.name)
      setExpireDate(editData.expire_date ? new Date(editData.expire_date) : undefined)
    } else {
      setName("")
      setExpireDate(undefined)
    }
    // Reset search results when form opens/closes
    setSearchResults([])
    setShowSearchResults(false)
  }, [editData, isOpen])

  // Handle name change with search
  const handleNameChange = (value: string) => {
    setName(value)
    if (!editData) { // Only search for new ingredients
      // Immediate feedback for better UX
      if (value.trim().length >= 1) {
        setShowSearchResults(true)
      } else {
        setShowSearchResults(false)
        setSearchResults([])
      }
      debouncedSearch(value)
    }
  }

  // Handle selecting a search result
  const handleSelectSearchResult = (selectedIngredient: {id: number, name: string}) => {
    setName(selectedIngredient.name)
    setSearchResults([])
    setShowSearchResults(false)
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    // For new ingredients, require name and expire date
    // For edit, only require expire date (name is fixed)
    if (!name.trim()) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!")
      return
    }
    
    if (!editData && !expireDate) {
      alert("Vui lòng chọn ngày hết hạn!")
      return
    }

    // Helper function to format date without timezone issues
    const formatDateToYYYYMMDD = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const ingredientData: IngredientData = {
      id: editData?.id || `ingredient-${Date.now()}`,
      name: name.trim(),
      add_date: editData?.add_date || formatDateToYYYYMMDD(new Date()),
      expire_date: expireDate ? formatDateToYYYYMMDD(expireDate) : "",
    }

    onSave(ingredientData)
    handleClose()
  }

  const handleClose = () => {
    // Reset form
    setName("")
    setExpireDate(undefined)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {editData ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                {editData ? "Cập nhật thông tin nguyên liệu" : "Nhập thông tin nguyên liệu của bạn"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <div className="py-6 space-y-6">
          {/* Name Field */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package size={16} className="text-green-600" />
              Tên nguyên liệu
            </Label>
            <div className="relative search-container">
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={editData ? "Tên nguyên liệu (không thể thay đổi)" : "Ví dụ: Cà chua, Thịt bò, Bánh mì..."}
                disabled={!!editData}
                className={`h-12 text-base border-2 focus:border-green-400 focus:ring-green-400 rounded-xl ${editData ? 'bg-gray-50 text-gray-600' : ''}`}
              />
              {!editData && (
                <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              )}
              
                             {/* Search Results Dropdown */}
               {!editData && showSearchResults && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                   {isSearching ? (
                     <div className="p-3 text-center text-gray-500">
                       <div className="flex items-center justify-center gap-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                         <span className="text-sm">Đang tìm kiếm...</span>
                       </div>
                     </div>
                   ) : searchResults.length > 0 ? (
                     <>
                       <div className="p-2 text-xs text-gray-400 border-b border-gray-100">
                         Kết quả tìm kiếm ({searchResults.length})
                       </div>
                       {searchResults.map((result) => (
                         <div
                           key={result.id}
                           onClick={() => handleSelectSearchResult(result)}
                           className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                         >
                           <div className="font-medium text-gray-900">{result.name}</div>
                         </div>
                       ))}
                     </>
                   ) : name.trim().length >= 1 ? (
                     <div className="p-3 text-center text-gray-500">
                       <div className="text-sm">Không tìm thấy nguyên liệu</div>
                       <div className="text-xs text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</div>
                     </div>
                   ) : null}
                 </div>
               )}
            </div>
          </div>



          {/* Expire Date */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CalendarIconLucide size={16} className="text-blue-600" />
              Ngày hết hạn
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal border-2 hover:border-green-400 rounded-xl",
                    !expireDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  {expireDate ? format(expireDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày hết hạn</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0 shadow-xl" align="start">
                <Calendar
                  mode="single"
                  selected={expireDate}
                  onSelect={setExpireDate}
                  initialFocus
                  locale={vi}
                  className="rounded-xl border border-gray-200"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preview Card */}
          {(name || expireDate) && (
            <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Xem trước
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tên:</span>
                  <span className="font-medium text-gray-900">{name || "Chưa nhập"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hết hạn:</span>
                  <span className="font-medium text-gray-900">
                    {expireDate ? format(expireDate, "dd/MM/yyyy", { locale: vi }) : "Chưa chọn"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 h-12 border-2 border-gray-200 hover:bg-gray-50 rounded-xl bg-transparent"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-12 bg-gradient-to-r from-green-500 via-orange-500 to-yellow-500 hover:from-green-600 hover:via-orange-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg"
          >
            <Save size={16} className="mr-2" />
            {editData ? "Cập nhật" : "Thêm mới"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 