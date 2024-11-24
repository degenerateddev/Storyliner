<script>
    export let type = 'text';
    export let label;
    export let name;
</script>

<div>
    {#if label}
        <label class="block text-sm font-medium text-gray-700">{label}</label>
    {/if}
    <input {type} {name} class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
</div>