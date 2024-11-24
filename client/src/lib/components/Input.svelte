<script>
    export let type = 'text';
    export let label;
    export let name;
    /**
	 * @type {any}
	 */
     export let value;
</script>

<div>
    {#if label}
        <label class="block text-gray-700 text-sm font-bold mb-2">{label}</label>
    {/if}
    <input {type} {name} bind:value class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
</div>