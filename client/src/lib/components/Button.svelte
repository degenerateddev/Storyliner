<script>
    export let label;
    export let type = 'button';
</script>

<button {type} class="mt-4 px-4 py-2 w-full bg-black border-white text-white rounded-md hover:bg-accent focus:outline-none focus:ring-0 duration-100 ease-in-out">
    {label}
</button>