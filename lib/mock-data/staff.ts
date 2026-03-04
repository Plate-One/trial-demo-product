// Unified staff detail data for all 8 members

export interface StaffSkill {
  name: string
  level: number
  certifications?: string[]
  experience?: string
}

export interface StaffCertification {
  name: string
  date: string
  expires?: string
}

export interface StaffDetailMember {
  id: string
  name: string
  nameKana: string
  avatar?: string
  store: string
  position: "ホール" | "キッチン" | "両方"
  role: "店長" | "マネージャー" | "チーフ" | "スタッフ"
  detailRole: string
  employmentType: "正社員" | "パート" | "アルバイト"
  simpleSkills: string[]
  skills: StaffSkill[]
  schedule: "早番" | "遅番" | "通し" | "シフト制"
  phone: string
  email: string
  joinDate: string
  hourlyRate?: number
  address?: string
  birthday?: string
  notes?: string
  status: "在籍" | "休職" | "退職"
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
  certifications?: StaffCertification[]
}

export const ALL_STAFF: StaffDetailMember[] = [
  {
    id: "1",
    name: "佐藤 一郎",
    nameKana: "さとう いちろう",
    avatar: "/placeholder.svg?height=40&width=40",
    store: "キリンシティプラス横浜ベイクォーター店",
    position: "両方",
    role: "店長",
    detailRole: "店長",
    employmentType: "正社員",
    simpleSkills: ["調理", "接客", "マネジメント", "発注管理"],
    skills: [
      { name: "調理", level: 90, certifications: ["調理師免許", "食品衛生責任者"], experience: "10年以上の調理経験。フレンチ、イタリアン、和食の専門技術あり。" },
      { name: "接客", level: 85, experience: "高級レストランでの接客経験。VIP対応の実績あり。" },
      { name: "マネジメント", level: 95, certifications: ["店舗管理責任者資格"], experience: "5年間の店舗管理経験。前職では20名のスタッフをマネジメント。" },
    ],
    schedule: "通し",
    phone: "090-1234-5678",
    email: "i.sato@example.com",
    joinDate: "2020-01-15",
    address: "神奈川県横浜市神奈川区金港町1-1",
    birthday: "1985-05-15",
    notes: "社内MVPを2回受賞。研修講師も担当。",
    status: "在籍",
    emergencyContact: { name: "佐藤 花子", relation: "配偶者", phone: "090-8765-4321" },
    availability: {
      mon: [true, true, true], tue: [true, true, true], wed: [true, true, true],
      thu: [true, true, false], fri: [true, true, false], sat: [false, false, true], sun: [false, false, false],
    },
    certifications: [
      { name: "調理師免許", date: "2015-03-20" },
      { name: "食品衛生責任者", date: "2018-05-10" },
      { name: "防火管理者", date: "2020-10-15", expires: "2025-10-14" },
    ],
  },
  {
    id: "2",
    name: "田中 花子",
    nameKana: "たなか はなこ",
    avatar: "/placeholder.svg?height=40&width=40",
    store: "キリンシティプラス横浜ベイクォーター店",
    position: "ホール",
    role: "スタッフ",
    detailRole: "ホールスタッフ",
    employmentType: "パート",
    simpleSkills: ["接客", "レジ", "ドリンク"],
    skills: [
      { name: "接客", level: 80, experience: "4年間の接客経験。お客様からの評価が高い。" },
      { name: "レジ", level: 95, experience: "POSシステムの操作に熟練。レジ締め作業も担当。" },
      { name: "ドリンク作成", level: 75, experience: "基本的なカクテル、コーヒーの作成が可能。" },
    ],
    schedule: "早番",
    phone: "090-2345-6789",
    email: "h.tanaka@example.com",
    joinDate: "2021-04-10",
    hourlyRate: 1200,
    address: "神奈川県横浜市西区みなとみらい2-2",
    birthday: "1992-10-08",
    notes: "フレンドリーな接客で常連客から人気。英語対応可能。",
    status: "在籍",
    availability: {
      mon: [true, false, false], tue: [true, false, false], wed: [true, false, false],
      thu: [true, false, false], fri: [false, true, false], sat: [false, true, true], sun: [false, true, true],
    },
  },
  {
    id: "3",
    name: "鈴木 健太",
    nameKana: "すずき けんた",
    avatar: "/placeholder.svg?height=40&width=40",
    store: "キリンシティプラス横浜ベイクォーター店",
    position: "キッチン",
    role: "スタッフ",
    detailRole: "キッチンスタッフ",
    employmentType: "アルバイト",
    simpleSkills: ["調理補助", "食器洗浄", "仕込み"],
    skills: [
      { name: "調理補助", level: 65, experience: "大学在学中から2年間調理補助を経験。基本的な調理技術を習得。" },
      { name: "食器洗浄", level: 85, experience: "効率的な食器洗浄のフロー構築が得意。" },
      { name: "仕込み", level: 60, experience: "野菜カットや下ごしらえを担当。スピードを重視。" },
    ],
    schedule: "シフト制",
    phone: "090-3456-7890",
    email: "k.suzuki@example.com",
    joinDate: "2022-08-01",
    hourlyRate: 1100,
    address: "神奈川県横浜市中区元町3-3",
    birthday: "2001-12-20",
    notes: "大学4年生。卒業後は正社員登用を検討中。料理に対する学習意欲が高い。",
    status: "在籍",
    availability: {
      mon: [false, true, true], tue: [false, false, true], wed: [false, true, true],
      thu: [false, false, true], fri: [false, true, true], sat: [true, true, true], sun: [true, true, false],
    },
  },
  {
    id: "4",
    name: "山田 太郎",
    nameKana: "やまだ たろう",
    avatar: "/placeholder.svg?height=40&width=40",
    store: "キリンシティプラス横浜ベイクォーター店",
    position: "ホール",
    role: "マネージャー",
    detailRole: "ホールマネージャー",
    employmentType: "正社員",
    simpleSkills: ["接客", "マネジメント", "クレーム対応", "予約管理"],
    skills: [
      { name: "接客", level: 92, certifications: ["サービス接遇検定1級"], experience: "7年間のレストラン接客経験。ソムリエ見習い。" },
      { name: "マネジメント", level: 80, experience: "3年間のフロア管理経験。シフト調整と人材育成を担当。" },
      { name: "クレーム対応", level: 88, experience: "クレーム対応マニュアルの作成経験あり。冷静な対応に定評。" },
      { name: "予約管理", level: 85, experience: "予約システム導入プロジェクトのリーダー。" },
    ],
    schedule: "通し",
    phone: "090-4567-8901",
    email: "t.yamada@example.com",
    joinDate: "2019-06-01",
    address: "神奈川県横浜市港北区日吉4-4",
    birthday: "1988-03-22",
    notes: "ソムリエ資格の取得を目指して勉強中。ワインペアリング提案が好評。",
    status: "在籍",
    emergencyContact: { name: "山田 美智子", relation: "母", phone: "090-1111-2222" },
    availability: {
      mon: [true, true, true], tue: [true, true, true], wed: [false, false, false],
      thu: [true, true, true], fri: [true, true, true], sat: [true, true, true], sun: [true, true, false],
    },
    certifications: [
      { name: "サービス接遇検定1級", date: "2021-11-15" },
      { name: "食品衛生責任者", date: "2019-08-20" },
    ],
  },
  {
    id: "5",
    name: "伊藤 美咲",
    nameKana: "いとう みさき",
    avatar: "/placeholder.svg?height=40&width=40",
    store: "キリンシティプラス横浜ベイクォーター店",
    position: "ホール",
    role: "スタッフ",
    detailRole: "ホールスタッフ",
    employmentType: "アルバイト",
    simpleSkills: ["接客", "レジ"],
    skills: [
      { name: "接客", level: 70, experience: "1年間の接客経験。笑顔での対応が得意。" },
      { name: "レジ", level: 60, experience: "基本的なPOS操作が可能。会計処理を担当。" },
    ],
    schedule: "シフト制",
    phone: "090-5678-9012",
    email: "m.ito@example.com",
    joinDate: "2023-03-15",
    hourlyRate: 1100,
    address: "神奈川県横浜市青葉区青葉台5-5",
    birthday: "2003-07-14",
    notes: "大学生。明るい性格で職場の雰囲気作りに貢献。接客スキル向上中。",
    status: "在籍",
    availability: {
      mon: [false, true, false], tue: [false, false, true], wed: [false, true, false],
      thu: [false, false, false], fri: [false, true, true], sat: [true, true, true], sun: [true, true, false],
    },
  },
  {
    id: "6",
    name: "渡辺 直樹",
    nameKana: "わたなべ なおき",
    avatar: "/placeholder.svg?height=40&width=40",
    store: "キリンシティプラス横浜ベイクォーター店",
    position: "キッチン",
    role: "チーフ",
    detailRole: "キッチンチーフ",
    employmentType: "正社員",
    simpleSkills: ["調理", "メニュー開発", "在庫管理", "衛生管理"],
    skills: [
      { name: "調理", level: 95, certifications: ["調理師免許"], experience: "12年間の調理経験。ビアホール料理のスペシャリスト。" },
      { name: "メニュー開発", level: 88, experience: "季節限定メニューの企画・開発を担当。年4回の新メニュー提案。" },
      { name: "在庫管理", level: 82, experience: "食材ロス率を前年比15%削減した実績あり。" },
      { name: "衛生管理", level: 90, certifications: ["食品衛生管理者"], experience: "HACCP導入プロジェクトのキッチン担当。" },
    ],
    schedule: "通し",
    phone: "090-6789-0123",
    email: "n.watanabe@example.com",
    joinDate: "2018-09-01",
    address: "神奈川県横浜市鶴見区鶴見中央6-6",
    birthday: "1982-11-03",
    notes: "キッチンのリーダーとして新人教育にも積極的。ドイツ料理の研究が趣味。",
    status: "在籍",
    emergencyContact: { name: "渡辺 由美", relation: "配偶者", phone: "090-3333-4444" },
    availability: {
      mon: [true, true, true], tue: [true, true, true], wed: [true, true, true],
      thu: [true, true, true], fri: [true, true, true], sat: [true, true, false], sun: [false, false, false],
    },
    certifications: [
      { name: "調理師免許", date: "2010-03-15" },
      { name: "食品衛生管理者", date: "2019-06-20" },
    ],
  },
  {
    id: "7",
    name: "高橋 美咲",
    nameKana: "たかはし みさき",
    avatar: "/placeholder.svg?height=40&width=40",
    store: "キリンシティ 横浜モアーズ店",
    position: "キッチン",
    role: "スタッフ",
    detailRole: "キッチンスタッフ",
    employmentType: "パート",
    simpleSkills: ["調理", "盛り付け"],
    skills: [
      { name: "調理", level: 72, experience: "3年間の飲食店調理経験。揚げ物・焼き物が得意。" },
      { name: "盛り付け", level: 80, experience: "美しい盛り付けに定評あり。SNS映えする料理の提供が可能。" },
    ],
    schedule: "早番",
    phone: "090-7890-1234",
    email: "m.takahashi@example.com",
    joinDate: "2022-01-10",
    hourlyRate: 1150,
    address: "神奈川県横浜市中区桜木町7-7",
    birthday: "1990-04-25",
    notes: "モアーズ店のキッチン主力メンバー。盛り付けセンスが高く評価されている。",
    status: "在籍",
    availability: {
      mon: [true, true, false], tue: [true, true, false], wed: [false, false, false],
      thu: [true, true, false], fri: [true, true, false], sat: [true, true, true], sun: [false, false, false],
    },
  },
  {
    id: "8",
    name: "中村 翔太",
    nameKana: "なかむら しょうた",
    avatar: "/placeholder.svg?height=40&width=40",
    store: "キリンシティ 横浜モアーズ店",
    position: "両方",
    role: "スタッフ",
    detailRole: "フロア兼キッチンスタッフ",
    employmentType: "アルバイト",
    simpleSkills: ["接客", "調理補助", "清掃"],
    skills: [
      { name: "接客", level: 65, experience: "1年間のホール経験。素早い配膳が評価されている。" },
      { name: "調理補助", level: 55, experience: "キッチンヘルプとして仕込み作業を担当。" },
      { name: "清掃", level: 75, experience: "閉店後の清掃業務を効率的にこなす。" },
    ],
    schedule: "シフト制",
    phone: "090-8901-2345",
    email: "s.nakamura@example.com",
    joinDate: "2023-06-01",
    hourlyRate: 1100,
    address: "神奈川県横浜市戸塚区戸塚町8-8",
    birthday: "2002-09-10",
    notes: "大学3年生。ホールとキッチン両方をこなせるマルチプレイヤー。将来は飲食業界での起業を目指している。",
    status: "在籍",
    availability: {
      mon: [false, false, true], tue: [false, true, true], wed: [false, false, true],
      thu: [false, true, true], fri: [false, false, true], sat: [true, true, true], sun: [true, true, true],
    },
  },
]

export function getStaffById(id: string): StaffDetailMember | undefined {
  return ALL_STAFF.find((s) => s.id === id)
}

// Color utility functions
export const getSkillColor = (skill: string): string => {
  const skillColors: Record<string, string> = {
    "調理": "bg-orange-100 text-orange-800",
    "接客": "bg-blue-100 text-blue-800",
    "マネジメント": "bg-purple-100 text-purple-800",
    "レジ": "bg-green-100 text-green-800",
    "ドリンク": "bg-cyan-100 text-cyan-800",
    "調理補助": "bg-amber-100 text-amber-800",
    "食器洗浄": "bg-gray-100 text-gray-800",
    "仕込み": "bg-yellow-100 text-yellow-800",
    "クレーム対応": "bg-red-100 text-red-800",
    "予約管理": "bg-indigo-100 text-indigo-800",
    "メニュー開発": "bg-pink-100 text-pink-800",
    "在庫管理": "bg-teal-100 text-teal-800",
    "衛生管理": "bg-lime-100 text-lime-800",
    "発注管理": "bg-violet-100 text-violet-800",
    "盛り付け": "bg-rose-100 text-rose-800",
    "清掃": "bg-slate-100 text-slate-800",
    "ドリンク作成": "bg-cyan-100 text-cyan-800",
  }
  return skillColors[skill] || "bg-gray-100 text-gray-800"
}

export const getPositionColor = (position: string): string => {
  switch (position) {
    case "ホール": return "bg-blue-100 text-blue-800 border-blue-300"
    case "キッチン": return "bg-emerald-100 text-emerald-800 border-emerald-300"
    case "両方": return "bg-purple-100 text-purple-800 border-purple-300"
    default: return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

export const getRoleColor = (role: string): string => {
  switch (role) {
    case "店長": return "bg-red-100 text-red-800"
    case "マネージャー": return "bg-orange-100 text-orange-800"
    case "チーフ": return "bg-yellow-100 text-yellow-800"
    case "スタッフ": return "bg-gray-100 text-gray-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export const getEmploymentColor = (type: string): string => {
  switch (type) {
    case "正社員": return "bg-indigo-100 text-indigo-800"
    case "パート": return "bg-cyan-100 text-cyan-800"
    case "アルバイト": return "bg-teal-100 text-teal-800"
    default: return "bg-gray-100 text-gray-800"
  }
}
