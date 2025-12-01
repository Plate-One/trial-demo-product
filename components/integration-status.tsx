"use client"

import { Check, X, AlertTriangle } from "lucide-react"

const integrations = [
  { name: "POSシステム", status: "connected" },
  { name: "在庫管理システム", status: "connected" },
  { name: "従業員管理システム", status: "warning" },
  { name: "会計ソフト", status: "error" },
]

export default function IntegrationStatus() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Check className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "error":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {integrations.map((integration, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm">{integration.name}</span>
          {getStatusIcon(integration.status)}
        </div>
      ))}
    </div>
  )
}
