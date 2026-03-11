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
  Building,
  Phone,
  Mail,
  Download,
  Upload
} from "lucide-react"
import Link from "next/link"
import { getSkillColor, getPositionColor, getRoleColor, getEmploymentColor } from "@/lib/mock-data"
import { useToast } from "@/components/toast"
import { StatCard } from "@/components/stat-card"
import { ColumnToggle, useColumnVisibility } from "@/components/column-toggle"
import { OnboardingHint } from "@/components/onboarding-hints"
import { useStaff, useStaffMutations, type StaffWithRelations } from "@/lib/hooks/use-staff"
import { useStoreContext } from "@/lib/hooks/use-store-context"
import { createClient } from "@/lib/supabase/client"

const STAFF_COLUMNS = [
  { key: "name", label: "スタッフ" },
  { key: "store", label: "所属店舗" },
  { key: "position", label: "ポジション" },
  { key: "role", label: "役職" },
  { key: "employment", label: "雇用形態" },
  { key: "contact", label: "連絡先", defaultVisible: false },
  { key: "actions", label: "操作" },
]

const allSkills = ["調理", "接客", "マネジメント", "レジ", "ドリンク", "調理補助", "食器洗浄", "仕込み", "クレーム対応", "予約管理", "メニュー開発", "在庫管理", "衛生管理", "発注管理", "盛り付け", "清掃"]

export default function StaffManagement() {
  const { showToast } = useToast()
  const { visibleColumns, toggle: toggleColumn, isVisible } = useColumnVisibility(STAFF_COLUMNS)
  const { stores } = useStoreContext()
  const { staff: staffList, loading, refetch } = useStaff()
  const { createStaff, updateStaff, deleteStaff } = useStaffMutations()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStore, setFilterStore] = useState<string>("all")
  const [filterPosition, setFilterPosition] = useState<string>("all")
  const [filterEmployment, setFilterEmployment] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffWithRelations | null>(null)
  const [saving, setSaving] = useState(false)

  // New staff form state
  const defaultNewStaff = {
    name: "",
    name_kana: "",
    store_id: stores[0]?.id ?? "",
    position: "ホール" as const,
    role: "スタッフ" as const,
    employment_type: "アルバイト" as const,
    phone: "",
    email: "",
    join_date: new Date().toISOString().split("T")[0],
    hourly_rate: undefined as number | undefined,
    selectedSkills: [] as string[],
  }
  const [newStaff, setNewStaff] = useState(defaultNewStaff)

  // Filtering
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name_kana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStore = filterStore === "all" || s.store_id === filterStore
    const matchesPosition = filterPosition === "all" || s.position === filterPosition
    const matchesEmployment = filterEmployment === "all" || s.employment_type === filterEmployment
    return matchesSearch && matchesStore && matchesPosition && matchesEmployment
  })

  const stats = {
    total: staffList.length,
    hall: staffList.filter((s) => s.position === "ホール" || s.position === "両方").length,
    kitchen: staffList.filter((s) => s.position === "キッチン" || s.position === "両方").length,
    fullTime: staffList.filter((s) => s.employment_type === "正社員").length,
  }

  const getStoreName = (storeId: string) => {
    return stores.find((s) => s.id === storeId)?.name ?? ""
  }

  const getSkillNames = (s: StaffWithRelations) => {
    return s.skills?.map((sk) => sk.name) ?? []
  }

  // Create
  const handleCreateStaff = async () => {
    if (!newStaff.name || !newStaff.email) return
    setSaving(true)
    try {
      const orgId = staffList[0]?.organization_id
      if (!orgId) throw new Error("Organization not found")

      await createStaff(
        {
          organization_id: orgId,
          store_id: newStaff.store_id,
          name: newStaff.name,
          name_kana: newStaff.name_kana,
          position: newStaff.position,
          role: newStaff.role,
          employment_type: newStaff.employment_type,
          phone: newStaff.phone,
          email: newStaff.email,
          join_date: newStaff.join_date,
          hourly_rate: newStaff.hourly_rate ?? null,
        },
        newStaff.selectedSkills.map((name) => ({ name, level: 50 }))
      )
      setIsCreateModalOpen(false)
      setNewStaff({ ...defaultNewStaff, store_id: stores[0]?.id ?? "" })
      showToast("スタッフを登録しました")
      refetch()
    } catch (e) {
      showToast("登録に失敗しました", "error")
    }
    setSaving(false)
  }

  // Update
  const handleUpdateStaff = async () => {
    if (!selectedStaff) return
    setSaving(true)
    try {
      await updateStaff(selectedStaff.id, {
        name: selectedStaff.name,
        name_kana: selectedStaff.name_kana,
        store_id: selectedStaff.store_id,
        position: selectedStaff.position,
        role: selectedStaff.role,
        employment_type: selectedStaff.employment_type,
        phone: selectedStaff.phone,
        email: selectedStaff.email,
        join_date: selectedStaff.join_date,
        hourly_rate: selectedStaff.hourly_rate,
      })
      setIsEditModalOpen(false)
      setSelectedStaff(null)
      showToast("スタッフ情報を更新しました")
      refetch()
    } catch (e) {
      showToast("更新に失敗しました", "error")
    }
    setSaving(false)
  }

  // Delete
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return
    setSaving(true)
    try {
      await deleteStaff(selectedStaff.id)
      setIsDeleteModalOpen(false)
      setSelectedStaff(null)
      showToast("スタッフを削除しました")
      refetch()
    } catch (e) {
      showToast("削除に失敗しました", "error")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

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
                const rows = staffList.map(s => `${s.id},${s.name},${s.name_kana},${getStoreName(s.store_id)},${s.position},${s.role},${s.employment_type},${s.phone},${s.email},${s.join_date}`).join("\n")
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
        <OnboardingHint
          id="staff-intro"
          message="スタッフの検索・フィルターで絞り込みができます。「表示列」ボタンで表示する列を選択できます。"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="総スタッフ数" value={`${stats.total}名`} />
          <StatCard label="ホール担当" value={`${stats.hall}名`} bgColor="bg-blue-50" borderColor="border-blue-200" labelColor="text-blue-600" valueColor="text-blue-900" />
          <StatCard label="キッチン担当" value={`${stats.kitchen}名`} bgColor="bg-emerald-50" borderColor="border-emerald-200" labelColor="text-emerald-600" valueColor="text-emerald-900" />
          <StatCard label="正社員" value={`${stats.fullTime}名`} bgColor="bg-purple-50" borderColor="border-purple-200" labelColor="text-purple-600" valueColor="text-purple-900" />
        </div>

        {/* Search & Filter */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="名前、フリガナ、メールで検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>{store.short_name}</SelectItem>
                  ))}
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

        {/* Staff List */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{filteredStaff.length}件のスタッフ</p>
          <ColumnToggle columns={STAFF_COLUMNS} visibleColumns={visibleColumns} onToggle={toggleColumn} />
        </div>
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {isVisible("name") && <th className="text-left p-4 font-medium text-gray-600">スタッフ</th>}
                  {isVisible("store") && <th className="text-left p-4 font-medium text-gray-600">所属店舗</th>}
                  {isVisible("position") && <th className="text-left p-4 font-medium text-gray-600">ポジション</th>}
                  {isVisible("role") && <th className="text-left p-4 font-medium text-gray-600">役職</th>}
                  {isVisible("employment") && <th className="text-left p-4 font-medium text-gray-600">雇用形態</th>}
                  {isVisible("contact") && <th className="text-left p-4 font-medium text-gray-600">連絡先</th>}
                  {isVisible("actions") && <th className="text-center p-4 font-medium text-gray-600">操作</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="border-b hover:bg-gray-50 transition-colors">
                    {isVisible("name") && (
                    <td className="p-4">
                      <Link href={`/staff/${staff.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staff.avatar_url ?? undefined} alt={staff.name} />
                          <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-xs text-gray-500">{staff.name_kana}</p>
                        </div>
                      </Link>
                    </td>
                    )}
                    {isVisible("store") && (
                    <td className="p-4">
                      <span className="text-sm text-gray-700">{getStoreName(staff.store_id)}</span>
                    </td>
                    )}
                    {isVisible("position") && (
                    <td className="p-4">
                      <Badge variant="outline" className={getPositionColor(staff.position)}>
                        {staff.position}
                      </Badge>
                    </td>
                    )}
                    {isVisible("role") && (
                    <td className="p-4">
                      <Badge className={getRoleColor(staff.role)}>
                        {staff.role}
                      </Badge>
                    </td>
                    )}
                    {isVisible("employment") && (
                    <td className="p-4">
                      <Badge variant="outline" className={getEmploymentColor(staff.employment_type)}>
                        {staff.employment_type}
                      </Badge>
                      {staff.hourly_rate && (
                        <p className="text-xs text-gray-500 mt-1">¥{staff.hourly_rate}/h</p>
                      )}
                    </td>
                    )}
                    {isVisible("contact") && (
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" aria-hidden="true" />
                          <span className="text-xs">{staff.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Mail className="h-3 w-3" aria-hidden="true" />
                          <span className="text-xs truncate max-w-[120px]">{staff.email}</span>
                        </div>
                      </div>
                    </td>
                    )}
                    {isVisible("actions") && (
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" aria-label={`${staff.name}を編集`} onClick={() => { setSelectedStaff(staff); setIsEditModalOpen(true) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" aria-label={`${staff.name}を削除`} onClick={() => { setSelectedStaff(staff); setIsDeleteModalOpen(true) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStaff.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">該当するスタッフが見つかりません</h3>
              <p className="text-sm text-gray-500 max-w-sm">検索条件やフィルターを変更してみてください。</p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規スタッフ登録</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">名前 *</label>
                  <Input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="山田 太郎" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">フリガナ *</label>
                  <Input value={newStaff.name_kana} onChange={(e) => setNewStaff({ ...newStaff, name_kana: e.target.value })} placeholder="やまだ たろう" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">所属店舗 *</label>
                  <Select value={newStaff.store_id} onValueChange={(value) => setNewStaff({ ...newStaff, store_id: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ポジション *</label>
                  <Select value={newStaff.position} onValueChange={(value) => setNewStaff({ ...newStaff, position: value as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Select value={newStaff.employment_type} onValueChange={(value) => setNewStaff({ ...newStaff, employment_type: value as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="090-1234-5678" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">メールアドレス *</label>
                  <Input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="example@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">入社日 *</label>
                  <Input type="date" value={newStaff.join_date} onChange={(e) => setNewStaff({ ...newStaff, join_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">時給（パート・アルバイトのみ）</label>
                  <Input type="number" value={newStaff.hourly_rate ?? ""} onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: parseInt(e.target.value) || undefined })} placeholder="1100" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">スキル</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={newStaff.selectedSkills.includes(skill) ? "default" : "outline"}
                      className={`cursor-pointer ${newStaff.selectedSkills.includes(skill) ? "" : "hover:bg-gray-100"}`}
                      onClick={() => {
                        const skills = newStaff.selectedSkills
                        if (skills.includes(skill)) {
                          setNewStaff({ ...newStaff, selectedSkills: skills.filter((s) => s !== skill) })
                        } else {
                          setNewStaff({ ...newStaff, selectedSkills: [...skills, skill] })
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
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleCreateStaff} disabled={!newStaff.name || !newStaff.email || saving}>
                {saving ? "登録中..." : "登録する"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
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
                    <Input value={selectedStaff.name} onChange={(e) => setSelectedStaff({ ...selectedStaff, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">フリガナ *</label>
                    <Input value={selectedStaff.name_kana} onChange={(e) => setSelectedStaff({ ...selectedStaff, name_kana: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">所属店舗 *</label>
                    <Select value={selectedStaff.store_id} onValueChange={(value) => setSelectedStaff({ ...selectedStaff, store_id: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">ポジション *</label>
                    <Select value={selectedStaff.position} onValueChange={(value) => setSelectedStaff({ ...selectedStaff, position: value as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Select value={selectedStaff.role} onValueChange={(value) => setSelectedStaff({ ...selectedStaff, role: value as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Select value={selectedStaff.employment_type} onValueChange={(value) => setSelectedStaff({ ...selectedStaff, employment_type: value as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Input value={selectedStaff.phone ?? ""} onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">メールアドレス *</label>
                    <Input type="email" value={selectedStaff.email} onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">入社日 *</label>
                    <Input type="date" value={selectedStaff.join_date ?? ""} onChange={(e) => setSelectedStaff({ ...selectedStaff, join_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">時給</label>
                    <Input type="number" value={selectedStaff.hourly_rate ?? ""} onChange={(e) => setSelectedStaff({ ...selectedStaff, hourly_rate: parseInt(e.target.value) || null })} />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>キャンセル</Button>
              <Button onClick={handleUpdateStaff} disabled={saving}>
                {saving ? "更新中..." : "更新する"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>スタッフを削除しますか？</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <div className="py-4">
                <p className="text-gray-600">
                  <strong>{selectedStaff.name}</strong> さんの情報を削除します。この操作は取り消せません。
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>キャンセル</Button>
              <Button variant="destructive" onClick={handleDeleteStaff} disabled={saving}>
                {saving ? "削除中..." : "削除する"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
