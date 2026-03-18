"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Info } from "lucide-react"

const HAS_DEMO = !!process.env.NEXT_PUBLIC_DEMO_EMAIL

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません")
      setLoading(false)
      return
    }

    window.location.href = "/"
  }

  const handleDemoLogin = async () => {
    setError("")
    setLoading(true)
    setEmail("demo@plateone.jp")
    setPassword("••••••••")

    try {
      // デモセットアップ＋サーバー側ログイン → セッション返却
      const setupRes = await fetch("/api/auth/demo-login", { method: "POST" })
      const data = await setupRes.json().catch(() => ({}))

      if (!setupRes.ok) {
        setError(data.error || "デモセットアップに失敗しました")
        setLoading(false)
        return
      }

      // サーバーから返されたセッションをクライアントにセット
      if (data.session) {
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        if (error) {
          setError("セッションの設定に失敗しました")
          setLoading(false)
          return
        }
      }

      // フルリロードでmiddlewareにCookieを確実に反映
      window.location.href = "/"
    } catch {
      setError("通信エラーが発生しました")
      setLoading(false)
    }
  }

  const hasDemoAccount = HAS_DEMO

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">シフト管理システム</h1>
          <p className="text-sm text-muted-foreground">AI需要予測 × シフト最適化</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

        {hasDemoAccount && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 dark:bg-gray-950 px-2 text-muted-foreground">または</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              デモアカウントで体験する
            </Button>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          アカウントをお持ちでない方は
          <a href="/signup" className="text-blue-600 hover:underline ml-1">新規登録</a>
        </p>

        {hasDemoAccount && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-medium">トライアルをご利用の方へ</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  「デモアカウントで体験する」ボタンからデモデータ付きの環境をお試しいただけます。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
