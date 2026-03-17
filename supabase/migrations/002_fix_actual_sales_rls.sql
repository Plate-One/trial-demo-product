-- actual_sales テーブルのRLSポリシーを再作成
-- このマイグレーションは、actual_salesテーブルにRLSポリシーが存在しない場合に適用してください
-- Supabase Dashboard → SQL Editor で実行

-- 既存のポリシーを安全に削除（存在しない場合はスキップ）
DROP POLICY IF EXISTS "actual_sales_select" ON actual_sales;
DROP POLICY IF EXISTS "actual_sales_insert" ON actual_sales;
DROP POLICY IF EXISTS "actual_sales_update" ON actual_sales;
DROP POLICY IF EXISTS "actual_sales_delete" ON actual_sales;

-- RLSを有効化（既に有効な場合は何もしない）
ALTER TABLE actual_sales ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 同じ組織のデータのみアクセス可能
CREATE POLICY "actual_sales_select" ON actual_sales FOR SELECT USING (
  store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id())
);
CREATE POLICY "actual_sales_insert" ON actual_sales FOR INSERT WITH CHECK (
  store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id())
);
CREATE POLICY "actual_sales_update" ON actual_sales FOR UPDATE USING (
  store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id())
);
CREATE POLICY "actual_sales_delete" ON actual_sales FOR DELETE USING (
  store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id())
);
