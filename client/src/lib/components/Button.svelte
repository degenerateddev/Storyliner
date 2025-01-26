<script>
    export let label;
    export let type = 'button';
</script>

<button {type} class="mt-4 px-4 py-2 w-full bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
    {label}
</button>