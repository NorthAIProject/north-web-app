#!/usr/bin/env node
// Route size budget: the gzip size of the JavaScript each page route loads
// before anything lazy (the client entry plus its layouts' and page's static
// imports), and the gzip total of every client chunk, lazy ones included.
//
//   bun run build && node scripts/size-budget.mjs           # check against size-budget.json
//   bun run build && node scripts/size-budget.mjs --write   # record the current build
//
// A route may not grow. The lazy total may, because lazy code is paid only by
// the visitors who reach it (three.js, the 3D emblem). Rebuilding an unchanged
// tree can move a route by a few bytes (chunk hashes are part of import
// paths), so a route fails only when it grows by more than SLACK bytes.
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const SLACK = 64;
const BUDGET = 'size-budget.json';
const client = '.svelte-kit/output/client';
const manifest = JSON.parse(readFileSync(join(client, '.vite/manifest.json'), 'utf8'));
const server = readFileSync('.svelte-kit/output/server/manifest.js', 'utf8');

const gz = new Map();
const size = (file) => {
	if (!gz.has(file)) gz.set(file, gzipSync(readFileSync(join(client, file)), { level: 9 }).length);
	return gz.get(file);
};

function closure(key, into = new Set()) {
	const chunk = manifest[key];
	if (!chunk || into.has(chunk.file)) return into;
	into.add(chunk.file);
	for (const dep of chunk.imports ?? []) closure(dep, into);
	return into;
}

const entries = Object.keys(manifest).filter((k) => manifest[k].isEntry && /entry\/(start|app)$/.test(manifest[k].name));
const nodeKey = (i) => Object.keys(manifest).find((k) => k.endsWith(`/client-optimized/nodes/${i}.js`));

const routes = {};
const pattern = /id: "([^"]+)",[\s\S]*?page: (null|\{ layouts: \[([^\]]*)\], errors: \[[^\]]*\], leaf: (\d+) \})/g;
for (const m of server.matchAll(pattern)) {
	if (m[2] === 'null') continue;
	const nodes = [...m[3].split(',').filter(Boolean).map(Number), Number(m[4])];
	const files = new Set();
	for (const e of entries) closure(e, files);
	for (const n of nodes) closure(nodeKey(n), files);
	routes[m[1]] = [...files].reduce((sum, f) => sum + size(f), 0);
}

const all = [];
const walk = (dir) => {
	for (const name of readdirSync(join(client, dir))) {
		const rel = join(dir, name);
		if (statSync(join(client, rel)).isDirectory()) walk(rel);
		else if (rel.endsWith('.js')) all.push(rel);
	}
};
walk('_app/immutable');
const totalJs = all.reduce((sum, f) => sum + size(f), 0);
const current = { routes: Object.fromEntries(Object.entries(routes).sort()), totalJs };

if (process.argv.includes('--write')) {
	writeFileSync(BUDGET, JSON.stringify(current, null, '\t') + '\n');
	console.log(`wrote ${BUDGET}: ${Object.keys(routes).length} routes, total ${totalJs} B gzip`);
	process.exit(0);
}

const budget = JSON.parse(readFileSync(BUDGET, 'utf8'));
let failed = false;
for (const [route, bytes] of Object.entries(current.routes)) {
	const limit = budget.routes[route];
	if (limit === undefined) {
		console.log(`new route ${route}: ${bytes} B (add it with --write)`);
		failed = true;
	} else if (bytes > limit + SLACK) {
		console.log(`::error::${route} grew ${bytes - limit} B gzip (${limit} → ${bytes})`);
		failed = true;
	} else if (bytes !== limit) {
		console.log(`${route}: ${bytes - limit >= 0 ? '+' : ''}${bytes - limit} B (within ${SLACK} B slack)`);
	}
}
console.log(`total JS ${current.totalJs} B gzip (recorded ${budget.totalJs}; lazy growth allowed)`);
process.exit(failed ? 1 : 0);
