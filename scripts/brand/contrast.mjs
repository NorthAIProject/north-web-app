// WCAG contrast of the theme's text and control pairs, both modes:
//   node scripts/brand/contrast.mjs src/lib/styles/app.css
// Exits 1 when a pair in use fails, so it can gate a theme change.
//
// A colour is a token name, optionally with an alpha and a backdrop:
//   'muted-foreground'           the token as declared (its own "/ 70%" alpha
//                                composited over the pair's background)
//   'north-day-move/20@card'     the token at 20% over --card, as Tailwind's
//                                bg-day-move/20 paints on a card
//   'white'                      literal white (text-white)
// Alpha is composited in sRGB, as the browser does, so translucent classes
// (/50 rings, /70 text, /90 hovers) are measured as drawn, not as declared.
import { readFileSync } from 'node:fs';
import { parse, contrast } from './color.mjs';

const css = readFileSync(process.argv[2], 'utf8');
const block = (sel) => {
	const m = css.match(new RegExp(sel.replace('.', '\\.') + '\\s*\\{([\\s\\S]*?)\\n\\}'));
	const body = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
	return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()]));
};
const LITERALS = { white: 'oklch(1 0 0)', black: 'oklch(0 0 0)' };

function resolve(t, name) {
	let v = LITERALS[name] ?? t[name];
	for (let i = 0; v && v.startsWith('var(') && i < 8; i++) v = t[v.slice(6, -1)];
	if (!v) throw new Error(`--${name} is not defined`);
	return v;
}

/** spec -> [r, g, b] in sRGB 0..1, translucency composited. */
function colour(t, spec, backdrop) {
	let [base, over] = spec.split('@');
	let alpha = 1;
	if (base.includes('/')) {
		const [n, a] = base.split('/');
		base = n;
		alpha = +a / 100;
	}
	const v = resolve(t, base);
	const own = v.match(/\/\s*([\d.]+)%\s*\)/);
	if (own) alpha *= +own[1] / 100;
	const rgb = parse(v);
	if (alpha >= 1) return rgb;
	const under = over ? colour(t, over) : backdrop ?? colour(t, 'background');
	return rgb.map((c, i) => c * alpha + under[i] * (1 - alpha));
}

// [label, fg, bg, kind, fgDark?, bgDark?]. kind: text 4.5:1, ui 3:1 (WCAG
// 1.4.11: control edges, focus rings, chart marks, state). An fg without its
// own @backdrop composites over the pair's bg.
const pairs = [
	['body text / background', 'foreground', 'background', 'text'],
	['body text / card', 'foreground', 'card', 'text'],
	['body text / popover', 'foreground', 'popover', 'text'],
	['body text / muted', 'foreground', 'muted', 'text'],
	['muted text / background', 'muted-foreground', 'background', 'text'],
	['muted text / card', 'muted-foreground', 'card', 'text'],
	['muted text / muted', 'muted-foreground', 'muted', 'text'],
	['muted text / sidebar', 'muted-foreground', 'sidebar', 'text'],
	['primary-fg / primary', 'primary-foreground', 'primary', 'text'],
	['signal-fg / signal (default Button)', 'north-signal-foreground', 'north-signal', 'text'],
	['signal-fg / signal-hover (Button hover)', 'north-signal-foreground', 'north-signal-hover', 'text'],
	['signal text / background', 'north-signal', 'background', 'text'],
	['signal text / card', 'north-signal', 'card', 'text'],
	['signal-text / muted (active tab)', 'north-signal-text', 'muted', 'text'],
	['signal-text / signal/12 badge on background', 'north-signal-text', 'north-signal/12@background', 'text'],
	['signal-text / signal/12 badge on card', 'north-signal-text', 'north-signal/12@card', 'text'],
	['agent text / card', 'north-agent', 'card', 'text'],
	['ember text / card', 'north-ember', 'card', 'text'],
	['destructive text / background', 'destructive', 'background', 'text'],
	['destructive text / card', 'destructive', 'card', 'text'],
	['destructive text / muted', 'destructive', 'muted', 'text'],
	['destructive/90 / card (Alert description)', 'destructive/90', 'card', 'text'],
	['destructive/90 / surface', 'destructive/90', 'north-surface', 'text'],
	['destructive/90 / background', 'destructive/90', 'background', 'text'],
	['white / destructive Button (dark: /60 on bg)', 'white', 'destructive', 'text', 'white', 'destructive/60@background'],
	['success text / background', 'north-success', 'background', 'text'],
	['success text / card', 'north-success', 'card', 'text'],
	['success text / muted', 'north-success', 'muted', 'text'],
	['success-fg / success', 'north-success-foreground', 'north-success', 'text'],
	['warning text / background', 'north-warning', 'background', 'text'],
	['warning text / card', 'north-warning', 'card', 'text'],
	['warning text / muted', 'north-warning', 'muted', 'text'],
	['warning-fg / warning', 'north-warning-foreground', 'north-warning', 'text'],
	['sidebar-fg / sidebar', 'sidebar-foreground', 'sidebar', 'text'],
	['sidebar-primary-fg / sidebar-primary', 'sidebar-primary-foreground', 'sidebar-primary', 'text'],
	['muse user text / user bubble', 'muse-user-text', 'muse-user-bubble', 'text'],
	['muted text / muse pill', 'muted-foreground', 'muse-pill', 'text'],
	// My Day tracker text: the *-text steps, never the fills.
	['day-food-text / card (BMI, Trends met)', 'north-day-food-text', 'card', 'text'],
	['day-food-text / surface', 'north-day-food-text', 'north-surface', 'text'],
	['day-fat-text / card (BMI)', 'north-day-fat-text', 'card', 'text'],
	['day-fat-text / background (landing fast label)', 'north-day-fat-text', 'background', 'text'],
	['day-fat-text / 9% fat band on surface (rail)', 'north-day-fat-text', 'north-day-fat/9@north-surface', 'text'],
	['day-move-text / card (BMI, tracker due)', 'north-day-move-text', 'card', 'text'],
	['day-move-text / move/20 chip on card (soreness)', 'north-day-move-text', 'north-day-move/20@card', 'text'],
	['day-water-text / card (BMI)', 'north-day-water-text', 'card', 'text'],
	['day-sleep-text / surface', 'north-day-sleep-text', 'north-surface', 'text'],
	['day-sleep-text / 9% sleep band on surface (rail)', 'north-day-sleep-text', 'north-day-sleep/9@north-surface', 'text'],
	['day-now-text / surface (rail time)', 'north-day-now-text', 'north-surface', 'text'],
	// Non-text: 3:1 against what they sit on.
	['input edge / card', 'input', 'card', 'ui'],
	['input edge / background', 'input', 'background', 'ui'],
	['focus ring / background', 'ring', 'background', 'ui'],
	['focus ring / card', 'ring', 'card', 'ui'],
	['sidebar-primary / sidebar', 'sidebar-primary', 'sidebar', 'ui'],
	['switch off track (input) / card', 'input', 'card', 'ui'],
	['switch off track (input) / background', 'input', 'background', 'ui'],
	['switch thumb (card) / off track', 'card', 'input', 'ui'],
	['switch thumb (card) / on track (primary)', 'card', 'primary', 'ui'],
	['switch on track (primary) / card', 'primary', 'card', 'ui'],
	['signal gauge arc / card', 'north-signal', 'card', 'ui'],
	['success mark / card', 'north-success', 'card', 'ui'],
	['warning mark / card', 'north-warning', 'card', 'ui'],
	...['water', 'food', 'protein', 'carb', 'fat', 'move', 'exercise', 'stand', 'sleep', 'caffeine', 'sun', 'screen', 'now'].flatMap(
		(k) => [
			[`day-${k} ring / surface`, `north-day-${k}`, 'north-surface', 'ui'],
			[`day-${k} ring / background`, `north-day-${k}`, 'background', 'ui']
		]
	),
	['muse agent ring / background', 'north-agent', 'background', 'ui']
];

// Composites the theme cannot carry: shown so nobody reaches for them, not
// counted as failures. Each names what to use instead.
const avoid = [
	['ring/50 focus / background → ring', 'ring/50', 'background', 'ui'],
	['muted-fg/60 / card → muted-foreground', 'muted-foreground/60', 'card', 'text'],
	['muted-fg/70 / card → muted-foreground', 'muted-foreground/70', 'card', 'text'],
	['muted-fg/80 / card → muted-foreground', 'muted-foreground/80', 'card', 'text'],
	['signal-fg / signal/90 hover → signal-hover', 'north-signal-foreground', 'north-signal/90@background', 'text'],
	['signal text / signal/12 badge → signal-text', 'north-signal', 'north-signal/12@background', 'text'],
	['muted-fg/35 switch track (old dark) → input', 'muted-foreground/35', 'card', 'ui'],
	['day-move fill as text on card → day-move-text', 'north-day-move', 'card', 'text']
];

const need = (kind) => (kind === 'text' ? 4.5 : 3);
const themes = [
	['light', { ...block(':root') }],
	['dark', { ...block(':root'), ...block('.dark') }]
];
let failed = 0;
function table(title, rows, counts) {
	console.log(`\n${title}`.padEnd(58) + 'light   dark   need');
	for (const [label, fg, bg, kind, fgD, bgD] of rows) {
		const cells = themes.map(([mode, t]) => {
			const [f, b] = mode === 'dark' ? [fgD ?? fg, bgD ?? bg] : [fg, bg];
			const back = colour(t, b);
			const r = contrast(colour(t, f, back), back);
			const ok = r >= need(kind);
			if (counts && !ok) failed++;
			return `${r.toFixed(2).padStart(5)}${ok ? ' ' : '!'}`;
		});
		console.log(`  ${label.padEnd(56)}${cells.join('  ')}  ${need(kind)}`);
	}
}
table('pairs in use', pairs, true);
table('composites to avoid (not counted)', avoid, false);
console.log(failed ? `\n${failed} failing pair(s) in use` : '\nall pairs in use pass');
process.exit(failed ? 1 : 0);
