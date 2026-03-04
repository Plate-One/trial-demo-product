"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
        <div>
          <h1 className="text-xl font-semibold text-gray-800">エラーが発生しました</h1>
          <p className="text-sm text-gray-500 mt-2">予期しないエラーが発生しました。もう一度お試しください。</p>
        </div>
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4 mr-1" />
          再試行
        </Button>
      </div>
    </div>
  )
}
