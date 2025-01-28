<script>
    // @ts-ignore
    import { onMount, setContext } from "svelte";

    import {
		SvelteFlowProvider,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
	import DnDProvider from "$lib/components/DnDProvider.svelte";
	import Flow from "$lib/components/Flow.svelte";
	import { saveJSON, saveToDB } from "$lib/utils/index.js";

    // @ts-ignore
    export let data;

    // @ts-ignore
    var json = data.json.length > 0 ? data.json[0].json : (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("json"))) || [];
    if (json) {
        saveJSON("json", json);
        // not sure if state shall sync with DB, syncing with DB on creating new elements ONLY (characters, json) seems better to not revert back to previous state in case of failure 
        //saveToDB("actions/json/", "POST", json);
    }

    onMount(() => {
        // @ts-ignore
        const characters = data.characters.length > 0 ? data.characters : (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("characters"))) || [];
        
        if (characters) {
            saveJSON("characters", characters);
            setContext('characters', characters);
        }
    });
</script>

<main>
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