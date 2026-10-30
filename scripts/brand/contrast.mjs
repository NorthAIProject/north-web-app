// WCAG contrast of the theme's text and control pairs, both modes:
//   node scripts/brand/contrast.mjs src/lib/styles/app.css
import { readFileSync } from 'node:fs';
import { parse, contrast } from './color.mjs';
const css = readFileSync(process.argv[2], 'utf8');
const block = (sel) => { const m = css.match(new RegExp(sel.replace('.', '\\.') + '\\s*\\{([\\s\\S]*?)\\n\\}')); const body = m[1].replace(/\/\*[\s\S]*?\*\//g, ''); return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()])); };
const resolve = (t, n) => { let v = t[n]; while (v && v.startsWith('var(')) v = t[v.slice(6, -1)]; return v; };
const pairs = [['foreground','background','text'],['foreground','card','text'],['muted-foreground','background','text'],['muted-foreground','card','text'],['muted-foreground','muted','text'],
 ['primary-foreground','primary','text'],['north-signal-foreground','north-signal','text'],['north-signal','background','text'],['north-signal','card','text'],
 ['north-agent','card','text'],['north-ember','card','text'],['destructive','card','text'],['input','card','ui'],['ring','background','ui'],
 ['muse-user-text','muse-user-bubble','text'],['sidebar-primary','sidebar','ui']];
for (const [mode, sel] of [['light', ':root'], ['dark', '.dark']]) {
  const t = { ...block(':root'), ...(sel === '.dark' ? block('.dark') : {}) };
  console.log(`\n${mode}`);
  for (const [fg, bg, kind] of pairs) {
    const a = resolve(t, fg), b = resolve(t, bg);
    if (!a || !b || a.includes('/') || b.includes('/')) { console.log(`  ${fg} on ${bg}: skipped (alpha)`); continue; }
    const r = contrast(parse(a), parse(b)); const need = kind === 'text' ? 4.5 : 3;
    console.log(`  ${(fg + ' on ' + bg).padEnd(52)} ${r.toFixed(2)}:1 ${r >= need ? 'pass' : 'FAIL'} (${kind} ≥${need})`);
  }
}
