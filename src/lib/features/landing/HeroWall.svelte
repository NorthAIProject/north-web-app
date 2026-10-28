<!--
	The fan of cards along the bottom of the hero (north-client
	web/landing/herowall.templ). The slot carries position and rotation; the
	sway runs on the element inside it so the two transforms never fight.
	Hand-rolled rather than Card: the tile has a fixed aspect ratio and type
	sized to its own width.
-->
<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import NotebookPenIcon from '@lucide/svelte/icons/notebook-pen';
	import SendIcon from '@lucide/svelte/icons/send';
	import TargetIcon from '@lucide/svelte/icons/target';
	import TrophyIcon from '@lucide/svelte/icons/trophy';
	import { useI18n } from '#lib/i18n/index.js';
	import { backSlots, frontSlots, wallDeck, wallHabitGrid, type WallCard, type WallSlot } from './herowall.js';

	const i18n = useI18n();
	const deck = $derived(wallDeck(i18n.t));
	const back = $derived(backSlots(deck));
	const front = $derived(frontSlots(deck));
	const liftBars = ['35%', '45%', '50%', '62%', '70%', '100%'];
</script>

{#snippet label(text: string | undefined)}
	<span class="font-mono text-[0.62em] uppercase leading-tight tracking-[0.14em] text-muted-foreground">{text}</span>
{/snippet}

{#snippet card(c: WallCard)}
	{#if c.kind === 'memory'}
		<div class="flex h-full flex-col">
			<div class="flex items-center gap-[0.4em]">
				<span class="size-[0.45em] rounded-full bg-signal"></span>
				{@render label(c.label)}
			</div>
			<p class="mt-auto text-[2.2em] font-semibold leading-none tracking-[-0.03em]">{c.title}</p>
			<p class="mt-[0.35em] text-[1.05em] font-medium text-signal">{c.body}</p>
			<p class="mt-[0.8em] border-t border-hairline pt-[0.7em] text-[0.8em] leading-snug text-muted-foreground">{c.meta}</p>
		</div>
	{:else if c.kind === 'streak'}
		<div class="flex h-full flex-col items-center justify-center text-center">
			<span class="flex size-[3em] items-center justify-center rounded-full bg-ember/15 text-ember">
				<FlameIcon class="size-[1.6em]" />
			</span>
			<p class="mt-[0.9em] text-[1.25em] font-semibold leading-tight tracking-[-0.02em]">{c.title}</p>
			<p class="mt-[0.3em] text-[0.8em] text-muted-foreground">{c.meta}</p>
			<div class="mt-[1em] flex gap-[0.3em]">
				{#each [0, 1, 2, 3, 4, 5, 6] as i (i)}
					<span class={['size-[0.55em] rounded-full', i < 6 && 'bg-ember', i === 6 && 'bg-ember/30']}></span>
				{/each}
			</div>
		</div>
	{:else if c.kind === 'quote'}
		<div class="flex h-full flex-col">
			<div class="flex items-center gap-[0.45em]">
				<img src="/assets/brand/khepri-logo-mark.png" alt="" class="size-[1.4em]" />
				<span class="font-mono text-[0.62em] uppercase tracking-[0.14em] text-agent">Khepri</span>
			</div>
			<p class="mt-[0.9em] text-[1.12em] font-medium leading-snug tracking-[-0.01em] text-balance">{c.body}</p>
			<div class="mt-auto">
				{@render label(c.meta)}
			</div>
		</div>
	{:else if c.kind === 'sleep'}
		<div class="flex h-full flex-col">
			<div class="flex items-center gap-[0.4em] text-day-sleep">
				<MoonIcon class="size-[0.9em]" />
				{@render label(c.label)}
			</div>
			<div class="relative mx-auto mt-[1em] size-[6.2em]">
				<svg viewBox="0 0 36 36" class="size-full -rotate-90">
					<circle cx="18" cy="18" r="15.5" fill="none" stroke-width="3" class="stroke-hairline"></circle>
					<circle
						cx="18"
						cy="18"
						r="15.5"
						fill="none"
						stroke-width="3"
						stroke-linecap="round"
						stroke-dasharray="81.8 97.4"
						class="stroke-day-sleep"
					></circle>
				</svg>
				<span class="absolute inset-0 flex items-center justify-center text-[1.9em] font-semibold tracking-[-0.03em]">{c.title}</span>
			</div>
			<p class="mt-auto text-center font-mono text-[0.85em]">{c.body}</p>
			<p class="mt-[0.2em] text-center text-[0.75em] text-muted-foreground">{c.meta}</p>
		</div>
	{:else if c.kind === 'goal'}
		<div class="flex h-full flex-col">
			<div class="flex items-center gap-[0.4em] text-signal">
				<TargetIcon class="size-[0.9em]" />
				{@render label(c.label)}
			</div>
			<p class="mt-[1em] text-[1.3em] font-semibold leading-tight tracking-[-0.02em]">{c.title}</p>
			<p class="mt-auto text-[2.6em] font-semibold leading-none tracking-[-0.04em] text-signal">{c.body}</p>
			<div class="mt-[0.7em] h-[0.4em] overflow-hidden rounded-full bg-hairline">
				<div class="h-full w-[62%] rounded-full bg-signal"></div>
			</div>
			<p class="mt-[0.6em] text-[0.75em] text-muted-foreground">{c.meta}</p>
		</div>
	{:else if c.kind === 'habits'}
		<div class="flex h-full flex-col">
			{@render label(c.label)}
			<div class="mt-[1em] grid grid-cols-7 gap-[0.28em]">
				{#each wallHabitGrid as week, w (w)}
					{#each week as done, d (d)}
						<span class={['aspect-square rounded-[0.2em]', done && 'bg-signal', !done && 'bg-hairline']}></span>
					{/each}
				{/each}
			</div>
			<div class="mt-auto flex items-center gap-[0.4em]">
				<CheckIcon class="size-[0.9em] text-signal" />
				<span class="text-[0.8em] text-muted-foreground">{c.meta}</span>
			</div>
		</div>
	{:else if c.kind === 'journal'}
		<div class="flex h-full flex-col">
			<div class="flex items-center gap-[0.4em] text-muted-foreground">
				<NotebookPenIcon class="size-[0.9em]" />
				{@render label(c.label)}
			</div>
			<p class="mt-[1em] text-[1.05em] leading-snug text-foreground/90">{c.body}</p>
			<div class="mt-auto space-y-[0.45em]">
				<span class="block h-[0.3em] w-full rounded-full bg-hairline"></span>
				<span class="block h-[0.3em] w-4/5 rounded-full bg-hairline"></span>
				<span class="block h-[0.3em] w-3/5 rounded-full bg-hairline"></span>
			</div>
		</div>
	{:else if c.kind === 'telegram'}
		<div class="flex h-full flex-col">
			<div class="flex items-center gap-[0.4em] text-day-water">
				<SendIcon class="size-[0.9em]" />
				<span class="font-mono text-[0.62em] uppercase tracking-[0.14em]">Telegram</span>
			</div>
			<div class="mt-auto flex flex-col gap-[0.5em]">
				<p
					class="ml-auto max-w-[88%] rounded-[0.9em] rounded-br-[0.25em] bg-signal px-[0.75em] py-[0.5em] text-[0.82em] leading-snug text-signal-foreground"
				>
					{c.body}
				</p>
				<p class="mr-auto max-w-[88%] rounded-[0.9em] rounded-bl-[0.25em] bg-muted px-[0.75em] py-[0.5em] text-[0.82em] leading-snug">
					{c.meta}
				</p>
			</div>
		</div>
	{:else if c.kind === 'plan'}
		<div class="flex h-full flex-col">
			<div class="flex items-center gap-[0.4em] text-muted-foreground">
				<DumbbellIcon class="size-[0.9em]" />
				{@render label(c.label)}
			</div>
			<p class="mt-[0.8em] text-[1.05em] font-semibold leading-tight tracking-[-0.01em]">{c.title}</p>
			<ul class="mt-auto space-y-[0.5em]">
				{#each c.lines ?? [] as line, i (i)}
					<li class="flex items-center gap-[0.5em] text-[0.8em]">
						<span class={['size-[0.5em] shrink-0 rounded-full', i === 0 && 'bg-signal', i > 0 && 'border border-muted-foreground/50']}
						></span>
						<span class={[i > 0 && 'text-muted-foreground']}>{line}</span>
					</li>
				{/each}
			</ul>
		</div>
	{:else if c.kind === 'lift'}
		<div class="flex h-full flex-col">
			<div class="flex items-center gap-[0.4em] text-ember">
				<TrophyIcon class="size-[0.9em]" />
				{@render label(c.label)}
			</div>
			<div class="mt-[1.2em] flex h-[4.5em] items-end gap-[0.35em]">
				{#each liftBars as h (h)}
					<span class="flex-1 rounded-t-[0.2em] bg-ember/70 last:bg-ember" style:height={h}></span>
				{/each}
			</div>
			<p class="mt-auto text-[1.15em] font-semibold leading-tight tracking-[-0.02em]">{c.title}</p>
			<p class="mt-[0.3em] text-[0.8em] text-muted-foreground">{c.meta}</p>
		</div>
	{:else if c.kind === 'image'}
		{#if c.cover}
			<div class="-m-[var(--wall-pad)] flex h-[calc(100%+2*var(--wall-pad))] flex-col">
				<img src={c.image} alt="" loading="lazy" decoding="async" class="min-h-0 flex-1 object-cover object-left-top" />
				<div class="border-t border-hairline px-[var(--wall-pad)] py-[0.8em]">
					{@render label(c.label)}
				</div>
			</div>
		{:else}
			<div class="flex h-full flex-col items-center">
				<div
					class="flex min-h-0 w-full flex-1 items-center justify-center rounded-[0.8em] bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--north-signal)_18%,transparent),transparent_70%)]"
				>
					<img src={c.image} alt="" loading="lazy" decoding="async" class="max-h-[85%] max-w-[85%] object-contain" />
				</div>
				<div class="pt-[0.8em]">
					{@render label(c.label)}
				</div>
			</div>
		{/if}
	{/if}
{/snippet}

{#snippet slot(s: WallSlot)}
	<div class={['hero-wall-slot', s.class]} style={s.style}>
		<div class="hero-wall-sway">
			<div class="hero-wall-face">
				<div class="hero-wall-body">
					{@render card(s.card)}
				</div>
			</div>
		</div>
	</div>
{/snippet}

<div aria-hidden="true" class="hero-wall">
	<div class="hero-wall-row hero-wall-back hidden md:block">
		{#each back as s, i (i)}
			{@render slot(s)}
		{/each}
	</div>
	<div class="hero-wall-row hero-wall-front">
		{#each front as s, i (i)}
			{@render slot(s)}
		{/each}
	</div>
	<div class="hero-wall-fade"></div>
</div>
