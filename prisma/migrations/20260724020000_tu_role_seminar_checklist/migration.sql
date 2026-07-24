-- Role baru TU (Tata Usaha) untuk cek kelengkapan berkas Seminar Proposal
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TU';

-- Kolom ceklis TU (array boolean per item berkas)
ALTER TABLE "Tesis" ADD COLUMN IF NOT EXISTS "seminarChecklist" JSONB;

-- Item 10 ("Semua persyaratan dimasukkan ke dalam Map Snail") dihapus dari
-- daftar check list; berkas lama item 10 dihapus dan item 11 digeser jadi 10.
DELETE FROM "SeminarBerkas" WHERE "item" = 10;
UPDATE "SeminarBerkas" SET "item" = 10 WHERE "item" = 11;
