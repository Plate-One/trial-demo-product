"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Store, Bell, Clock, Shield, Save } from "lucide-react"

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">設定</h1>
              <p className="text-sm text-gray-600 mt-1">システム設定とカスタマイズ</p>
            </div>
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saved ? "保存しました" : "設定を保存"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 店舗情報 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              店舗情報
            </CardTitle>
            <CardDescription>基本的な店舗情報を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">店舗名</Label>
                <Input id="storeName" defaultValue="キリンシティプラス横浜ベイクォーター店" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeCode">店舗コード</Label>
                <Input id="storeCode" defaultValue="KC-YBQ-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input id="phone" defaultValue="045-XXX-XXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">座席数</Label>
                <Input id="seats" type="number" defaultValue="48" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 営業時間 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              営業時間
            </CardTitle>
            <CardDescription>営業時間とラストオーダー時間を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>平日営業時間</Label>
                <div className="flex items-center gap-2">
                  <Input defaultValue="11:00" className="w-24" />
                  <span className="text-gray-500">〜</span>
                  <Input defaultValue="23:00" className="w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>休日営業時間</Label>
                <div className="flex items-center gap-2">
                  <Input defaultValue="11:00" className="w-24" />
                  <span className="text-gray-500">〜</span>
                  <Input defaultValue="22:00" className="w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ラストオーダー（フード）</Label>
                <Input defaultValue="閉店30分前" className="w-48" />
              </div>
              <div className="space-y-2">
                <Label>ラストオーダー（ドリンク）</Label>
                <Input defaultValue="閉店15分前" className="w-48" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
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
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">需要予測アラート</p>
                <p className="text-xs text-gray-500">予測値と実績の乖離が20%以上の場合に通知</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">人件費率アラート</p>
                <p className="text-xs text-gray-500">人件費率が目標値を超えた場合に通知</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">ヘルプリクエスト通知</p>
                <p className="text-xs text-gray-500">他店舗からのヘルプ依頼を受信</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* システム設定 */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              システム設定
            </CardTitle>
            <CardDescription>AI予測とシステムの動作設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>人件費率目標</Label>
                <Select defaultValue="25">
                  <SelectTrigger>
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
                <Label>予測モデル</Label>
                <Select defaultValue="advanced">
                  <SelectTrigger>
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
