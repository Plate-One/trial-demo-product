"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  CalendarIcon,
  Clock,
  Award,
  Edit,
  Trash2,
  User,
  FileText,
  SaveIcon,
} from "lucide-react"
import Link from "next/link"

// スタッフデータの型定義
interface StaffMember {
  id: string
  name: string
  nameKana: string
  avatar?: string
  role: string
  store: string
  employmentType: "正社員" | "パート" | "アルバイト"
  skills: Array<{
    name: string
    level: number
    certifications?: string[]
    experience?: string
  }>
  schedule: "早番" | "遅番" | "通し" | "シフト制"
  phone: string
  email: string
  joinDate: string
  hourlyRate?: number
  address?: string
  birthday?: string
  notes?: string
  emergencyContact?: {
    name: string
    relation: string
    phone: string
  }
  availability?: {
    mon: boolean[]
    tue: boolean[]
    wed: boolean[]
    thu: boolean[]
    fri: boolean[]
    sat: boolean[]
    sun: boolean[]
  }
  certifications?: Array<{
    name: string
    date: string
    expires?: string
  }>
}

// サンプルデータ
const staffData: Record<string, StaffMember> = {
  "1": {
    id: "1",
    name: "佐藤 一郎",
    nameKana: "さとう いちろう",
    avatar: "/placeholder.svg?height=120&width=120",
    role: "店長",
    store: "キリンシティプラス横浜ベイクォーター店",
    employmentType: "正社員",
    skills: [
      {
        name: "調理",
        level: 90,
        certifications: ["調理師免許", "食品衛生責任者"],
        experience: "10年以上の調理経験。フレンチ、イタリアン、和食の専門技術あり。",
      },
      {
        name: "接客",
        level: 85,
        experience: "高級レストランでの接客経験。VIP対応の実績あり。",
      },
      {
        name: "マネジメント",
        level: 95,
        certifications: ["店舗管理責任者資格"],
        experience: "5年間の店舗管理経験。前職では20名のスタッフをマネジメント。",
      },
    ],
    schedule: "通し",
    phone: "090-1234-5678",
    email: "i.sato@example.com",
    joinDate: "2020-01-15",
    address: "東京都新宿区西新宿1-1-1",
    birthday: "1985-05-15",
    notes: "社内MVPを2回受賞。研修講師も担当。",
    emergencyContact: {
      name: "佐藤 花子",
      relation: "配偶者",
      phone: "090-8765-4321",
    },
    availability: {
      mon: [true, true, true],
      tue: [true, true, true],
      wed: [true, true, true],
      thu: [true, true, false],
      fri: [true, true, false],
      sat: [false, false, true],
      sun: [false, false, false],
    },
    certifications: [
      {
        name: "調理師免許",
        date: "2015-03-20",
      },
      {
        name: "食品衛生責任者",
        date: "2018-05-10",
      },
      {
        name: "防火管理者",
        date: "2020-10-15",
        expires: "2025-10-14",
      },
    ],
  },
  "2": {
    id: "2",
    name: "田中 花子",
    nameKana: "たなか はなこ",
    avatar: "/placeholder.svg?height=120&width=120",
    role: "ホールスタッフ",
    store: "キリンシティプラス横浜ベイクォーター店",
    employmentType: "パート",
    skills: [
      {
        name: "接客",
        level: 80,
        experience: "4年間の接客経験。お客様からの評価が高い。",
      },
      {
        name: "レジ",
        level: 95,
        experience: "POSシステムの操作に熟練。レジ締め作業も担当。",
      },
      {
        name: "ドリンク作成",
        level: 75,
        experience: "基本的なカクテル、コーヒーの作成が可能。",
      },
    ],
    schedule: "早番",
    phone: "090-2345-6789",
    email: "h.tanaka@example.com",
    joinDate: "2021-04-10",
    hourlyRate: 1200,
    address: "東京都渋谷区渋谷2-2-2",
    birthday: "1992-10-08",
    notes: "フレンドリーな接客で常連客から人気。英語対応可能。",
    availability: {
      mon: [true, false, false],
      tue: [true, false, false],
      wed: [true, false, false],
      thu: [true, false, false],
      fri: [false, true, false],
      sat: [false, true, true],
      sun: [false, true, true],
    },
  },
}

// スキルに応じたバッジの色を返す関数
const getSkillBadgeVariant = (skill: string) => {
  switch (skill) {
    case "調理":
      return "default"
    case "接客":
      return "secondary"
    case "マネジメント":
      return "destructive"
    case "レジ":
      return "outline"
    case "食器洗浄":
      return "secondary"
    case "ワイン":
      return "default"
    case "メニュー開発":
      return "destructive"
    case "在庫管理":
      return "outline"
    case "ドリンク作成":
      return "secondary"
    default:
      return "default"
  }
}

// スキルレベルの表示コンポーネント
const SkillLevel = ({ level }: { level: number }) => {
  let color = "bg-gray-500"

  if (level >= 90) color = "bg-emerald-500"
  else if (level >= 75) color = "bg-blue-500"
  else if (level >= 60) color = "bg-amber-500"
  else if (level >= 40) color = "bg-orange-500"

  return (
    <div className="flex items-center gap-2 mt-1">
      <Progress value={level} className="h-2 flex-1" indicatorClassName={color} />
      <span className="text-sm font-medium w-8 text-right">{level}%</span>
    </div>
  )
}

// 勤務可能時間帯の表示
const AvailabilityTable = ({ availability }: { availability: StaffMember["availability"] }) => {
  if (!availability) return null

  const timeSlots = ["朝 (6-12)", "昼 (12-18)", "夜 (18-24)"]
  const days = ["月", "火", "水", "木", "金", "土", "日"]
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-muted text-left">時間帯</th>
            {days.map((day) => (
              <th key={day} className="border p-2 bg-muted text-center">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot, idx) => (
            <tr key={slot}>
              <td className="border p-2 font-medium">{slot}</td>
              {dayKeys.map((day) => (
                <td key={day} className="border p-2 text-center">
                  {availability[day][idx] ? (
                    <span className="text-green-600">○</span>
                  ) : (
                    <span className="text-red-500">×</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function StaffDetail() {
  const router = useRouter()
  const params = useParams()
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isEditing, setIsEditing] = useState(false)
  const [editedStaff, setEditedStaff] = useState<StaffMember | null>(null)

  useEffect(() => {
    // 実際のアプリケーションではAPIから取得するが、ここではモックデータを使用
    const id = params.id as string
    const staffMember = staffData[id]

    if (staffMember) {
      setStaff(staffMember)
      setEditedStaff(staffMember)
    }

    setLoading(false)
  }, [params.id])

  const handleEditToggle = () => {
    if (isEditing) {
      // 編集モードを終了して変更を保存
      if (editedStaff) {
        setStaff(editedStaff)
        // 実際のアプリケーションではここでAPIを呼び出して保存
        console.log("保存されたデータ:", editedStaff)
      }
    } else {
      // 編集モードを開始
      setEditedStaff(staff)
    }
    setIsEditing(!isEditing)
  }

  const handleInputChange = (field: string, value: string) => {
    if (!editedStaff) return
    setEditedStaff({ ...editedStaff, [field]: value })
  }

  if (!staff) {
    return (
      <div className="container py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">スタッフが見つかりませんでした</h1>
          <Button asChild>
            <Link href="/staff">スタッフ一覧に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/staff">
                <ArrowLeft className="h-4 w-4 mr-1" /> 戻る
              </Link>
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">スタッフ詳細</h1>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム - スタッフ基本情報 */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center mb-6">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage src={editedStaff?.avatar} alt={editedStaff?.name} />
                      <AvatarFallback>{editedStaff?.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 w-full">
                      <Input
                        value={editedStaff?.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="text-center font-bold text-lg"
                      />
                      <Input
                        value={editedStaff?.nameKana || ""}
                        onChange={(e) => handleInputChange("nameKana", e.target.value)}
                        className="text-center text-muted-foreground"
                      />
                    </div>
                    <div className="mt-2 space-y-2 w-full">
                      <Select value={editedStaff?.role} onValueChange={(value) => handleInputChange("role", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="役職" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="店長">店長</SelectItem>
                          <SelectItem value="ホールスタッフ">ホールスタッフ</SelectItem>
                          <SelectItem value="キッチンスタッフ">キッチンスタッフ</SelectItem>
                          <SelectItem value="ホールマネージャー">ホールマネージャー</SelectItem>
                          <SelectItem value="キッチンチーフ">キッチンチーフ</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={editedStaff?.employmentType}
                        onValueChange={(value) => handleInputChange("employmentType", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="雇用形態" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="正社員">正社員</SelectItem>
                          <SelectItem value="パート">パート</SelectItem>
                          <SelectItem value="アルバイト">アルバイト</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={editedStaff?.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={editedStaff?.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <Select value={editedStaff?.store} onValueChange={(value) => handleInputChange("store", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="所属店舗" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="キリンシティプラス横浜ベイクォーター店">キリンシティプラス横浜ベイクォーター店</SelectItem>
                          <SelectItem value="キリンシティ 横浜モアーズ店">キリンシティ 横浜モアーズ店</SelectItem>
                          <SelectItem value="キリンシティ FOOD＆TIME ISETAN YOKOHAMA店">キリンシティ FTI横浜店</SelectItem>
                          <SelectItem value="キリンシティ CIAL桜木町店">キリンシティ CIAL桜木町店</SelectItem>
                          <SelectItem value="キリンシティ 町田店">キリンシティ 町田店</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={editedStaff?.joinDate || ""}
                        onChange={(e) => handleInputChange("joinDate", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={editedStaff?.schedule}
                        onValueChange={(value) => handleInputChange("schedule", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="シフト" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="早番">早番</SelectItem>
                          <SelectItem value="遅番">遅番</SelectItem>
                          <SelectItem value="通し">通し</SelectItem>
                          <SelectItem value="シフト制">シフト制</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editedStaff?.hourlyRate !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="ml-6">時給:</span>
                        <Input
                          type="number"
                          value={editedStaff?.hourlyRate || 0}
                          onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                        />
                        <span>円</span>
                      </div>
                    )}
                    {editedStaff?.address && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div>住所:</div>
                          <Input
                            value={editedStaff?.address || ""}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center mb-6">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage src={staff.avatar} alt={staff.name} />
                      <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold">{staff.name}</h2>
                    <p className="text-muted-foreground">{staff.nameKana}</p>
                    <div className="mt-2">
                      <Badge className="mr-1">{staff.role}</Badge>
                      <Badge variant="outline">{staff.employmentType}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{staff.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{staff.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{staff.store}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>入社日: {staff.joinDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>シフト: {staff.schedule}</span>
                    </div>
                    {staff.hourlyRate && (
                      <div className="flex items-center gap-2">
                        <span className="ml-6">時給: {staff.hourlyRate}円</span>
                      </div>
                    )}
                    {staff.address && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <div>住所:</div>
                          <div>{staff.address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end mt-6 gap-2">
                <Button variant="outline" size="sm" onClick={handleEditToggle}>
                  {isEditing ? (
                    <>
                      <SaveIcon className="h-4 w-4 mr-1" /> 保存
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-1" /> 編集
                    </>
                  )}
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> 削除
                </Button>
              </div>
            </div>

          {/* 緊急連絡先 */}
          {staff.emergencyContact && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">緊急連絡先</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">氏名:</span> {staff.emergencyContact.name}
                  </div>
                  <div>
                    <span className="font-medium">続柄:</span> {staff.emergencyContact.relation}
                  </div>
                  <div>
                    <span className="font-medium">電話番号:</span> {staff.emergencyContact.phone}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 資格・証明書 */}
          {staff.certifications && staff.certifications.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">資格・証明書</h3>
              <div>
                <div className="space-y-4">
                  {staff.certifications.map((cert, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Award className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <div className="font-medium">{cert.name}</div>
                        <div className="text-sm text-muted-foreground">
                          取得日: {cert.date}
                          {cert.expires && <div>有効期限: {cert.expires}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 中央・右カラム - タブコンテンツ */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="skills">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="skills">スキル</TabsTrigger>
              <TabsTrigger value="schedule">勤務可能時間</TabsTrigger>
              <TabsTrigger value="shifts">シフト履歴</TabsTrigger>
              <TabsTrigger value="notes">メモ</TabsTrigger>
            </TabsList>

            {/* スキルタブ */}
            <TabsContent value="skills" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">スキル詳細</h3>
                <p className="text-sm text-gray-600 mb-4">スタッフのスキルレベルと専門知識</p>
                <div>
                  <div className="space-y-6">
                    {staff.skills.map((skill, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSkillBadgeVariant(skill.name) as any}>{skill.name}</Badge>
                            {skill.certifications &&
                              skill.certifications.map((cert, i) => (
                                <Badge key={i} variant="outline">
                                  {cert}
                                </Badge>
                              ))}
                          </div>
                        </div>
                        <SkillLevel level={skill.level} />
                        {skill.experience && <p className="mt-2 text-sm text-muted-foreground">{skill.experience}</p>}
                        {index < staff.skills.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 勤務可能時間タブ */}
            <TabsContent value="schedule" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">勤務可能時間</h3>
                <p className="text-sm text-gray-600 mb-4">スタッフの希望勤務時間帯</p>
                <div>
                  {staff.availability ? (
                    <AvailabilityTable availability={staff.availability} />
                  ) : (
                    <p>勤務可能時間の情報がありません。</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* シフト履歴タブ */}
            <TabsContent value="shifts" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">シフト履歴</h3>
                <p className="text-sm text-gray-600 mb-4">過去のシフト情報と今後の予定</p>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-medium mb-2">カレンダー</h3>
                      <Calendar mode="single" selected={date} onSelect={setDate} className="border rounded-md" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">シフト詳細</h3>
                      {date ? (
                        <div className="border rounded-md p-4">
                          <p className="text-lg font-bold">
                            {date.toLocaleDateString("ja-JP", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>

                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between">
                              <span>シフト時間:</span>
                              <span className="font-medium">10:00 - 18:00</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ポジション:</span>
                              <span className="font-medium">ホール</span>
                            </div>
                            <div className="flex justify-between">
                              <span>勤務時間:</span>
                              <span className="font-medium">8時間</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p>日付を選択してください</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* メモタブ */}
            <TabsContent value="notes" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">メモ</h3>
                <p className="text-sm text-gray-600 mb-4">スタッフに関する追加情報とメモ</p>
                <div>
                  {staff.notes ? (
                    <div className="p-4 bg-muted rounded-md">
                      <div className="flex items-start gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <p>{staff.notes}</p>
                      </div>
                    </div>
                  ) : (
                    <p>メモはありません</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </div>
    </div>
  )
}
