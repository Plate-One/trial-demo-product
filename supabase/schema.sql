-- ============================================
-- Trial Demo Product - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (multi-tenant root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  address TEXT,
  seat_count INTEGER DEFAULT 60,
  operating_hour_start INTEGER DEFAULT 11,
  operating_hour_end INTEGER DEFAULT 22,
  hourly_wage_hall INTEGER DEFAULT 1150,
  hourly_wage_kitchen INTEGER DEFAULT 1200,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- 3. Staff
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_kana TEXT NOT NULL,
  avatar_url TEXT,
  position TEXT NOT NULL CHECK (position IN ('ホール', 'キッチン', '両方')),
  role TEXT NOT NULL CHECK (role IN ('店長', 'マネージャー', 'チーフ', 'スタッフ')),
  detail_role TEXT,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('正社員', 'パート', 'アルバイト')),
  schedule_type TEXT CHECK (schedule_type IN ('早番', '遅番', '通し', 'シフト制')),
  phone TEXT,
  email TEXT NOT NULL,
  join_date DATE,
  hourly_rate INTEGER,
  address TEXT,
  birthday DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT '在籍' CHECK (status IN ('在籍', '休職', '退職')),
  emergency_contact JSONB,
  availability JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Staff Skills
CREATE TABLE staff_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  experience TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, name)
);

-- 5. Staff Certifications
CREATE TABLE staff_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  obtained_date DATE,
  expires_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Shift Periods
CREATE TABLE shift_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'collecting', 'optimized', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, period_start)
);

-- 7. Shift Requests (staff availability submissions)
CREATE TABLE shift_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_period_id UUID NOT NULL REFERENCES shift_periods(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('休暇希望', '出勤希望')),
  submitted_at TIMESTAMPTZ,
  requested_days_off INTEGER[],
  available_days JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shift_period_id, staff_id)
);

-- 8. Shifts (actual assignments)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  shift_period_id UUID REFERENCES shift_periods(id) ON DELETE SET NULL,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ホール', 'キッチン')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'optimized', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shifts_store_date ON shifts(store_id, date);
CREATE INDEX idx_shifts_staff_date ON shifts(staff_id, date);

-- 9. Help Assignments
CREATE TABLE help_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shift_period_id UUID REFERENCES shift_periods(id) ON DELETE SET NULL,
  helper_staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  from_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  to_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ホール', 'キッチン')),
  travel_minutes INTEGER,
  transport_cost INTEGER,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Demand Forecasts
CREATE TABLE demand_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  forecast_customers INTEGER,
  forecast_sales INTEGER,
  hourly_data JSONB NOT NULL,
  weather JSONB,
  event TEXT,
  is_holiday BOOLEAN DEFAULT false,
  holiday_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, date)
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's organization
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.staff WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's store
CREATE OR REPLACE FUNCTION public.user_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM public.staff WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: users can view their own org
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id = public.user_org_id());

-- Stores: users can view stores in their org
CREATE POLICY "stores_select" ON stores FOR SELECT
  USING (organization_id = public.user_org_id());

-- Staff: users can view/manage staff in their org
CREATE POLICY "staff_select" ON staff FOR SELECT
  USING (organization_id = public.user_org_id());
CREATE POLICY "staff_insert" ON staff FOR INSERT
  WITH CHECK (organization_id = public.user_org_id());
CREATE POLICY "staff_update" ON staff FOR UPDATE
  USING (organization_id = public.user_org_id());
CREATE POLICY "staff_delete" ON staff FOR DELETE
  USING (organization_id = public.user_org_id());

-- Staff skills: via staff's org
CREATE POLICY "staff_skills_select" ON staff_skills FOR SELECT
  USING (staff_id IN (SELECT id FROM staff WHERE organization_id = public.user_org_id()));
CREATE POLICY "staff_skills_manage" ON staff_skills FOR ALL
  USING (staff_id IN (SELECT id FROM staff WHERE organization_id = public.user_org_id()));

-- Staff certifications: via staff's org
CREATE POLICY "staff_certs_select" ON staff_certifications FOR SELECT
  USING (staff_id IN (SELECT id FROM staff WHERE organization_id = public.user_org_id()));
CREATE POLICY "staff_certs_manage" ON staff_certifications FOR ALL
  USING (staff_id IN (SELECT id FROM staff WHERE organization_id = public.user_org_id()));

-- Shift periods: via store's org
CREATE POLICY "shift_periods_select" ON shift_periods FOR SELECT
  USING (store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id()));
CREATE POLICY "shift_periods_manage" ON shift_periods FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id()));

-- Shift requests: via shift period's store's org
CREATE POLICY "shift_requests_select" ON shift_requests FOR SELECT
  USING (shift_period_id IN (
    SELECT sp.id FROM shift_periods sp
    JOIN stores s ON sp.store_id = s.id
    WHERE s.organization_id = public.user_org_id()
  ));
CREATE POLICY "shift_requests_manage" ON shift_requests FOR ALL
  USING (shift_period_id IN (
    SELECT sp.id FROM shift_periods sp
    JOIN stores s ON sp.store_id = s.id
    WHERE s.organization_id = public.user_org_id()
  ));

-- Shifts: via store's org
CREATE POLICY "shifts_select" ON shifts FOR SELECT
  USING (store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id()));
CREATE POLICY "shifts_manage" ON shifts FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id()));

-- Help assignments: org-level
CREATE POLICY "help_select" ON help_assignments FOR SELECT
  USING (organization_id = public.user_org_id());
CREATE POLICY "help_manage" ON help_assignments FOR ALL
  USING (organization_id = public.user_org_id());

-- Demand forecasts: via store's org
CREATE POLICY "forecasts_select" ON demand_forecasts FOR SELECT
  USING (store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id()));
CREATE POLICY "forecasts_manage" ON demand_forecasts FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE organization_id = public.user_org_id()));
