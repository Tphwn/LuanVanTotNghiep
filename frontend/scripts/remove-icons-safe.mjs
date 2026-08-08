import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../src');
const UI_DIRS = ['pages', 'layouts', 'components'].map((d) => path.join(SRC, d));

const EMOJI = /\p{Extended_Pictographic}[\p{Extended_Pictographic}\uFE0F\u200D]*/gu;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.jsx$/.test(ent.name)) files.push(p);
  }
  return files;
}

function clean(content) {
  let c = content;

  c = c.replace(/`\$\{"⭐"\.repeat\(([^)]+)\)\}`/g, '`${$1} sao`');
  c = c.replace(/`\$\{"⭐"\.repeat\(([^)]+)\)\} \(\$\{([^}]+)\}\)`/g, '`${$1} sao ($2)`');

  // Icon-only action buttons
  c = c.replace(/(title="[^"]+")>\s*[\p{Extended_Pictographic}\uFE0F]+/gu, '$1>$1'.replace(/title="([^"]+)"/, (_, t) => t));
  // Fix the above - simpler approach:
  c = c.replace(/title="Duyệt">✅/g, 'title="Duyệt">Duyệt');
  c = c.replace(/title="Yêu cầu sửa">📝/g, 'title="Yêu cầu sửa">Yêu cầu sửa');
  c = c.replace(/title="Từ chối">❌/g, 'title="Từ chối">Từ chối');
  c = c.replace(/title="Khóa">🔒/g, 'title="Khóa">Khóa');
  c = c.replace(/title="Mở khóa">🔓/g, 'title="Mở khóa">Mở khóa');

  // Nav/menu icon property
  c = c.replace(/\{\s*icon:\s*'[^']*',\s*/g, '{ ');
  c = c.replace(/\{\s*icon:\s*"[^"]*",\s*/g, '{ ');

  // Stat/card icon property in objects
  c = c.replace(/,\s*icon:\s*"[^"]*"/g, '');
  c = c.replace(/,\s*icon:\s*'[^']*'/g, '');

  // LOAI maps with icon key
  c = c.replace(/,\s*icon:\s*"[^"]*"/g, '');

  // Remove structural icon UI
  c = c.replace(/<span className="menu-icon">\{item\.icon\}<\/span>\s*/g, '');
  c = c.replace(/<div className="brand-icon">[^<]*<\/div>\s*/g, '');
  c = c.replace(/<div className="empty-state-icon">[^<]*<\/div>\s*/g, '');
  c = c.replace(/<div className="empty-state-icon">\{emptyIcon\}<\/div>\s*/g, '');
  c = c.replace(/<span>\{s\.icon\}<\/span>\s*/g, '');
  c = c.replace(/<span>\{t\.icon\}<\/span>\s*/g, '');
  c = c.replace(/\{loai\.icon\}\s*/g, '');
  c = c.replace(/\{v\.icon\}\s*/g, '');
  c = c.replace(/<div style=\{\{ fontSize: 20, marginBottom: 4 \}\}>\{icon\}<\/div>\s*/g, '');
  c = c.replace(/\{getAmenityIcon\([^)]*\)\}\s*/g, '');
  c = c.replace(/<span className="contact-icon">[^<]*<\/span>\s*/g, '');

  // Placeholder thumb without emoji
  c = c.replace(
    /<div style=\{\{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 \}\}>🏨<\/div>/g,
    '<div style={{ width: "100%", height: "100%", background: "#e8f5f1" }} />',
  );
  c = c.replace(
    /<div style=\{\{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 \}\}>🛏️<\/div>/g,
    '<div style={{ width: "100%", height: "100%", background: "#e8f5f1" }} />',
  );

  // Strip remaining emojis from text
  c = c.replace(EMOJI, '');

  // Clean double spaces in common label patterns
  c = c.replace(/"\s+([^"]+)"/g, (_, t) => `"${t.trim()}"`);
  c = c.replace(/'\s+([^']+)'/g, (_, t) => `'${t.trim()}'`);

  return c;
}

const files = UI_DIRS.flatMap((d) => walk(d));
let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const next = clean(original);
  if (next !== original) {
    fs.writeFileSync(file, next);
    changed++;
  }
}
console.log(`Updated ${changed} JSX files in pages/layouts/components.`);
