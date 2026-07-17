-- Add per-reviewer approval flags to the current worksheet row.
ALTER TABLE "BimbinganArtikel"
  ADD COLUMN IF NOT EXISTS "p1Approved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "p2Approved" BOOLEAN NOT NULL DEFAULT false;

-- Keep every uploaded Word revision without replacing the historical record.
CREATE TABLE IF NOT EXISTS "BimbinganArtikelFile" (
  "id" TEXT NOT NULL,
  "tesisId" TEXT NOT NULL,
  "section" "BimbinganSection" NOT NULL,
  "revision" INTEGER NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "p1Approved" BOOLEAN NOT NULL DEFAULT false,
  "p2Approved" BOOLEAN NOT NULL DEFAULT false,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BimbinganArtikelFile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BimbinganArtikelFile_tesisId_fkey"
    FOREIGN KEY ("tesisId") REFERENCES "Tesis"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BimbinganArtikelFile_tesisId_section_idx"
  ON "BimbinganArtikelFile"("tesisId", "section");
