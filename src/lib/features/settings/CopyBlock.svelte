<!-- A labelled, scrollable, copyable snippet (Go: settings.copyBlock). -->
<script lang="ts">
	import { CopyButton } from '#lib/components/ui/copybutton/index.js';

	let { heading, id, lang, body }: { heading: string; id: string; lang: string; body: string } = $props();
</script>

<div>
	<div class="mb-1.5 flex items-center justify-between gap-2">
		<span class="text-muted-foreground font-mono text-xs tracking-wide uppercase">{heading}</span>
		<CopyButton targetId={id} />
	</div>
	<pre
		{id}
		data-language={lang}
		class="border-hairline bg-background overflow-x-auto rounded-lg border p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">{body}</pre>
</div>
