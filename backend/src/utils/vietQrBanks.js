const VIETQR_BANKS_URL = 'https://api.vietqr.io/v2/banks';

let cachedBanks = null;
let cachedAt = 0;
const CACHE_MS = 12 * 60 * 60 * 1000; // 12h

const mapBank = (b) => ({
  id: b.id,
  code: b.code,
  bin: b.bin,
  name: b.name,
  short_name: b.shortName || b.short_name || b.name,
  logo: b.logo || null,
});

const getVietQrBanks = async () => {
  const now = Date.now();
  if (cachedBanks && (now - cachedAt) < CACHE_MS) {
    return cachedBanks;
  }

  const res = await fetch(VIETQR_BANKS_URL);
  if (!res.ok) {
    throw new Error('Không tải được danh sách ngân hàng');
  }
  const json = await res.json();
  if (json.code !== '00' || !Array.isArray(json.data)) {
    throw new Error(json.desc || 'Không tải được danh sách ngân hàng');
  }

  cachedBanks = json.data.map(mapBank);
  cachedAt = now;
  return cachedBanks;
};

const findBankByCodeOrBin = async (codeOrBin) => {
  const key = String(codeOrBin || '').trim();
  if (!key) return null;
  const banks = await getVietQrBanks();
  return banks.find((b) => b.code === key || b.bin === key) || null;
};

module.exports = {
  getVietQrBanks,
  findBankByCodeOrBin,
};
