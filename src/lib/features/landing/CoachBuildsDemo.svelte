<!-- What a conversation builds: plans the coach drafts for approval (north-client product.templ coachBuildsDemo). -->
<script lang="ts">
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import SectionHeading from './SectionHeading.svelte';

	const i18n = useI18n();
	const t = i18n.t;
	const exchanges = [1, 2];
</script>

{#snippet bubble(mine: boolean, text: string)}
	{#if mine}
		<div class="flex justify-end">
			<p class="bg-signal/15 max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm">{text}</p>
		</div>
	{:else}
		<div class="flex">
			<p class="bg-muted/60 max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm">{text}</p>
		</div>
	{/if}
{/snippet}

<section id="coach-builds" class="border-hairline relative scroll-mt-20 border-t py-24">
	<SectionHeading eyebrow={t('land.builds.eyebrow')} title={t('land.builds.title')} body={t('land.builds.body')} />
	<div class="mt-10 grid gap-4 lg:grid-cols-2">
		{#each exchanges as n (n)}
			<Card.Root class="border-hairline bg-surface">
				<Card.Content class="space-y-3 py-5">
					{@render bubble(true, t(`land.builds.${n}.user`))}
					<div class="border-signal/30 bg-signal/5 mx-auto max-w-[90%] rounded-xl border px-4 py-3">
						<div class="flex items-center gap-2 text-xs font-medium">
							<ShieldCheckIcon class="text-signal size-3.5" />
							{t(`land.builds.${n}.card.title`)}
						</div>
						<p class="text-muted-foreground mt-1 text-xs">{t(`land.builds.${n}.card.body`)}</p>
						<div class="mt-2 flex gap-2">
							<span class="bg-signal text-background rounded-md px-2.5 py-1 text-[11px] font-medium">{t('land.builds.approve')}</span>
							<span class="border-hairline rounded-md border px-2.5 py-1 text-[11px]">{t('land.builds.change')}</span>
						</div>
					</div>
					{@render bubble(false, t(`land.builds.${n}.reply`))}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</section>
