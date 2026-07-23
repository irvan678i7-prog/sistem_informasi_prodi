-- CreateTable
CREATE TABLE "SeminarBerkas" (
    "id" TEXT NOT NULL,
    "tesisId" TEXT NOT NULL,
    "item" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeminarBerkas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeminarBerkas_tesisId_item_key" ON "SeminarBerkas"("tesisId", "item");

-- AddForeignKey
ALTER TABLE "SeminarBerkas" ADD CONSTRAINT "SeminarBerkas_tesisId_fkey" FOREIGN KEY ("tesisId") REFERENCES "Tesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
