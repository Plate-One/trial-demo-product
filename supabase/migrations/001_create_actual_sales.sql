-- actual_sales: 時間帯別の来客・売上実績データ
CREATE TABLE IF NOT EXISTS actual_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  customers INTEGER NOT NULL DEFAULT 0,
  sales INTEGER NOT NULL DEFAULT 0,
  day_type TEXT NOT NULL DEFAULT 'weekday'
    CHECK (day_type IN ('weekday', 'friday', 'saturday', 'sunday', 'holiday')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (store_id, date, hour)
);

-- RLS
ALTER TABLE actual_sales ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 同じ組織のデータのみアクセス可能
CREATE POLICY "actual_sales_select" ON actual_sales FOR SELECT USING (
  store_id IN (SELECT id FROM stores WHERE organization_id = user_org_id())
);
CREATE POLICY "actual_sales_insert" ON actual_sales FOR INSERT WITH CHECK (
  store_id IN (SELECT id FROM stores WHERE organization_id = user_org_id())
);
CREATE POLICY "actual_sales_update" ON actual_sales FOR UPDATE USING (
  store_id IN (SELECT id FROM stores WHERE organization_id = user_org_id())
);
CREATE POLICY "actual_sales_delete" ON actual_sales FOR DELETE USING (
  store_id IN (SELECT id FROM stores WHERE organization_id = user_org_id())
);

-- インデックス
CREATE INDEX idx_actual_sales_store_date ON actual_sales(store_id, date);
CREATE INDEX idx_actual_sales_store_daytype ON actual_sales(store_id, day_type);
