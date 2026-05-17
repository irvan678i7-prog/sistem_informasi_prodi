import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding…");

  // 1) Prodi sample
  const prodi = await prisma.prodi.upsert({
    where: { code: "MMP" },
    update: {},
    create: {
      code: "MMP",
      name: "Magister Manajemen Pendidikan",
      jenjang: "S2",
    },
  });

  // 2) Admin Sistem
  const adminPwd = await hash("admin12345");
  const admin = await prisma.user.upsert({
    where: { email: "admin@ummetro.ac.id" },
    update: {},
    create: {
      email: "admin@ummetro.ac.id",
      nimNip: "ADM-0001",
      name: "Administrator Sistem",
      hashedPassword: adminPwd,
      role: "ADMIN_SISTEM",
    },
  });

  // 3) Direktur
  const direkturPwd = await hash("direktur12345");
  await prisma.user.upsert({
    where: { email: "direktur@ummetro.ac.id" },
    update: {},
    create: {
      email: "direktur@ummetro.ac.id",
      nimNip: "0023056803",
      name: "Direktur Pascasarjana",
      hashedPassword: direkturPwd,
      role: "DIREKTUR",
    },
  });

  // 4) Kaprodi
  const kaprodiPwd = await hash("kaprodi12345");
  const kaprodi = await prisma.user.upsert({
    where: { email: "kaprodi.mmp@ummetro.ac.id" },
    update: {},
    create: {
      email: "kaprodi.mmp@ummetro.ac.id",
      nimNip: "0011017001",
      name: "Dr. Kaprodi MMP",
      hashedPassword: kaprodiPwd,
      role: "KAPRODI",
      prodiId: prodi.id,
      dosenProfile: { create: { nidn: "0011017001" } },
    },
  });
  await prisma.prodi.update({
    where: { id: prodi.id },
    data: { kaprodiId: kaprodi.id },
  });

  // 5) Dosen sample
  const dosenPwd = await hash("dosen12345");
  const dosen1 = await prisma.user.upsert({
    where: { email: "dosen1@ummetro.ac.id" },
    update: {},
    create: {
      email: "dosen1@ummetro.ac.id",
      nimNip: "0022027102",
      name: "Dr. Budi Santoso",
      hashedPassword: dosenPwd,
      role: "DOSEN",
      prodiId: prodi.id,
      dosenProfile: { create: { nidn: "0022027102" } },
    },
  });
  await prisma.user.upsert({
    where: { email: "dosen2@ummetro.ac.id" },
    update: {},
    create: {
      email: "dosen2@ummetro.ac.id",
      nimNip: "0033037203",
      name: "Dr. Siti Aminah",
      hashedPassword: dosenPwd,
      role: "DOSEN",
      prodiId: prodi.id,
      dosenProfile: { create: { nidn: "0033037203" } },
    },
  });

  // 6) Mahasiswa sample
  const mhsPwd = await hash("mahasiswa12345");
  const mhs = await prisma.user.upsert({
    where: { email: "mhs1@ummetro.ac.id" },
    update: {},
    create: {
      email: "mhs1@ummetro.ac.id",
      nimNip: "24010001",
      name: "Andi Pratama",
      hashedPassword: mhsPwd,
      role: "MAHASISWA",
      prodiId: prodi.id,
      mahasiswaProfile: {
        create: {
          angkatan: new Date().getFullYear(),
          semester: 3,
          paId: dosen1.id,
        },
      },
    },
  });
  await prisma.tesis.upsert({
    where: { mahasiswaId: mhs.id },
    update: {},
    create: { mahasiswaId: mhs.id, paId: dosen1.id },
  });

  // 7) App settings default
  const defaults: Record<string, string> = {
    "institusi.namaPascasarjana": "Program Pascasarjana UM Metro",
    "institusi.alamat": "Jl. Ki Hajar Dewantara No. 116, Iringmulyo, Metro",
    "institusi.telp": "(0725) 42445",
    "institusi.email": "pps@ummetro.ac.id",
    "institusi.website": "https://pps.ummetro.ac.id",
    "ttd.direktur.name": "Direktur Pascasarjana",
    "ttd.direktur.nidn": "0023056803",
    "ttd.wadir.name": "Wakil Direktur",
    "ttd.wadir.nidn": "0011057002",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  console.log("Done. Login credentials:");
  console.log("  Admin Sistem : admin@ummetro.ac.id / admin12345");
  console.log("  Direktur     : direktur@ummetro.ac.id / direktur12345");
  console.log("  Kaprodi MMP  : kaprodi.mmp@ummetro.ac.id / kaprodi12345");
  console.log("  Dosen 1      : dosen1@ummetro.ac.id / dosen12345");
  console.log("  Mahasiswa 1  : mhs1@ummetro.ac.id / mahasiswa12345");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
