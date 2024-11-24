<script>
    export let label;
</script>

<div>
    {#if label}
        <label class="block text-sm font-medium text-gray-700">{label}</label>
    {/if}
    <textarea class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
</div>