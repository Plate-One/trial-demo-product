"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Store, Bell, Clock, Shield, Save, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/components/toast"
import { OnboardingHint } from "@/components/onboarding-hints"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const { showToast } = useToast()
  const { selectedStore } = useStoreContext()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [storeName, setStoreName] = useState("")
  const [storeSlug, setStoreSlug] = useState("")
  const [address, setAddress] = useState("")
  const [seats, setSeats] = useState("")
  const [openHour, setOpenHour] = useState("11:00")
  const [closeHour, setCloseHour] = useState("23:00")

  // 選択中の店舗データをロード
  useEffect(() => {
    if (!selectedStore) return
    setStoreName(selectedStore.name)
    setStoreSlug(selectedStore.slug)
    setAddress(selectedStore.address ?? "")
    setSeats(String(selectedStore.seat_count ?? ""))
    const startH = selectedStore.operating_hour_start ?? 11
    const endH = selectedStore.operating_hour_end ?? 23
    setOpenHour(`${String(startH).padStart(2, "0")}:00`)
    setCloseHour(`${String(endH).padStart(2, "0")}:00`)
  }, [selectedStore])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!storeName.trim()) newErrors.storeName = "店舗名を入力してください"
    if (!storeSlug.trim()) newErrors.storeSlug = "店舗コードを入力してください"
    if (!seats || Number(seats) < 1 || Number(seats) > 999) newErrors.seats = "1〜999の数値を入力してください"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate() || !selectedStore) {
      showToast("入力内容にエラーがあります。確認してください。", "error")
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("stores")
        .update({
          name: storeName,
          slug: storeSlug,
          address: address || null,
          seat_count: Number(seats),
          operating_hour_start: parseInt(openHour.split(":")[0], 10),
          operating_hour_end: parseInt(closeHour.split(":")[0], 10),
        } as never)
        .eq("id", selectedStore.id)

      if (error) throw error

      setSaved(true)
      showToast("設定を保存しました", "success")
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      showToast(`保存に失敗しました: ${e.message}`, "error")
    } finally {
      setSaving(false)
    }
  }

  if (!selectedStore) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
        店舗を選択してください
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">設定</h1>
              <p className="text-sm text-gray-600 mt-1">{selectedStore.name} の設定</p>
            </div>
            <Button onClick={handleSave} size="sm" disabled={saving} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />
                  保存中...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
                  保存しました
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" aria-hidden="true" />
                  設定を保存
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <OnboardingHint
          id="settings-intro"
          message="各項目を変更後、「設定を保存」ボタンを押すと反映されます。通知設定はリアルタイムで切り替わります。"
        />

        {/* 店舗情報 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" aria-hidden="true" />
              店舗情報
            </CardTitle>
            <CardDescription>基本的な店舗情報を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">店舗名 <span className="text-red-500">*</span></Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => { setStoreName(e.target.value); setErrors((p) => ({ ...p, storeName: "" })) }}
                  className={errors.storeName ? "border-red-500 focus-visible:ring-red-500" : ""}
                  aria-invalid={!!errors.storeName}
                  aria-describedby={errors.storeName ? "storeName-error" : undefined}
                />
                {errors.storeName && <p id="storeName-error" className="text-xs text-red-500">{errors.storeName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeSlug">店舗コード <span className="text-red-500">*</span></Label>
                <Input
                  id="storeSlug"
                  value={storeSlug}
                  onChange={(e) => { setStoreSlug(e.target.value); setErrors((p) => ({ ...p, storeSlug: "" })) }}
                  className={errors.storeSlug ? "border-red-500 focus-visible:ring-red-500" : ""}
                  aria-invalid={!!errors.storeSlug}
                  aria-describedby={errors.storeSlug ? "storeSlug-error" : undefined}
                />
                {errors.storeSlug && <p id="storeSlug-error" className="text-xs text-red-500">{errors.storeSlug}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">座席数 <span className="text-red-500">*</span></Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={999}
                  value={seats}
                  onChange={(e) => { setSeats(e.target.value); setErrors((p) => ({ ...p, seats: "" })) }}
                  className={errors.seats ? "border-red-500 focus-visible:ring-red-500" : ""}
                  aria-invalid={!!errors.seats}
                  aria-describedby={errors.seats ? "seats-error" : undefined}
                />
                {errors.seats && <p id="seats-error" className="text-xs text-red-500">{errors.seats}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 営業時間 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" aria-hidden="true" />
              営業時間
            </CardTitle>
            <CardDescription>営業時間を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openHour">営業開始</Label>
                <Input
                  id="openHour"
                  type="time"
                  value={openHour}
                  onChange={(e) => setOpenHour(e.target.value)}
                  className="w-28"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeHour">営業終了</Label>
                <Input
                  id="closeHour"
                  type="time"
                  value={closeHour}
                  onChange={(e) => setCloseHour(e.target.value)}
                  className="w-28"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" aria-hidden="true" />
              通知設定
            </CardTitle>
            <CardDescription>アラートと通知の設定を行います</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">シフト未提出アラート</p>
                <p className="text-xs text-gray-500">提出期限の2日前に通知</p>
              </div>
              <Switch defaultChecked aria-label="シフト未提出アラートの切り替え" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">需要予測アラート</p>
                <p className="text-xs text-gray-500">予測値と実績の乖離が20%以上の場合に通知</p>
              </div>
              <Switch defaultChecked aria-label="需要予測アラートの切り替え" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">人件費率アラート</p>
                <p className="text-xs text-gray-500">人件費率が目標値を超えた場合に通知</p>
              </div>
              <Switch defaultChecked aria-label="人件費率アラートの切り替え" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">ヘルプリクエスト通知</p>
                <p className="text-xs text-gray-500">他店舗からのヘルプ依頼を受信</p>
              </div>
              <Switch defaultChecked aria-label="ヘルプリクエスト通知の切り替え" />
            </div>
          </CardContent>
        </Card>

        {/* システム設定 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" aria-hidden="true" />
              システム設定
            </CardTitle>
            <CardDescription>AI予測とシステムの動作設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laborTarget">人件費率目標</Label>
                <Select defaultValue="25">
                  <SelectTrigger id="laborTarget" aria-label="人件費率目標を選択">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="23">23%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelSelect">予測モデル</Label>
                <Select defaultValue="advanced">
                  <SelectTrigger id="modelSelect" aria-label="予測モデルを選択">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">ベーシック（過去データのみ）</SelectItem>
                    <SelectItem value="advanced">アドバンスド（天候・イベント考慮）</SelectItem>
                    <SelectItem value="premium">プレミアム（AI最適化）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
