export interface StoreInfo {
  id: string
  name: string
  shortName: string
}

export const STORES: StoreInfo[] = [
  { id: "bayquarter", name: "キリンシティプラス横浜ベイクォーター店", shortName: "ベイクォーター店" },
  { id: "mores", name: "キリンシティ 横浜モアーズ店", shortName: "モアーズ店" },
  { id: "fti", name: "キリンシティ FOOD＆TIME ISETAN YOKOHAMA店", shortName: "FTI横浜店" },
  { id: "cial", name: "キリンシティ CIAL桜木町店", shortName: "CIAL桜木町店" },
  { id: "machida", name: "キリンシティ 町田店", shortName: "町田店" },
]

export function getStoreById(id: string): StoreInfo | undefined {
  return STORES.find((s) => s.id === id)
}

export function getStoreByName(name: string): StoreInfo | undefined {
  return STORES.find((s) => s.name === name)
}
