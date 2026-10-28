<!-- Go: nutrition.fieldMessage (templUI form.Message, error variant). -->
<script lang="ts">
	let { message = '' }: { message?: string } = $props();
</script>

{#if message}
	<p class="text-[0.8rem] font-medium text-red-500">{message}</p>
{/if}
