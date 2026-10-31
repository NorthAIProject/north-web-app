<!-- What a user with no conversations sees (Go: chat.Empty). -->
<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Mascot from '#lib/components/khepri/Mascot.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import CoachKpiStrip from './CoachKpiStrip.svelte';
	import StartForm from './StartForm.svelte';
	import { starters } from './copy.js';

	let {
		hasThreads,
		stats
	}: { hasThreads: boolean; stats: { threadCount: number; messagesThisWeek: number } } = $props();

	const i18n = useI18n();
</script>

<!-- The page is wide (the shell does not scroll), so it scrolls itself. -->
<div class="flex h-full flex-col overflow-y-auto">
	{#if hasThreads}
		<div class="border-border shrink-0 border-b px-3 py-2 lg:hidden">
			<CoachKpiStrip {stats} />
		</div>
	{/if}
	<div class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
		<Mascot size="lg" />
		<MonoLabel text={i18n.t('chat.empty.mono')} />
		<h1 class="text-xl font-medium tracking-tight">{i18n.t('chat.empty.heading')}</h1>
		<p class="text-muted-foreground max-w-sm text-sm leading-relaxed">{i18n.t('chat.empty.body')}</p>
		<div class="flex flex-wrap items-center justify-center gap-2">
			<StartForm>
				<Button type="submit">
					<PlusIcon class="size-4" />
					{i18n.t('chat.new')}
				</Button>
			</StartForm>
			<StartForm kind="reflection">
				<Button type="submit" variant="outline">{i18n.t('chat.reflection.start')}</Button>
			</StartForm>
		</div>
		<!-- No composer here, so a chip starts a thread with itself as the draft. -->
		<div class="mt-2 grid w-full max-w-lg gap-2 sm:grid-cols-2">
			{#each starters(i18n) as starter (starter)}
				<StartForm draft={starter}>
					<Button type="submit" variant="outline" class="min-h-11 w-full justify-start text-left whitespace-normal">
						{starter}
					</Button>
				</StartForm>
			{/each}
		</div>
	</div>
</div>
