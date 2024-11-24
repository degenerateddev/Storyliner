<script>
    export let type = 'text';
    export let label;
    export let name;
</script>

<div>
    {#if label}
        <label class="block text-sm font-medium text-gray-700">{label}</label>
    {/if}
    <input {type} {name} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
</div>