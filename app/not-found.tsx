import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, BarChart2, CalendarDays, Users } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <div className="text-6xl font-bold text-gray-300">404</div>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">ページが見つかりません</h1>
          <p className="text-sm text-gray-500 mt-2">お探しのページは存在しないか、移動した可能性があります。</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="default">
            <Link href="/demand-forecast">
              <BarChart2 className="h-4 w-4 mr-1" />
              需要予測
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shifts">
              <CalendarDays className="h-4 w-4 mr-1" />
              シフト管理
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/staff">
              <Users className="h-4 w-4 mr-1" />
              スタッフ管理
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
