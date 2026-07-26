const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CODES = [
  'RIVER80K', 'RIVER120K', 'RIVER150K', 'RIVER200K',
  'CANARY30K', 'CANARY50K', 'CANARY70K', 'CANARY100K',
  'SEASIDE100K', 'SEASIDE150K', 'SEASIDE200K', 'SEASIDE300K',
  'PALACE80K', 'PALACE120K', 'PALACE150K', 'PALACE200K',
  'SUNRISE70K', 'SUNRISE100K', 'SUNRISE150K', 'SUNRISE200K',
  'LARITA50K', 'LARITA80K', 'LARITA100K', 'LARITA150K',
  'LUXE50K', 'LUXE80K', 'LUXE120K', 'LUXE150K',
  'MILAN50K', 'MILAN80K', 'MILAN100K', 'MILAN150K',
  'SIM15', 'SIM20', 'SIM25', 'SIM35',
  'MOMENT15', 'MOMENT20', 'MOMENT25', 'MOMENT30',
  'SUNHILL15', 'SUNHILL20', 'SUNHILL25', 'SUNHILL30',
  'HANA30K', 'HANA50K', 'HANA70K', 'HANA100K',
  'BEE30K', 'BEE50K', 'BEE70K', 'BEE100K',
  'VMT50K', 'VMT80K', 'VMT100K', 'VMT150K',
  'PEACE50K', 'PEACE80K', 'PEACE100K', 'PEACE150K',
  'SALA15', 'SALA20', 'SALA25', 'SALA35',
  'ODIN15', 'ODIN20', 'ODIN25', 'ODIN30',
  'FLC15', 'FLC20', 'FLC25', 'FLC40',
  'FLEUR15', 'FLEUR20', 'FLEUR25', 'FLEUR30',
  'LAMOR15', 'LAMOR20', 'LAMOR25', 'LAMOR35',
];

async function main() {
  const rows = await prisma.khuyen_mai.findMany({
    where: { ma_code: { in: CODES } },
    select: { ma_khuyen_mai: true, ma_code: true },
    orderBy: { ma_khuyen_mai: 'asc' },
  });

  const updates = rows.map((row, index) => {
    const limit = 1 + (index % 10);
    return prisma.khuyen_mai.update({
      where: { ma_khuyen_mai: row.ma_khuyen_mai },
      data: { so_luot_toi_da: limit },
    });
  });

  await Promise.all(updates);

  const sample = await prisma.khuyen_mai.findMany({
    where: { ma_code: { in: CODES } },
    select: { ma_code: true, so_luot_toi_da: true },
    orderBy: { ma_khuyen_mai: 'asc' },
  });
  const vals = sample.map((s) => s.so_luot_toi_da);
  console.log(`Đã cập nhật ${sample.length} KM. Lượt dùng: min=${Math.min(...vals)}, max=${Math.max(...vals)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
