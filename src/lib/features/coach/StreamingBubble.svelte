<!--
	The coach turn being written (Go: streamingCoachBubble). Tokens arrive as
	plain text with a caret at the end; markdown waits for the stored reply
	the page re-reads when the stream closes. A failure shows in the bubble
	(Go: StreamErrorHTML) and is announced at once (role="alert"); the
	finished reply is announced by the page, not token by token here.
-->
<script lang="ts">
	import { museAgentBubble } from './classes.js';

	let { text, error, streaming }: { text: string; error: string; streaming: boolean } = $props();
</script>

<div class="flex flex-col items-start gap-1" data-testid="coach-stream">
	<div class="{museAgentBubble} whitespace-pre-wrap"><span data-stream-sink>{text}{#if error}<p class="text-destructive text-sm" role="alert">{error}</p>{/if}</span>{#if streaming}<span
				data-streaming-caret
				class="bg-agent motion-safe:animate-caret -mb-0.5 ml-0.5 inline-block h-3.5 w-1.5"
				aria-hidden="true"
			></span>{/if}</div>
</div>
