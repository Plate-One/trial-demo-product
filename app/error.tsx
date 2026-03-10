"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">エラーが発生しました</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            予期しないエラーが発生しました。<br />
            再試行するか、トップページに戻ってください。
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 mt-2 font-mono">エラーコード: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={reset} size="lg">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            再試行する
          </Button>
          <Button asChild variant="outline">
            <Link href="/demand-forecast">
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              トップページへ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
