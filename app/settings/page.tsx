"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, Bell, Clock, Shield, Save, CheckCircle2, Loader2, Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import { useToast } from "@/components/toast"
import { OnboardingHint } from "@/components/onboarding-hints"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { createClient } from "@/lib/supabase/client"
import { useImportActualSales } from "@/lib/hooks/use-actual-sales"

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

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null)
  const [csvFileName, setCsvFileName] = useState("")
  const [csvRawData, setCsvRawData] = useState("")
  const { importCsv, importing, result: importResult } = useImportActualSales()

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvRawData(text)
      // プレビュー: 最初の6行
      const lines = text.trim().split("\n").slice(0, 6)
      const rows = lines.map(line => line.split(",").map(c => c.trim()))
      setCsvPreview(rows)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvRawData || !selectedStore) return
    try {
      await importCsv(selectedStore.id, csvRawData)
      showToast("売上実績データを取り込みました", "success")
    } catch {
      showToast("データ取り込みに失敗しました", "error")
    }
  }

  const handleClearCsv = () => {
    setCsvPreview(null)
    setCsvFileName("")
    setCsvRawData("")
    if (fileInputRef.current) fileInputRef.current.value = ""
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
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium text-gray-500">通知機能は準備中です</p>
              <p className="text-xs mt-1">今後のアップデートでメール・Slack通知に対応予定です</p>
            </div>
          </CardContent>
        </Card>

        {/* 売上実績データ取込 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-teal-600" aria-hidden="true" />
              売上実績データ取込
            </CardTitle>
            <CardDescription>CSVファイルから過去の売上実績データを取り込みます。需要予測の精度向上に使用されます。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>CSVフォーマット</Label>
              <div className="bg-gray-50 rounded-md p-3 text-xs font-mono text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">ヘッダー行: date,hour,customers,sales</p>
                <p>2026-01-15,11,8,17600</p>
                <p>2026-01-15,12,18,34200</p>
                <p>2026-01-15,13,12,25200</p>
                <p className="text-gray-400 mt-1">※ hour: 11-22, date: YYYY-MM-DD形式</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-1" />
                CSVファイルを選択
              </Button>
              {csvFileName && (
                <span className="text-sm text-gray-600">{csvFileName}</span>
              )}
            </div>

            {csvPreview && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded border border-gray-200">
                  <table className="w-full text-xs">
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i} className={i === 0 ? "bg-gray-100 font-semibold" : "border-t border-gray-100"}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-1.5">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleImport} disabled={importing} size="sm">
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        取込中...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        データを取り込む
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearCsv} disabled={importing}>
                    クリア
                  </Button>
                </div>
              </div>
            )}

            {importResult && (
              <div className={`flex items-start gap-2 p-3 rounded-md text-sm ${
                importResult.errors && importResult.errors.length > 0
                  ? "bg-amber-50 text-amber-800"
                  : "bg-green-50 text-green-800"
              }`}>
                {importResult.errors && importResult.errors.length > 0 ? (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p>{importResult.inserted}件のデータを取り込みました</p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <ul className="mt-1 text-xs">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
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
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
              <Shield className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium text-gray-500">詳細設定は準備中です</p>
              <p className="text-xs mt-1">予測モデルの選択・人件費率目標の設定は今後対応予定です</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
