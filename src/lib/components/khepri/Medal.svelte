<!--
	A round medal (north-client medal.Coin / medal.CoinWith): metallic rim, deep
	area face, white lucide glyph. Monthly medals get a gold scalloped rim and,
	with a month, carry the month and target instead of a glyph; locked ones are
	greyscale at 40%. Geometry and colours come from medals.json.
-->
<script lang="ts">
	import {
		baselineAttr,
		coinStyle,
		faceFill,
		fontStack,
		hasText,
		medalSet,
		num,
		numberSize,
		rimColour,
		scallop,
		type MedalSet
	} from './medal.js';
	import type { MedalProps } from './types.js';

	let { set = medalSet, ...p }: MedalProps & { /** Explicit set, as CoinWith takes. */ set?: MedalSet } = $props();

	// Every coin's gradient id is its own: a badge can be on the page twice,
	// once in a hidden dialog, and Chrome resolves url(#id) to the first match
	// even inside display:none. $props.id() is unique and hydration-stable.
	const uid = $props.id();
	const gid = 'm' + uid.replace(/[^A-Za-z0-9_-]/g, '');
	const mid = $derived(num(set.coin.viewBox / 2));
	const vb = $derived(num(set.coin.viewBox));
	const style = $derived(coinStyle(set, p));
	const rim = $derived(rimColour(set, p));
	const face = $derived(faceFill(set, p));
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox={'0 0 ' + vb + ' ' + vb}
	width={String(p.size)}
	height={String(p.size)}
	role="img"
	aria-label={p.label ?? ''}
	style={style || undefined}
>
	<defs>
		<linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#ffffff"></stop>
			<stop offset=".35" stop-color={rim}></stop>
			<stop offset=".7" stop-color={face}></stop>
			<stop offset="1" stop-color={rim}></stop>
		</linearGradient>
	</defs>
	{#if p.monthly}
		<path class="scallop" d={scallop(set)} fill={'url(#' + gid + ')'}></path>
	{:else}
		<circle cx={mid} cy={mid} r={num(set.coin.rimRadius)} fill={'url(#' + gid + ')'}></circle>
	{/if}
	<circle cx={mid} cy={mid} r={num(set.coin.faceRadius)} fill={face}></circle>
	<circle
		cx={mid}
		cy={mid}
		r={num(set.coin.faceRadius)}
		fill="none"
		stroke={set.coin.faceEdge.color}
		stroke-width={num(set.coin.faceEdge.width)}
	></circle>
	{#if hasText(p)}
		<g
			fill={set.monthly.text.color}
			font-family={fontStack(set)}
			dominant-baseline={baselineAttr(set)}
			font-weight={String(set.monthly.text.fontWeight)}
			text-anchor={set.monthly.text.anchor}
		>
			<text class="month" x={mid} y={num(set.monthly.text.monthY)} font-size={num(set.monthly.text.monthSize)}>{p.month}</text>
			<text class="target" x={mid} y={num(set.monthly.text.numberY)} font-size={num(numberSize(set, p))}>{String(p.target ?? 0)}</text>
		</g>
	{:else}
		<g
			transform={`translate(${num(set.coin.glyph.translate)} ${num(set.coin.glyph.translate)}) scale(${num(set.coin.glyph.scale)})`}
			fill="none"
			stroke="#fff"
			stroke-width={num(set.stroke)}
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			{#each set.glyphs[p.badgeId ?? ''] ?? [] as d, i (i)}
				<path {d}></path>
			{/each}
		</g>
	{/if}
</svg>
