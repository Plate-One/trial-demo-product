// Color utility functions for staff/skill badges

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
