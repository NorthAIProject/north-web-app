<script lang="ts">
	// Go: form.Message with the error variant, under a field.
	let { message = '' }: { message?: string } = $props();
</script>

{#if message}
	<p class="text-[0.8rem] font-medium text-red-500">{message}</p>
{/if}
