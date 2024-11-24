<script>
    export let event;
</script>

<button on:click={event} type="button" class="rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/30 hover:bg-white/10">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>                      
</button>