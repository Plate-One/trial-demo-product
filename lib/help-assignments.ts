/**
 * ヘルプ一括作成で決定したアサイン（誰が・いつ・どの店にヘルプに入るか）
 * シフト一覧・ヘルプ最適化で共通利用
 */
export interface HelpAssignmentItem {
  helperId: string
  helperName: string
  fromStoreId: string
  fromStoreName: string
  toStoreId: string
  toStoreName: string
  dayIndex: number // 0=月 ... 6=日
  start: string
  end: string
  role: "ホール" | "キッチン"
  travelMinutes?: number
  transportCost?: number
}

export const HELP_ASSIGNMENTS: HelpAssignmentItem[] = [
  { helperId: "h7", helperName: "佐々木 健太", fromStoreId: "cial", fromStoreName: "CIAL桜木町店", toStoreId: "bayquarter", toStoreName: "ベイクォーター店", dayIndex: 0, start: "18:00", end: "21:00", role: "ホール", travelMinutes: 15, transportCost: 200 },
  { helperId: "h3", helperName: "松田 聡子", fromStoreId: "mores", fromStoreName: "モアーズ店", toStoreId: "bayquarter", toStoreName: "ベイクォーター店", dayIndex: 0, start: "19:00", end: "22:00", role: "キッチン", travelMinutes: 10, transportCost: 180 },
  { helperId: "h4", helperName: "吉田 美香", fromStoreId: "mores", fromStoreName: "モアーズ店", toStoreId: "bayquarter", toStoreName: "ベイクォーター店", dayIndex: 2, start: "18:00", end: "21:00", role: "ホール", travelMinutes: 10, transportCost: 180 },
  { helperId: "h5", helperName: "大西 翔平", fromStoreId: "fti", fromStoreName: "FTI横浜店", toStoreId: "bayquarter", toStoreName: "ベイクォーター店", dayIndex: 4, start: "18:00", end: "21:00", role: "ホール", travelMinutes: 12, transportCost: 180 },
  { helperId: "h9", helperName: "森本 由美", fromStoreId: "machida", fromStoreName: "町田店", toStoreId: "bayquarter", toStoreName: "ベイクォーター店", dayIndex: 5, start: "11:00", end: "14:00", role: "ホール", travelMinutes: 40, transportCost: 570 },
  { helperId: "h8", helperName: "中島 龍太", fromStoreId: "cial", fromStoreName: "CIAL桜木町店", toStoreId: "bayquarter", toStoreName: "ベイクォーター店", dayIndex: 5, start: "18:00", end: "21:00", role: "キッチン", travelMinutes: 15, transportCost: 200 },
  { helperId: "h5", helperName: "大西 翔平", fromStoreId: "fti", fromStoreName: "FTI横浜店", toStoreId: "bayquarter", toStoreName: "ベイクォーター店", dayIndex: 6, start: "11:00", end: "14:00", role: "ホール", travelMinutes: 12, transportCost: 180 },
  { helperId: "h8", helperName: "中島 龍太", fromStoreId: "cial", fromStoreName: "CIAL桜木町店", toStoreId: "bayquarter", toStoreName: "ベイクォーター店", dayIndex: 6, start: "17:00", end: "20:00", role: "キッチン", travelMinutes: 15, transportCost: 200 },
  { helperId: "h7", helperName: "佐々木 健太", fromStoreId: "cial", fromStoreName: "CIAL桜木町店", toStoreId: "mores", toStoreName: "モアーズ店", dayIndex: 0, start: "18:00", end: "21:00", role: "ホール", travelMinutes: 12, transportCost: 200 },
  { helperId: "h2", helperName: "加藤 健一", fromStoreId: "bayquarter", fromStoreName: "ベイクォーター店", toStoreId: "mores", toStoreName: "モアーズ店", dayIndex: 0, start: "19:00", end: "22:00", role: "キッチン", travelMinutes: 10, transportCost: 180 },
  { helperId: "h6", helperName: "田村 恵美", fromStoreId: "fti", fromStoreName: "FTI横浜店", toStoreId: "mores", toStoreName: "モアーズ店", dayIndex: 3, start: "18:00", end: "21:00", role: "ホール", travelMinutes: 12, transportCost: 200 },
  { helperId: "h7", helperName: "佐々木 健太", fromStoreId: "cial", fromStoreName: "CIAL桜木町店", toStoreId: "mores", toStoreName: "モアーズ店", dayIndex: 4, start: "18:00", end: "21:00", role: "ホール", travelMinutes: 12, transportCost: 200 },
  { helperId: "h1", helperName: "中村 翔太", fromStoreId: "bayquarter", fromStoreName: "ベイクォーター店", toStoreId: "mores", toStoreName: "モアーズ店", dayIndex: 5, start: "11:00", end: "14:00", role: "キッチン", travelMinutes: 10, transportCost: 180 },
  { helperId: "h10", helperName: "岡田 拓也", fromStoreId: "machida", fromStoreName: "町田店", toStoreId: "mores", toStoreName: "モアーズ店", dayIndex: 6, start: "18:00", end: "21:00", role: "キッチン", travelMinutes: 35, transportCost: 570 },
  { helperId: "h2", helperName: "加藤 健一", fromStoreId: "bayquarter", fromStoreName: "ベイクォーター店", toStoreId: "fti", toStoreName: "FTI横浜店", dayIndex: 4, start: "17:00", end: "20:00", role: "キッチン", travelMinutes: 12, transportCost: 180 },
  { helperId: "h4", helperName: "吉田 美香", fromStoreId: "mores", fromStoreName: "モアーズ店", toStoreId: "cial", toStoreName: "CIAL桜木町店", dayIndex: 5, start: "18:00", end: "21:00", role: "ホール", travelMinutes: 12, transportCost: 200 },
  { helperId: "h6", helperName: "田村 恵美", fromStoreId: "fti", fromStoreName: "FTI横浜店", toStoreId: "cial", toStoreName: "CIAL桜木町店", dayIndex: 5, start: "11:00", end: "15:00", role: "ホール", travelMinutes: 10, transportCost: 200 },
  { helperId: "h9", helperName: "森本 由美", fromStoreId: "machida", fromStoreName: "町田店", toStoreId: "cial", toStoreName: "CIAL桜木町店", dayIndex: 6, start: "11:00", end: "14:00", role: "ホール", travelMinutes: 42, transportCost: 640 },
]

/** 日付からヘルプ用 dayIndex を取得（0=月 ... 6=日）。ローカル日付で曜日を判定 */
export function getDayIndex(date: Date): number {
  const day = date.getDay() // 0=日, 1=月, ..., 6=土
  return (day + 6) % 7 // 0=月, 1=火, ..., 6=日
}

/** 指定店舗・日付のヘルプアサインを取得 */
export function getHelpAssignmentsForStoreAndDay(storeId: string, date: Date): HelpAssignmentItem[] {
  const dayIndex = getDayIndex(date)
  return HELP_ASSIGNMENTS.filter((a) => a.toStoreId === storeId && a.dayIndex === dayIndex)
}
