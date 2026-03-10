import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart2, CalendarDays, Users, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="relative">
          <div className="text-8xl font-bold text-gray-200 select-none">404</div>
          <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-gray-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">ページが見つかりません</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            お探しのページは存在しないか、移動した可能性があります。<br />
            URLをご確認いただくか、以下のリンクからお進みください。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <Button asChild variant="default" size="lg">
            <Link href="/demand-forecast">
              <BarChart2 className="h-4 w-4 mr-2" aria-hidden="true" />
              需要予測トップへ
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shifts">
              <CalendarDays className="h-4 w-4 mr-2" aria-hidden="true" />
              シフト管理
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/staff">
              <Users className="h-4 w-4 mr-2" aria-hidden="true" />
              スタッフ管理
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
