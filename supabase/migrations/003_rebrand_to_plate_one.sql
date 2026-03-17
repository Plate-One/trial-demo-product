-- Rebrand: キリンシティ → Plate One
-- Run in Supabase Dashboard SQL Editor

-- 1. Organization name
UPDATE organizations
SET name = '株式会社Plate One'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 2. Store names, slugs, addresses
UPDATE stores SET
  slug = 'tokyo',
  name = 'Plate One 東京駅前店',
  short_name = '東京駅前店',
  address = '東京都千代田区丸の内1-9-1'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

UPDATE stores SET
  slug = 'shibuya',
  name = 'Plate One 渋谷店',
  short_name = '渋谷店',
  address = '東京都渋谷区道玄坂2-1-1'
WHERE id = 'b0000000-0000-0000-0000-000000000002';

UPDATE stores SET
  slug = 'shinjuku',
  name = 'Plate One 新宿店',
  short_name = '新宿店',
  address = '東京都新宿区新宿3-14-1'
WHERE id = 'b0000000-0000-0000-0000-000000000003';

UPDATE stores SET
  slug = 'ikebukuro',
  name = 'Plate One 池袋店',
  short_name = '池袋店',
  address = '東京都豊島区南池袋1-28-1'
WHERE id = 'b0000000-0000-0000-0000-000000000004';

UPDATE stores SET
  slug = 'yokohama',
  name = 'Plate One 横浜店',
  short_name = '横浜店',
  address = '神奈川県横浜市西区南幸1-3-1'
WHERE id = 'b0000000-0000-0000-0000-000000000005';
