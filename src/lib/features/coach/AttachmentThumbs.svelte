<!--
	What a turn carried (Go: attachmentThumbs): a photo as itself, anything
	else as a badge naming the file.
-->
<script lang="ts">
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { fileLabel } from './copy.js';

	type Thumb = { kind: string; name: string; src: string };

	let { parts }: { parts: Thumb[] } = $props();

	const i18n = useI18n();
</script>

{#each parts as p, i (i)}
	{#if p.kind === 'image' && p.src}
		<img src={p.src} alt={p.name} class="mb-2 max-h-48 rounded-lg object-cover" />
	{:else}
		<div class="mb-2">
			<Badge variant="secondary" class="max-w-full gap-1.5 py-1" data-attachment-file="">
				<PaperclipIcon class="size-3" />
				<span class="truncate">{fileLabel(i18n, p.name)}</span>
			</Badge>
		</div>
	{/if}
{/each}
