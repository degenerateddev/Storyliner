<script>
    export let label;
    export let name;
    export let value;
</script>

<div>
    {#if label}
        <label class="block text-sm font-medium text-gray-700">{label}</label>
    {/if}
    <textarea {value} {name} class="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-accent"></textarea>
</div>