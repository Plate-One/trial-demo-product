"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Columns3 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Column {
  key: string
  label: string
  defaultVisible?: boolean
}

interface ColumnToggleProps {
  columns: Column[]
  visibleColumns: string[]
  onToggle: (key: string) => void
}

export function ColumnToggle({ columns, visibleColumns, onToggle }: ColumnToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="表示する列を選択">
          <Columns3 className="h-4 w-4 mr-1" aria-hidden="true" />
          表示列
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">表示する列を選択</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-1 space-y-1">
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => onToggle(col.key)}
                className="rounded border-gray-300"
              />
              <span>{col.label}</span>
            </label>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function useColumnVisibility(columns: Column[]) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter((c) => c.defaultVisible !== false).map((c) => c.key)
  )

  const toggle = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const isVisible = (key: string) => visibleColumns.includes(key)

  return { visibleColumns, toggle, isVisible }
}
