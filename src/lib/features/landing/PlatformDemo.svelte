<!--
	Cross-surface continuity (north-client web/landing/demos.templ platformDemo
	+ landing.js northSurfaces). The tabs tour themselves while the section is
	on screen; any deliberate interaction ends the tour for good — a panel that
	keeps moving under a reader is worse than one that never moved.

	The panels are hand-rolled: each surface should look like itself, and no
	component describes application chrome. The framing is generic on purpose —
	a title bar and a composer, not a reproduction of anyone's brand.
-->
<script lang="ts">
	import { onMount, type Component } from 'svelte';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import HashIcon from '@lucide/svelte/icons/hash';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import SendIcon from '@lucide/svelte/icons/send';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import SectionHeading from './SectionHeading.svelte';
	import Waypoint from './Waypoint.svelte';
	import { surfaces, type SurfaceKey } from './content.js';

	const i18n = useI18n();
	const t = i18n.t;

	const list = $derived(surfaces(t));
	const icons: Record<SurfaceKey, Component<{ class?: string }>> = {
		web: GlobeIcon,
		telegram: SendIcon,
		discord: HashIcon,
		whatsapp: MessageCircleIcon
	};
	const order: SurfaceKey[] = ['web', 'telegram', 'discord', 'whatsapp'];

	let active: string = $state('web');
	let root: HTMLElement | undefined = $state();
	let timer: ReturnType<typeof setInterval> | null = null;
	let halted = false;

	function stop() {
		if (timer) clearInterval(timer);
		timer = null;
	}

	function start() {
		if (halted || timer) return;
		timer = setInterval(() => {
			const index = (order.indexOf(active as SurfaceKey) + 1) % order.length;
			active = order[index];
		}, 4600);
	}

	function pause() {
		halted = true;
		stop();
	}

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !root) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) start();
				else stop();
			},
			{ threshold: 0.35 }
		);
		observer.observe(root);
		return () => {
			observer.disconnect();
			stop();
		};
	});
</script>

<section class="relative border-t border-hairline py-24" bind:this={root}>
	<Waypoint distance={t('land.waypoint.week12')} />
	<SectionHeading eyebrow={t('land.surf.eyebrow')} title={t('land.surf.title')} body={t('land.surf.body')} />
	<div class="mt-10">
		<Tabs.Root bind:value={active}>
			<Tabs.List class="flex h-auto w-full flex-wrap gap-1 border border-hairline bg-surface p-1" aria-label={t('land.surf.tabs.aria')}>
				{#each list as s (s.key)}
					{@const Icon = icons[s.key]}
					<Tabs.Trigger value={s.key} class="gap-1.5 px-3 py-1.5 text-xs data-[state=active]:text-signal" onclick={pause}>
						<Icon class="size-3.5" />
						{s.name}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
			<div class="mt-4" role="presentation" onmouseenter={pause} onfocusin={pause}>
				{#each list as s (s.key)}
					{@const Icon = icons[s.key]}
					<Tabs.Content value={s.key}>
						<div class="overflow-hidden rounded-xl border border-hairline bg-surface">
							<div class="flex items-center gap-2 border-b border-hairline bg-background/40 px-4 py-2.5">
								<span class="flex gap-1.5" aria-hidden="true">
									<span class="size-2 rounded-full bg-foreground/15"></span>
									<span class="size-2 rounded-full bg-foreground/15"></span>
									<span class="size-2 rounded-full bg-foreground/15"></span>
								</span>
								<span class="ml-2 flex items-center gap-1.5 text-muted-foreground">
									<Icon class="size-3.5" />
									<MonoLabel text={s.chrome} />
								</span>
							</div>
							<div class="space-y-4 px-5 py-6">
								<div class="flex items-center gap-3">
									<span class="h-px flex-1 bg-hairline"></span>
									<MonoLabel text={s.gap} />
									<span class="h-px flex-1 bg-hairline"></span>
								</div>
								{#each s.messages as m, i (i)}
									<div class={['flex', m.fromUser && 'justify-end']}>
										<div
											class={[
												'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
												m.fromUser && 'bg-foreground/8 text-foreground/90',
												!m.fromUser && 'border border-agent/25 bg-agent/10'
											]}
										>
											{#if !m.fromUser}
												<div class="pb-1">
													<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-agent">Khepri</span>
												</div>
											{/if}
											{m.body}
										</div>
									</div>
								{/each}
							</div>
							<div class="flex items-center gap-2 border-t border-hairline px-5 py-3 text-muted-foreground">
								<MessageSquareIcon class="size-3.5" />
								<MonoLabel text={t('land.surf.footer')} />
							</div>
						</div>
					</Tabs.Content>
				{/each}
			</div>
		</Tabs.Root>
	</div>
</section>
