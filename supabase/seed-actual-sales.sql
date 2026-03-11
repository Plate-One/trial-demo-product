-- seed-actual-sales.sql
-- 5店舗 × 約86日 × 12時間 = 約5,160行の時間帯別売上実績データを生成
-- 2025-12-15 ~ 2026-03-10, 11:00-22:00

-- 既存データをクリア（期間内）
DELETE FROM actual_sales
WHERE date >= '2025-12-15' AND date <= '2026-03-10';

INSERT INTO actual_sales (store_id, date, hour, customers, sales, day_type)
SELECT
  s.store_id,
  d.date,
  h.hour,
  -- customers: base_customers * store_scale * variation(0.85~1.15)
  GREATEST(1, ROUND(
    base.customers * s.scale
    * (0.85 + 0.30 * (
        (hashtext(s.store_id::text || d.date::text || h.hour::text) & x'7FFFFFFF'::int)::numeric
        / x'7FFFFFFF'::int::numeric
      ))
  ))::int AS customers,
  -- sales: customers * avg_spend * variation(0.85~1.15)
  GREATEST(1000, ROUND(
    base.customers * s.scale
    * (0.85 + 0.30 * (
        (hashtext(s.store_id::text || d.date::text || h.hour::text) & x'7FFFFFFF'::int)::numeric
        / x'7FFFFFFF'::int::numeric
      ))
    * spend.avg_spend
    * (0.85 + 0.30 * (
        (hashtext(h.hour::text || d.date::text || s.store_id::text) & x'7FFFFFFF'::int)::numeric
        / x'7FFFFFFF'::int::numeric
      ))
  ))::int AS sales,
  -- day_type
  CASE
    WHEN d.date IN (
      '2025-12-23','2025-12-31',
      '2026-01-01','2026-01-02','2026-01-03','2026-01-12',
      '2026-02-11','2026-02-23',
      '2026-03-20'
    ) THEN 'holiday'
    WHEN EXTRACT(DOW FROM d.date) = 0 THEN 'sunday'
    WHEN EXTRACT(DOW FROM d.date) = 6 THEN 'saturday'
    WHEN EXTRACT(DOW FROM d.date) = 5 THEN 'friday'
    ELSE 'weekday'
  END AS day_type
FROM
  -- stores with scale factors
  (VALUES
    ('b0000000-0000-0000-0000-000000000001'::uuid, 1.00),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 0.85),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 0.75),
    ('b0000000-0000-0000-0000-000000000004'::uuid, 0.80),
    ('b0000000-0000-0000-0000-000000000005'::uuid, 0.70)
  ) AS s(store_id, scale)
CROSS JOIN
  -- date range
  generate_series('2025-12-15'::date, '2026-03-10'::date, '1 day') AS d(date)
CROSS JOIN
  -- hours 11-22
  generate_series(11, 22) AS h(hour)
-- base customer counts by (day_type, hour)
INNER JOIN LATERAL (
  SELECT
    CASE
      -- Holiday or Weekend pattern
      WHEN d.date IN (
        '2025-12-23','2025-12-31',
        '2026-01-01','2026-01-02','2026-01-03','2026-01-12',
        '2026-02-11','2026-02-23',
        '2026-03-20'
      )
      OR EXTRACT(DOW FROM d.date) IN (0, 6) THEN
        CASE h.hour
          WHEN 11 THEN 18 WHEN 12 THEN 35 WHEN 13 THEN 32
          WHEN 14 THEN 22 WHEN 15 THEN 15 WHEN 16 THEN 12
          WHEN 17 THEN 20 WHEN 18 THEN 30 WHEN 19 THEN 30
          WHEN 20 THEN 22 WHEN 21 THEN 12 WHEN 22 THEN 7
        END
      -- Friday
      WHEN EXTRACT(DOW FROM d.date) = 5 THEN
        CASE h.hour
          WHEN 11 THEN 12 WHEN 12 THEN 25 WHEN 13 THEN 15
          WHEN 14 THEN 8  WHEN 15 THEN 5  WHEN 16 THEN 5
          WHEN 17 THEN 15 WHEN 18 THEN 28 WHEN 19 THEN 28
          WHEN 20 THEN 16 WHEN 21 THEN 8  WHEN 22 THEN 5
        END
      -- Weekday (Mon-Thu)
      ELSE
        CASE h.hour
          WHEN 11 THEN 8  WHEN 12 THEN 18 WHEN 13 THEN 12
          WHEN 14 THEN 6  WHEN 15 THEN 3  WHEN 16 THEN 3
          WHEN 17 THEN 6  WHEN 18 THEN 12 WHEN 19 THEN 12
          WHEN 20 THEN 8  WHEN 21 THEN 5  WHEN 22 THEN 2
        END
    END AS customers
) AS base ON true
-- avg spend per hour
INNER JOIN LATERAL (
  SELECT
    CASE h.hour
      WHEN 11 THEN 2200 WHEN 12 THEN 1900 WHEN 13 THEN 2100
      WHEN 14 THEN 2000 WHEN 15 THEN 1800 WHEN 16 THEN 2200
      WHEN 17 THEN 3200 WHEN 18 THEN 3800 WHEN 19 THEN 4200
      WHEN 20 THEN 4400 WHEN 21 THEN 3600 WHEN 22 THEN 3000
    END AS avg_spend
) AS spend ON true
ON CONFLICT (store_id, date, hour) DO UPDATE SET
  customers = EXCLUDED.customers,
  sales = EXCLUDED.sales,
  day_type = EXCLUDED.day_type;
