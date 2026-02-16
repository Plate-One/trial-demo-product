"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Store } from "lucide-react"

export interface Store {
  id: string
  name: string
}

const STORES: Store[] = [
  { id: "bayquarter", name: "キリンシティプラス横浜ベイクォーター店" },
  { id: "mores", name: "キリンシティ 横浜モアーズ店" },
  { id: "fti", name: "キリンシティ FOOD＆TIME ISETAN YOKOHAMA店" },
  { id: "cial", name: "キリンシティ CIAL桜木町店" },
  { id: "machida", name: "キリンシティ 町田店" },
]

interface StoreSelectorProps {
  selectedStores: string[]
  onStoresChange: (storeIds: string[]) => void
}

export function StoreSelector({ selectedStores, onStoresChange }: StoreSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleToggleStore = (storeId: string) => {
    if (selectedStores.includes(storeId)) {
      onStoresChange(selectedStores.filter((id) => id !== storeId))
    } else {
      onStoresChange([...selectedStores, storeId])
    }
  }

  const handleSelectAll = () => {
    if (selectedStores.length === STORES.length) {
      onStoresChange([])
    } else {
      onStoresChange(STORES.map((s) => s.id))
    }
  }

  const selectedStoreNames = STORES.filter((s) => selectedStores.includes(s.id)).map((s) => s.name)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full min-w-0 sm:w-[280px] md:w-[320px] max-w-full justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Store className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedStores.length === 0
                ? "店舗を選択"
                : selectedStores.length === 1
                  ? selectedStoreNames[0]
                  : `${selectedStores.length}店舗を選択中`}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[320px] p-2" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 py-1.5 border-b">
            <span className="text-sm font-medium">店舗を選択</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSelectAll}
            >
              {selectedStores.length === STORES.length ? "すべて解除" : "すべて選択"}
            </Button>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {STORES.map((store) => (
              <label
                key={store.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer"
              >
                <Checkbox
                  checked={selectedStores.includes(store.id)}
                  onCheckedChange={() => handleToggleStore(store.id)}
                />
                <span className="text-sm flex-1">{store.name}</span>
              </label>
            ))}
          </div>
          {selectedStores.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-1 px-2">
                {selectedStoreNames.map((name, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { STORES }
