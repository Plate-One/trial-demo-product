"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Send, Download } from "lucide-react"

export default function QuickActions() {
  return (
    <div className="flex flex-col space-y-2">
      <Button variant="outline" className="justify-start">
        <RefreshCw className="mr-2 h-4 w-4" />
        予測を更新
      </Button>
      <Button variant="outline" className="justify-start">
        <Send className="mr-2 h-4 w-4" />
        レポートを送信
      </Button>
      <Button variant="outline" className="justify-start">
        <Download className="mr-2 h-4 w-4" />
        データをエクスポート
      </Button>
    </div>
  )
}
