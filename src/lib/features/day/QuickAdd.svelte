<!--
	The "+" in the tab bar (web/day dialogs.templ quickAdd): the fastest way
	to put something on the day. Each choice goes to the page that already
	knows how to log it; water, the most frequent, is one tap from here.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import CoffeeIcon from '@lucide/svelte/icons/coffee';
	import DropletIcon from '@lucide/svelte/icons/droplet';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import PillIcon from '@lucide/svelte/icons/pill';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import UtensilsIcon from '@lucide/svelte/icons/utensils';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import CapturePanel from '#lib/features/capture/CapturePanel.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import WaterOtherForm from './WaterOtherForm.svelte';
	import { quickSubmit } from './forms.js';
	import type { DayView } from './view.js';

	let { data }: { data: DayView } = $props();
	const i18n = useI18n();
	let open = $state(false);
	let supplement = $state('');
	const close = () => (open = false);
	const done = quickSubmit(i18n, close);

	const links = [
		{ href: '/app/nutrition/log', key: 'day.add.food', icon: UtensilsIcon, cls: 'text-day-food' },
		{ href: '/app/care', key: 'day.add.sleep', icon: MoonIcon, cls: 'text-day-sleep' },
		{ href: '/app/fitness/activities', key: 'day.add.workout', icon: DumbbellIcon, cls: 'text-day-fat' },
		{ href: '/app/calculator', key: 'day.add.weight', icon: ScaleIcon, cls: 'text-day-stand' },
		{ href: '/app/check-ins', key: 'day.add.checkin', icon: SmileIcon, cls: 'text-ember' },
		{ href: '/app/capture', key: 'day.add.capture', icon: ZapIcon, cls: 'text-signal' }
	];
</script>

{#snippet section(key: string, body: import('svelte').Snippet)}
	<section class="space-y-2">
		<h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{i18n.t(key)}</h3>
		{@render body()}
	</section>
{/snippet}

<!-- First: one sentence, typed or dictated, can log water, sleep, food and a check-in at once. -->
{#snippet anything()}
	<div data-testid="capture-embed"><CapturePanel initial={{ text: '', returnTo: '/app' }} onSaved={close} /></div>
{/snippet}
{#snippet water()}
	<form method="post" action="?/water" class="grid grid-cols-3 gap-2" use:enhance={done}>
		{#each ['250', '330', '500'] as ml (ml)}
			<Button type="submit" variant="outline" name="amount_ml" value={ml}><DropletIcon class="text-day-water size-4" />{ml} ml</Button>
		{/each}
	</form>
	<WaterOtherForm testId="quick-water-other" done={close} />
{/snippet}
{#snippet caffeine()}
	<form method="post" action="?/caffeine" class="grid grid-cols-2 gap-2" data-testid="quick-caffeine" use:enhance={done}>
		{#each data.caffeinePresets as p (p.key)}
			<Button type="submit" variant="outline" class="justify-start" name="preset" value={p.key}>
				<CoffeeIcon class="text-day-caffeine size-4" />
				<span class="truncate">{i18n.t(`day.caffeine.${p.key}`)}</span>
				<span class="text-muted-foreground ml-auto text-xs tabular-nums">{p.value}</span>
			</Button>
		{/each}
	</form>
	<form method="post" action="?/caffeine" class="grid grid-cols-[auto_1fr_auto] gap-2" data-testid="quick-caffeine-other" use:enhance={done}>
		<Input name="mg" type="number" placeholder="mg" class="w-20" min="1" max="1000" required inputmode="numeric" aria-label={i18n.t('day.caffeine.other.mg')} />
		<Input name="label" placeholder={i18n.t('day.caffeine.other.label')} maxlength={40} aria-label={i18n.t('day.caffeine.other.label')} />
		<Button type="submit" variant="outline"><CoffeeIcon class="text-day-caffeine size-4" />{i18n.t('day.log')}</Button>
	</form>
{/snippet}
{#snippet supplements()}
	<form method="post" action="?/supplement" class="space-y-2" data-testid="quick-supplement" use:enhance={done}>
		<SearchSelect
			id="supplement-preset"
			name="preset"
			bind:value={supplement}
			items={data.supplementPresets.map((p) => ({ value: p.key, label: p.label }))}
			placeholder={i18n.t('day.supplement.pick')}
			search={false}
		/>
		<div class="flex items-center gap-2">
			<label for="supplement-count" class="text-muted-foreground text-sm whitespace-nowrap">{i18n.t('day.supplement.count')}</label>
			<Input id="supplement-count" name="count" type="number" value="1" class="w-20" min="1" max="20" />
			<Button type="submit" variant="outline" class="ml-auto"><PillIcon class="text-day-protein size-4" />{i18n.t('day.log')}</Button>
		</div>
	</form>
{/snippet}
{#snippet screen()}
	<form method="post" action="?/screen" class="flex items-center gap-2" data-testid="quick-screen" use:enhance={done}>
		<Input name="hours" type="number" placeholder="h" class="w-20" min="0" max="24" aria-label={i18n.t('day.screen.hours')} />
		<Input name="minutes" type="number" placeholder="min" class="w-20" min="0" max="59" aria-label={i18n.t('day.screen.minutes')} />
		<Button type="submit" variant="outline"><SmartphoneIcon class="text-day-screen size-4" />{i18n.t('day.save')}</Button>
	</form>
{/snippet}
{#snippet tracker()}
	{#if data.milestones.length > 0}
		<ul class="space-y-1">
			{#each data.milestones as m (m.id)}
				<li class="flex items-center justify-between gap-2 text-sm">
					<span>{m.name} <span class={cn('text-xs', m.due ? 'text-day-move' : 'text-muted-foreground')}>{i18n.tf('day.tracker.months', m.months)}</span></span>
					<form method="post" action="?/trackerDone" use:enhance={done}>
						<input type="hidden" name="id" value={m.id} />
						<Button type="submit" variant="ghost" size="sm">{i18n.t('day.tracker.done')}</Button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
	<form method="post" action="?/tracker" class="grid grid-cols-[1fr_auto_auto] gap-2" use:enhance={done}>
		<Input name="name" placeholder={i18n.t('day.tracker.name')} maxlength={40} required />
		<Input name="last_done_on" type="date" aria-label={i18n.t('day.tracker.last')} />
		<Button type="submit" variant="outline">{i18n.t('day.add.short')}</Button>
	</form>
{/snippet}

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} size="icon" class="bg-signal text-background hover:bg-signal/90 rounded-full" aria-label={i18n.t('day.add')}>
				<PlusIcon class="size-4.5" />
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{i18n.t('day.add')}</Dialog.Title>
		</Dialog.Header>

		{@render section('day.add.anything', anything)}

		{@render section('day.add.water', water)}

		{@render section('day.add.caffeine', caffeine)}

		{@render section('day.add.supplement', supplements)}

		{@render section('day.add.screen', screen)}

		{@render section('day.add.tracker', tracker)}

		<div class="grid grid-cols-2 gap-2">
			{#each links as l (l.href)}
				<Button href={l.href} variant="outline" class="justify-start"><l.icon class={cn('size-4', l.cls)} />{i18n.t(l.key)}</Button>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
