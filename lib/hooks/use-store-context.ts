"use client"

import { createContext, useContext } from "react"
import type { Database } from "@/lib/supabase/types"

type Store = Database["public"]["Tables"]["stores"]["Row"]

interface StoreContextValue {
  stores: Store[]
  selectedStore: Store | null
  setSelectedStoreId: (id: string) => void
  loading: boolean
}

export const StoreContext = createContext<StoreContextValue>({
  stores: [],
  selectedStore: null,
  setSelectedStoreId: () => {},
  loading: true,
})

export function useStoreContext() {
  return useContext(StoreContext)
}
