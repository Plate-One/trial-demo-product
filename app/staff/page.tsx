"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Building,
  Phone,
  Mail,
  Filter,
  Download,
  Upload
} from "lucide-react"
import Link from "next/link"
import { ALL_STAFF, getSkillColor, getPositionColor, getRoleColor, getEmploymentColor } from "@/lib/mock-data"
import { useToast } from "@/components/toast"
import { StatCard } from "@/components/stat-card"

// スタッフデータの型定義
interface StaffMember {
  id: string
  name: string
  nameKana: string
  avatar?: string
  store: string
  position: "ホール" | "キッチン" | "両方"
  role: "店長" | "マネージャー" | "チーフ" | "スタッフ"
  employmentType: "正社員" | "パート" | "アルバイト"
  skills: string[]
  phone: string
  email: string
  joinDate: string
  hourlyRate?: number
  status: "在籍" | "休職" | "退職"
}

// 初期スタッフデータ（共有モジュールから生成）
const initialStaffData: StaffMember[] = ALL_STAFF.map((s) => ({
  id: s.id,
  name: s.name,
  nameKana: s.nameKana,
  avatar: s.avatar,
  store: s.store,
  position: s.position,
  role: s.role,
  employmentType: s.employmentType,
  skills: s.simpleSkills,
  phone: s.phone,
  email: s.email,
  joinDate: s.joinDate,
  hourlyRate: s.hourlyRate,
  status: s.status,
}))

export default function StaffManagement() {
  const { showToast } = useToast()
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaffData)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStore, setFilterStore] = useState<string>("all")
  const [filterPosition, setFilterPosition] = useState<string>("all")
  const [filterEmployment, setFilterEmployment] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({
    name: "",
    nameKana: "",
    store: "キリンシティプラス横浜ベイクォーター店",
    position: "ホール",
    role: "スタッフ",
    employmentType: "アルバイト",
    skills: [],
    phone: "",
    email: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "在籍",
  })

  // フィルタリングされたスタッフリスト
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.nameKana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStore = filterStore === "all" || staff.store === filterStore
    const matchesPosition = filterPosition === "all" || staff.position === filterPosition
    const matchesEmployment = filterEmployment === "all" || staff.employmentType === filterEmployment
    
    return matchesSearch && matchesStore && matchesPosition && matchesEmployment
  })

  // スタッフ作成
  const handleCreateStaff = () => {
    const id = (Math.max(...staffList.map((s) => parseInt(s.id))) + 1).toString()
    const staff: StaffMember = {
      ...newStaff as StaffMember,
      id,
    }
    setStaffList([...staffList, staff])
    setIsCreateModalOpen(false)
    setNewStaff({
      name: "",
      nameKana: "",
      store: "キリンシティプラス横浜ベイクォーター店",
      position: "ホール",
      role: "スタッフ",
      employmentType: "アルバイト",
      skills: [],
      phone: "",
      email: "",
      joinDate: new Date().toISOString().split("T")[0],
      status: "在籍",
    })
  }

  // スタッフ更新
  const handleUpdateStaff = () => {
    if (!selectedStaff) return
    setStaffList(staffList.map((s) => (s.id === selectedStaff.id ? selectedStaff : s)))
    setIsEditModalOpen(false)
    setSelectedStaff(null)
  }

  // スタッフ削除
  const handleDeleteStaff = () => {
    if (!selectedStaff) return
    setStaffList(staffList.filter((s) => s.id !== selectedStaff.id))
    setIsDeleteModalOpen(false)
    setSelectedStaff(null)
  }

  // 統計情報
  const stats = {
    total: staffList.length,
    hall: staffList.filter((s) => s.position === "ホール" || s.position === "両方").length,
    kitchen: staffList.filter((s) => s.position === "キッチン" || s.position === "両方").length,
    fullTime: staffList.filter((s) => s.employmentType === "正社員").length,
  }

  // スキル一覧
  const allSkills = ["調理", "接客", "マネジメント", "レジ", "ドリンク", "調理補助", "食器洗浄", "仕込み", "クレーム対応", "予約管理", "メニュー開発", "在庫管理", "衛生管理", "発注管理", "盛り付け", "清掃"]

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b">
        <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
              <h1 className="text-xl font-semibold text-gray-800">スタッフ管理</h1>
              <p className="text-sm text-gray-600 mt-1">スタッフ情報の登録・編集・削除</p>
        </div>
        <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => {
                const header = "ID,名前,フリガナ,店舗,ポジション,役職,雇用形態,電話,メール,入社日\n"
                const rows = staffList.map(s => `${s.id},${s.name},${s.nameKana},${s.store},${s.position},${s.role},${s.employmentType},${s.phone},${s.email},${s.joinDate}`).join("\n")
                const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = "staff_list.csv"
                link.click()
                URL.revokeObjectURL(url)
                showToast("スタッフ一覧をCSVエクスポートしました")
              }}>
                <Download className="mr-2 h-4 w-4" />
                エクスポート
              </Button>
              <Button variant="outline" size="sm" onClick={() => showToast("CSVファイルからのインポート機能は準備中です", "info")}>
                <Upload className="mr-2 h-4 w-4" />
                インポート
          </Button>
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
                新規登録
          </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="総スタッフ数" value={`${stats.total}名`} />
          <StatCard
            label="ホール担当"
            value={`${stats.hall}名`}
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
            labelColor="text-blue-600"
            valueColor="text-blue-900"
          />
          <StatCard
            label="キッチン担当"
            value={`${stats.kitchen}名`}
            bgColor="bg-emerald-50"
            borderColor="border-emerald-200"
            labelColor="text-emerald-600"
            valueColor="text-emerald-900"
          />
          <StatCard
            label="正社員"
            value={`${stats.fullTime}名`}
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
            labelColor="text-purple-600"
            valueColor="text-purple-900"
          />
        </div>

        {/* 検索・フィルター */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="名前、フリガナ、メールで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterStore} onValueChange={setFilterStore}>
                <SelectTrigger className="w-[160px]">
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="店舗" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての店舗</SelectItem>
                  <SelectItem value="キリンシティプラス横浜ベイクォーター店">横浜ベイクォーター店</SelectItem>
                  <SelectItem value="キリンシティ 横浜モアーズ店">横浜モアーズ店</SelectItem>
                  <SelectItem value="キリンシティ CIAL桜木町店">CIAL桜木町店</SelectItem>
                  <SelectItem value="キリンシティ FOOD＆TIME ISETAN YOKOHAMA店">FTI横浜店</SelectItem>
                  <SelectItem value="キリンシティ 町田店">町田店</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="ポジション" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="ホール">ホール</SelectItem>
                  <SelectItem value="キッチン">キッチン</SelectItem>
                  <SelectItem value="両方">両方</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEmployment} onValueChange={setFilterEmployment}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="雇用形態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="正社員">正社員</SelectItem>
                  <SelectItem value="パート">パート</SelectItem>
                  <SelectItem value="アルバイト">アルバイト</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* スタッフリスト */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 font-medium text-gray-600">スタッフ</th>
                  <th className="text-left p-4 font-medium text-gray-600">所属店舗</th>
                  <th className="text-left p-4 font-medium text-gray-600">ポジション</th>
                  <th className="text-left p-4 font-medium text-gray-600">役職</th>
                  <th className="text-left p-4 font-medium text-gray-600">雇用形態</th>
                  <th className="text-left p-4 font-medium text-gray-600">連絡先</th>
                  <th className="text-center p-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <Link href={`/staff/${staff.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staff.avatar} alt={staff.name} />
                          <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-xs text-gray-500">{staff.nameKana}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-700">{staff.store}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={getPositionColor(staff.position)}>
                        {staff.position}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getRoleColor(staff.role)}>
                        {staff.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={getEmploymentColor(staff.employmentType)}>
                        {staff.employmentType}
                      </Badge>
                      {staff.hourlyRate && (
                        <p className="text-xs text-gray-500 mt-1">¥{staff.hourlyRate}/h</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{staff.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs truncate max-w-[120px]">{staff.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(staff)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedStaff(staff)
                            setIsDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStaff.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              該当するスタッフが見つかりません
            </div>
          )}
        </div>

        {/* 新規登録モーダル */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規スタッフ登録</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">名前 *</label>
                  <Input
                    value={newStaff.name || ""}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="山田 太郎"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">フリガナ *</label>
                  <Input
                    value={newStaff.nameKana || ""}
                    onChange={(e) => setNewStaff({ ...newStaff, nameKana: e.target.value })}
                    placeholder="やまだ たろう"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">所属店舗 *</label>
                  <Select
                    value={newStaff.store}
                    onValueChange={(value) => setNewStaff({ ...newStaff, store: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div>
                  <label className="text-sm font-medium text-gray-700">ポジション *</label>
                  <Select
                    value={newStaff.position}
                    onValueChange={(value) => setNewStaff({ ...newStaff, position: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ホール">ホール</SelectItem>
                      <SelectItem value="キッチン">キッチン</SelectItem>
                      <SelectItem value="両方">両方</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">役職 *</label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(value) => setNewStaff({ ...newStaff, role: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="店長">店長</SelectItem>
                      <SelectItem value="マネージャー">マネージャー</SelectItem>
                      <SelectItem value="チーフ">チーフ</SelectItem>
                      <SelectItem value="スタッフ">スタッフ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">雇用形態 *</label>
                  <Select
                    value={newStaff.employmentType}
                    onValueChange={(value) => setNewStaff({ ...newStaff, employmentType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="正社員">正社員</SelectItem>
                      <SelectItem value="パート">パート</SelectItem>
                      <SelectItem value="アルバイト">アルバイト</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">電話番号 *</label>
                  <Input
                    value={newStaff.phone || ""}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="090-1234-5678"
                  />
                </div>
              <div>
                  <label className="text-sm font-medium text-gray-700">メールアドレス *</label>
                  <Input
                    type="email"
                    value={newStaff.email || ""}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">入社日 *</label>
                  <Input
                    type="date"
                    value={newStaff.joinDate || ""}
                    onChange={(e) => setNewStaff({ ...newStaff, joinDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">時給（パート・アルバイトのみ）</label>
                  <Input
                    type="number"
                    value={newStaff.hourlyRate || ""}
                    onChange={(e) => setNewStaff({ ...newStaff, hourlyRate: parseInt(e.target.value) || undefined })}
                    placeholder="1100"
                  />
                </div>
            </div>
              <div>
                <label className="text-sm font-medium text-gray-700">スキル</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={newStaff.skills?.includes(skill) ? "default" : "outline"}
                      className={`cursor-pointer ${newStaff.skills?.includes(skill) ? "" : "hover:bg-gray-100"}`}
                      onClick={() => {
                        const skills = newStaff.skills || []
                        if (skills.includes(skill)) {
                          setNewStaff({ ...newStaff, skills: skills.filter((s) => s !== skill) })
                        } else {
                          setNewStaff({ ...newStaff, skills: [...skills, skill] })
                        }
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateStaff} disabled={!newStaff.name || !newStaff.phone || !newStaff.email}>
                登録する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 編集モーダル */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>スタッフ情報編集</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">名前 *</label>
                    <Input
                      value={selectedStaff.name}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">フリガナ *</label>
                    <Input
                      value={selectedStaff.nameKana}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, nameKana: e.target.value })}
                    />
            </div>
          </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">所属店舗 *</label>
                    <Select
                      value={selectedStaff.store}
                      onValueChange={(value) => setSelectedStaff({ ...selectedStaff, store: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                  <div>
                    <label className="text-sm font-medium text-gray-700">ポジション *</label>
                    <Select
                      value={selectedStaff.position}
                      onValueChange={(value) => setSelectedStaff({ ...selectedStaff, position: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ホール">ホール</SelectItem>
                        <SelectItem value="キッチン">キッチン</SelectItem>
                        <SelectItem value="両方">両方</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">役職 *</label>
                    <Select
                      value={selectedStaff.role}
                      onValueChange={(value) => setSelectedStaff({ ...selectedStaff, role: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="店長">店長</SelectItem>
                        <SelectItem value="マネージャー">マネージャー</SelectItem>
                        <SelectItem value="チーフ">チーフ</SelectItem>
                        <SelectItem value="スタッフ">スタッフ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">雇用形態 *</label>
                    <Select
                      value={selectedStaff.employmentType}
                      onValueChange={(value) => setSelectedStaff({ ...selectedStaff, employmentType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="正社員">正社員</SelectItem>
                        <SelectItem value="パート">パート</SelectItem>
                        <SelectItem value="アルバイト">アルバイト</SelectItem>
                      </SelectContent>
                    </Select>
                                </div>
                              </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">電話番号 *</label>
                    <Input
                      value={selectedStaff.phone}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">メールアドレス *</label>
                    <Input
                      type="email"
                      value={selectedStaff.email}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                    />
                            </div>
                            </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">入社日 *</label>
                    <Input
                      type="date"
                      value={selectedStaff.joinDate}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, joinDate: e.target.value })}
                    />
                        </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">時給</label>
                    <Input
                      type="number"
                      value={selectedStaff.hourlyRate || ""}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, hourlyRate: parseInt(e.target.value) || undefined })}
                    />
                    </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">スキル</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={selectedStaff.skills.includes(skill) ? "default" : "outline"}
                        className={`cursor-pointer ${selectedStaff.skills.includes(skill) ? "" : "hover:bg-gray-100"}`}
                        onClick={() => {
                          if (selectedStaff.skills.includes(skill)) {
                            setSelectedStaff({ ...selectedStaff, skills: selectedStaff.skills.filter((s) => s !== skill) })
                          } else {
                            setSelectedStaff({ ...selectedStaff, skills: [...selectedStaff.skills, skill] })
                          }
                        }}
                      >
                        {skill}
                    </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleUpdateStaff}>
                更新する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 削除確認モーダル */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>スタッフを削除しますか？</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <div className="py-4">
                <p className="text-gray-600">
                  <strong>{selectedStaff.name}</strong> さんの情報を削除します。
                  この操作は取り消せません。
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleDeleteStaff}>
                削除する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
    </div>
  )
}
