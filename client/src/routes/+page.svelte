<script>
    // @ts-ignore
    import { onMount, setContext } from "svelte";

    import {
		SvelteFlowProvider,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
	import DnDProvider from "$lib/components/DnDProvider.svelte";
	import Flow from "$lib/components/Flow.svelte";
	import { exportJson, saveJSON } from "$lib/utils/index.js";

    // @ts-ignore
    export let data;

    // @ts-ignore
    var json = data.json || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("json"))) || {};

    onMount(() => {
        // @ts-ignore
        setContext('characters', localStorage.getItem('characters') ? JSON.parse(localStorage.getItem('characters')) : []);
    });
</script>

<main>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button on:click={() => exportJson("json")} class="fixed bottom-5 right-10 rounded-xl p-4 border-white border backdrop-blur-sm bg-white/30 hover:bg-white/10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12 rotate-180">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    </button>

    <div class="flex gap-5">
        <div class="flex flex-col flex-grow">
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="w-full h-full rounded-md">
                <SvelteFlowProvider>
                    <DnDProvider>
                        <Flow></Flow>
                    </DnDProvider>
                </SvelteFlowProvider>
            </div>
        </div>
    </div>
</main>