<!--
	north-client web/progress/progress.templ poseSlot: the last check's photo
	for comparison, then the new one. The file input is native and hidden
	inside its label (the whole tile is the tap target); capture="environment"
	opens the rear camera on a phone. A chosen photo is shrunk in place
	(progress-photo.ts, Go northProgressPhoto) before the form posts it.
-->
<script lang="ts">
	import CameraIcon from '@lucide/svelte/icons/camera';
	import { pickProgressPhoto } from '#lib/components/khepri/progress-photo.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { Photo } from './view.js';

	let { pose, required, last }: { pose: string; required: boolean; last: Photo | undefined } = $props();

	const i18n = useI18n();
	let preview = $state('');
	let busy = $state(false);

	async function pick(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (preview) URL.revokeObjectURL(preview);
		preview = '';
		if (!input.files?.[0]) return;
		busy = true;
		try {
			preview = await pickProgressPhoto(input);
		} finally {
			busy = false;
		}
	}

	$effect(() => () => {
		if (preview) URL.revokeObjectURL(preview);
	});
</script>

<div class="space-y-2" data-testid="pose-{pose}">
	<p class="text-sm font-medium">
		{i18n.t(`progress.pose.${pose}`)}
		{#if !required}
			<span class="text-muted-foreground font-normal">{i18n.t('progress.optional')}</span>
		{/if}
	</p>
	<div class="grid grid-cols-2 gap-2">
		<figure class="border-hairline bg-surface aspect-[3/4] overflow-hidden rounded-md border">
			{#if last}
				<img src={last.url} alt={i18n.t('progress.last')} class="size-full object-cover" loading="lazy" />
			{:else}
				<div class="text-muted-foreground flex size-full items-center justify-center p-2 text-center text-[11px]">
					{i18n.t('progress.last.none')}
				</div>
			{/if}
		</figure>
		<label
			for="photo-{pose}"
			class="border-hairline bg-surface hover:border-signal relative flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors"
		>
			{#if preview}
				<img src={preview} alt="" class="absolute inset-0 size-full object-cover" />
			{:else}
				<span class="text-muted-foreground flex flex-col items-center gap-1 p-2 text-center text-[11px]">
					<CameraIcon class="size-4" />
					{#if busy}
						<span>{i18n.t('progress.photo.preparing')}</span>
					{:else}
						<span>{i18n.t('progress.photo.add')}</span>
					{/if}
				</span>
			{/if}
			<input
				id="photo-{pose}"
				type="file"
				name={pose}
				accept="image/*"
				capture="environment"
				class="sr-only"
				onchange={pick}
			/>
		</label>
	</div>
	<div class="text-muted-foreground flex justify-between text-[11px]">
		<span>{i18n.t('progress.last')}</span>
		<span>{i18n.t('progress.now')}</span>
	</div>
</div>
