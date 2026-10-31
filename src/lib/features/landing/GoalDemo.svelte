<!--
	Goal repair (north-client web/landing/demos.templ goalDemo + landing.js
	northGoal): a sentence somebody would actually type, structured in the
	browser into the shape a training block is built from.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import TargetIcon from '@lucide/svelte/icons/target';
	import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import SectionHeading from './SectionHeading.svelte';
	import { blankGoal, goalFields, parseGoal, type Goal } from './demos.js';

	const i18n = useI18n();
	const t = i18n.t;

	let input = $state(t('land.goal.sample'));
	let running = $state(false);
	let out: Goal = $state(parseGoal(t('land.goal.sample'), t));

	let reduced = false;
	let alive = true;
	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return () => (alive = false);
	});

	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

	function reset() {
		running = false;
		out = parseGoal(input, t);
	}

	async function type(field: (typeof goalFields)[number], value: string) {
		for (let i = 1; i <= value.length; i += 2) {
			if (!alive || !running) return;
			out[field] = value.slice(0, i);
			await sleep(8);
		}
		out[field] = value;
	}

	async function run() {
		if (running) return;
		const parsed = parseGoal(input, t);
		out = blankGoal();

		if (reduced) {
			out = parsed;
			return;
		}

		running = true;
		for (const field of goalFields) {
			await type(field, parsed[field]);
			await sleep(90);
		}
		for (const session of parsed.sessions) {
			if (!running) return;
			out.sessions.push(session);
			await sleep(130);
		}
		await sleep(160);
		if (!running) return;
		out.measure = parsed.measure;
		running = false;
	}

	const fields = $derived([
		{ key: 'objective', name: t('land.goal.field.objective') },
		{ key: 'horizon', name: t('land.goal.field.horizon') },
		{ key: 'commitment', name: t('land.goal.field.commitment') },
		{ key: 'equipment', name: t('land.goal.field.equipment') },
		{ key: 'constraint', name: t('land.goal.field.constraint') }
	] as const);
</script>

<section class="relative border-t border-hairline py-24">
	<SectionHeading title={t('land.goal.title')} body={t('land.goal.body')} />
	<Card.Root class="mt-10 border-hairline bg-surface">
		<Card.Content class="grid gap-8 lg:grid-cols-2">
			<div>
				<Label for="goal-input" class="text-sm">
					{t('land.goal.input')}
				</Label>
				<Textarea
					id="goal-input"
					rows={5}
					class="mt-2 resize-none border-hairline bg-background/50 text-sm"
					bind:value={input}
					onkeydown={(e) => {
						if (e.metaKey && e.key === 'Enter') run();
					}}
				/>
				<div class="mt-4 flex flex-wrap items-center gap-3">
					<Button onclick={run} disabled={running}>
						{#if running}
							<span>{t('land.goal.running')}</span>
						{:else}
							<span>{t('land.goal.run')}</span>
						{/if}
						<WandSparklesIcon class="size-4" />
					</Button>
					<Button variant="ghost" onclick={reset}>
						<RotateCcwIcon class="size-3.5" />
						{t('land.goal.reset')}
					</Button>
				</div>
				<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
					{t('land.goal.note')}
				</p>
			</div>
			<div class="rounded-lg border border-hairline bg-background/40 p-5">
				<div class="flex items-center justify-between">
					<MonoLabel text={t('land.goal.structured')} />
					{#if running}
						<span class="text-signal">
							<Spinner class="size-3.5" />
						</span>
					{/if}
				</div>
				<dl class="mt-4 space-y-3">
					{#each fields as f (f.key)}
						<div class="flex items-baseline gap-4">
							<dt class="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{f.name}</dt>
							<dd class="min-h-[1.25rem] flex-1 text-sm text-foreground/90">
								<span>{out[f.key]}</span>
								{#if running}
									<span class="ml-0.5 inline-block h-3.5 w-1.5 -mb-0.5 bg-signal motion-safe:animate-caret"></span>
								{/if}
							</dd>
						</div>
					{/each}
				</dl>
				<Separator class="my-5 bg-hairline" />
				<MonoLabel text={t('land.goal.firstweek')} />
				<ol class="mt-3 space-y-2">
					{#each out.sessions as s, i (i)}
						<li class="flex items-baseline gap-3 text-sm">
							<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-signal-text">{s.day}</span>
							<span class="text-foreground/90">{s.work}</span>
						</li>
					{/each}
				</ol>
				{#if out.measure}
					<div class="mt-5 flex items-start gap-2 rounded-md bg-signal/10 p-3">
						<TargetIcon class="mt-0.5 size-3.5 shrink-0 text-signal" />
						<p class="text-xs leading-relaxed text-foreground/90">{out.measure}</p>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
</section>
