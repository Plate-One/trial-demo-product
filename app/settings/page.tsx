"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Store, Bell, Clock, Shield, Save, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/toast"
import { OnboardingHint } from "@/components/onboarding-hints"

export default function SettingsPage() {
  const { showToast } = useToast()
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [storeName, setStoreName] = useState("キリンシティプラス横浜ベイクォーター店")
  const [storeCode, setStoreCode] = useState("KC-YBQ-001")
  const [phone, setPhone] = useState("045-XXX-XXXX")
  const [seats, setSeats] = useState("48")

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!storeName.trim()) newErrors.storeName = "店舗名を入力してください"
    if (!storeCode.trim()) newErrors.storeCode = "店舗コードを入力してください"
    if (!phone.trim()) newErrors.phone = "電話番号を入力してください"
    if (!seats || Number(seats) < 1 || Number(seats) > 999) newErrors.seats = "1〜999の数値を入力してください"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) {
      showToast("入力内容にエラーがあります。確認してください。", "error")
      return
    }
    setSaved(true)
    showToast("設定を保存しました", "success")
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">設定</h1>
              <p className="text-sm text-gray-600 mt-1">システム設定とカスタマイズ</p>
            </div>
            <Button onClick={handleSave} size="sm" className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
              {saved ? (
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
                <Label htmlFor="storeCode">店舗コード <span className="text-red-500">*</span></Label>
                <Input
                  id="storeCode"
                  value={storeCode}
                  onChange={(e) => { setStoreCode(e.target.value); setErrors((p) => ({ ...p, storeCode: "" })) }}
                  className={errors.storeCode ? "border-red-500 focus-visible:ring-red-500" : ""}
                  aria-invalid={!!errors.storeCode}
                  aria-describedby={errors.storeCode ? "storeCode-error" : undefined}
                />
                {errors.storeCode && <p id="storeCode-error" className="text-xs text-red-500">{errors.storeCode}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号 <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })) }}
                  className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
                {errors.phone && <p id="phone-error" className="text-xs text-red-500">{errors.phone}</p>}
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
            <CardDescription>営業時間とラストオーダー時間を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weekdayOpen">平日営業時間</Label>
                <div className="flex items-center gap-2">
                  <Input id="weekdayOpen" type="time" defaultValue="11:00" className="w-28" />
                  <span className="text-gray-500">〜</span>
                  <Input type="time" defaultValue="23:00" className="w-28" aria-label="平日閉店時間" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="holidayOpen">休日営業時間</Label>
                <div className="flex items-center gap-2">
                  <Input id="holidayOpen" type="time" defaultValue="11:00" className="w-28" />
                  <span className="text-gray-500">〜</span>
                  <Input type="time" defaultValue="22:00" className="w-28" aria-label="休日閉店時間" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastOrderFood">ラストオーダー（フード）</Label>
                <Input id="lastOrderFood" defaultValue="閉店30分前" className="w-48" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastOrderDrink">ラストオーダー（ドリンク）</Label>
                <Input id="lastOrderDrink" defaultValue="閉店15分前" className="w-48" />
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
