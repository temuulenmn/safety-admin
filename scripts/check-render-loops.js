#!/usr/bin/env node
// React render-мөчлөг илрүүлэгч —  npm run check:loops
//
// 2026-08-31-д useCrud хук бүх CRUD дэлгэцийг хязгааргүй давталтад оруулж,
// production дээр минутанд мянга мянган хүсэлт үүсгэсэн. Шалтгаан нь
// дуудагч тал `list: (p) => api.getX(p)` гэж МӨРӨНД нь бичдэг тул render
// бүрд шинэ функц үүсч, түүнийг useCallback-ийн хамаарал болгосон явдал.
//
// Энэ скрипт тэр ангиллын алдааг CI/commit-ийн өмнө барина.
//
// Гол шалтгаан: useEffect/useCallback-ийн хамаарлын жагсаалтад render бүрд
// ШИНЭ ишлэл үүсгэдэг утга (сум функц, объект/массив литерал, шинэ Date/dayjs)
// орвол эффект тасралтгүй дахин ажиллана.
const fs = require('fs'), path = require('path');

const roots = ['src/views', 'src/hooks', 'src/layout', 'src/components'];
const files = [];
const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) {
  const p = path.join(d, f.name);
  if (f.isDirectory()) walk(p); else if (f.name.endsWith('.js')) files.push(p);
} };
roots.forEach(r => fs.existsSync(r) && walk(r));

const findings = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');

  // Компонент дотор тогтворгүй ишлэлтэй болж буй хувьсагчид
  const unstable = new Set();
  const reDecl = /^\s*const\s+(\w+)\s*=\s*(\([^)]*\)\s*=>|function\b|\{|\[|new\s+\w+|dayjs\()/;
  lines.forEach(l => { const m = l.match(reDecl);
    if (m && !/useCallback|useMemo|useRef|useState|Form\.useForm|useSelector/.test(l)) unstable.add(m[1]); });

  // Custom hook-ийн destructured параметрүүд — дуудагч тал бүр render-т
  // шинэ функц дамжуулдаг тул эдгээр нь мөн тогтворгүй.
  const sig = src.match(/export function use\w+\(\{([\s\S]*?)\}\s*=\s*\{\}\s*\)/);
  if (sig) for (const line of sig[1].split('\n')) {
    const m = line.match(/^\s*(\w+)\s*([,=])(.*)$/);
    if (!m) continue;
    const [, name, op, rest] = m;
    // Примитив анхдагчтай параметр тогтвортой (pageSize = 25, autoLoad = true).
    // Функц/объект утгатай эсвэл анхдагчгүй нь тогтворгүй.
    const primitiveDefault = op === '=' && /^\s*(\d+|true|false|'[^']*'|"[^"]*"|null)\s*,?\s*(\/\/.*)?$/.test(rest);
    if (!primitiveDefault) unstable.add(name);
  }

  // Хамаарлын жагсаалтуудыг шалгана
  const reDeps = /(useEffect|useCallback|useMemo)\s*\(([\s\S]*?)\n?\s*\}?,?\s*\[([^\]]*)\]\s*\)/g;
  let m;
  while ((m = reDeps.exec(src))) {
    const hook = m[1], deps = m[3];
    const line = src.slice(0, m.index).split('\n').length;
    const bad = deps.split(',').map(d => d.trim()).filter(d => d && unstable.has(d));
    if (bad.length) findings.push({ f, line, hook, bad, deps: deps.replace(/\s+/g,' ').trim() });
  }
}
if (!findings.length) { console.log('✓ Тогтворгүй хамаарал олдсонгүй — render мөчлөгийн эрсдэл алга'); process.exit(0); }
console.log(`  ⚠ ${findings.length} эрсдэлтэй хамаарал:\n`);
for (const x of findings) {
  console.log(`  ${x.f.replace('src/','')}:${x.line}  ${x.hook}([${x.deps}])`);
  console.log(`     тогтворгүй: ${x.bad.join(', ')}`);
}
process.exit(1);
