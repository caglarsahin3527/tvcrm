-- ==============================================================================
-- TVCRM SUPABASE / POSTGRESQL ROW LEVEL SECURITY (RLS) & ACCESS CONTROL SCRIPT
-- ==============================================================================
-- Bu SQL scripti Supabase ve PostgreSQL üzerinde doğrudan REST API (PostgREST)
-- üzerinden yetkisiz veri okunması, değiştirilmesi veya silinmesini engellemek
-- için tasarlanmıştır.
-- 
-- Tüm tablolar için RLS aktif edilir ve halka açık anon / authenticated Supabase
-- rollerinin doğrudan erişimi kapatılarak yetkilendirme güvenli Next.js backend
-- API & Prisma ORM katmanına kilitlenir.
-- ==============================================================================

-- 1. TABLOLAR İÇİN ROW LEVEL SECURITY (RLS) ETKİNLEŞTİRME
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WorkReport" ENABLE ROW LEVEL SECURITY;

-- Güvenlik politikalarını temizle (Varsa eski politikalar)
DROP POLICY IF EXISTS "Block anon direct read on User" ON "User";
DROP POLICY IF EXISTS "Block anon direct write on User" ON "User";
DROP POLICY IF EXISTS "Block anon direct read on Client" ON "Client";
DROP POLICY IF EXISTS "Block anon direct write on Client" ON "Client";
DROP POLICY IF EXISTS "Block anon direct read on Deal" ON "Deal";
DROP POLICY IF EXISTS "Block anon direct write on Deal" ON "Deal";
DROP POLICY IF EXISTS "Block anon direct read on WorkReport" ON "WorkReport";
DROP POLICY IF EXISTS "Block anon direct write on WorkReport" ON "WorkReport";

-- Supabase Service Role / Postgres Süper Kullanıcısı için tam yetki (Backend Bağlantısı)
DROP POLICY IF EXISTS "Allow service role full access User" ON "User";
CREATE POLICY "Allow service role full access User" ON "User"
  FOR ALL
  TO service_role, postgres
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access Client" ON "Client";
CREATE POLICY "Allow service role full access Client" ON "Client"
  FOR ALL
  TO service_role, postgres
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access Deal" ON "Deal";
CREATE POLICY "Allow service role full access Deal" ON "Deal"
  FOR ALL
  TO service_role, postgres
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access WorkReport" ON "WorkReport";
CREATE POLICY "Allow service role full access WorkReport" ON "WorkReport"
  FOR ALL
  TO service_role, postgres
  USING (true)
  WITH CHECK (true);

-- 2. SUPABASE REST ENDPOINTLERİ İÇİN ANON VE AUTHENTICATED ROLLERİNDEN TÜM YETKİLERİ KALDIRMA
-- (Bu işlem Supabase public API anahtarıyla dışarıdan doğrudan tablo sorgulanmasını tamamen engeller)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "User" FROM anon;
    REVOKE ALL ON TABLE "Client" FROM anon;
    REVOKE ALL ON TABLE "Deal" FROM anon;
    REVOKE ALL ON TABLE "WorkReport" FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "User" FROM authenticated;
    REVOKE ALL ON TABLE "Client" FROM authenticated;
    REVOKE ALL ON TABLE "Deal" FROM authenticated;
    REVOKE ALL ON TABLE "WorkReport" FROM authenticated;
  END IF;
END $$;

-- 3. GÜVENLİ VE HIZLI VERİTABANI İNDEKSLERİ (Gerektiğinde oluşturulur)
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_client_satis_temsilcisi" ON "Client"("satis_temsilcisi_id");
CREATE INDEX IF NOT EXISTS "idx_deal_musteri_id" ON "Deal"("musteri_id");
CREATE INDEX IF NOT EXISTS "idx_deal_asama" ON "Deal"("asama");
CREATE INDEX IF NOT EXISTS "idx_workreport_user_id" ON "WorkReport"("user_id");
CREATE INDEX IF NOT EXISTS "idx_workreport_tarih" ON "WorkReport"("tarih");
