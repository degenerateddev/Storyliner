<script>
    import { onMount, setContext } from "svelte";

	import Swal from "sweetalert2";

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
    // @ts-ignore
    //var characters = json.characters || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("characters"))) || [];
    var levels = json.levels || [];
    // @ts-ignore
    var sections = levels.flatMap(level => level.sections) || [];

    var success = false;
    var error = false;
    var errorMessage = "";

    var newDialogue = { steps: [], meta: '' }

    var currentLevel = 0;
    var currentSection = 0;

    /**
	 * @type {any[]}
	 */
    // @ts-ignore
    var texts = [];

    onMount(() => {
        if (json) {
            buildNodes();

            // @ts-ignore
            setContext('characters', localStorage.getItem('characters') ? JSON.parse(localStorage.getItem('characters')) : []);
        }

        if (localStorage.getItem("currentLevel")) {
            // @ts-ignore
            currentLevel = JSON.parse(localStorage.getItem("currentLevel"));
        }

        if (localStorage.getItem("currentSection")) {
            // @ts-ignore
            currentSection = JSON.parse(localStorage.getItem("currentSection"));
        }
    })

    function buildNodes() {
        // Implement node building logic here
    }

    // @ts-ignore
    function addText(base) {
        if (newDialogue.steps) {
            // @ts-ignore
            base[currentEdit].push({ ...newDialogue });
            base = base;

            // @ts-ignore
            showDialogueModal = false;
            newDialogue = { steps: [], meta: '' };

            saveJSON("json", json);

            return true;
        }

        return false;
    }

    // ##################### //
    // NAVIGATION FUNCTIONS
    // ##################### //
    
    // @ts-ignore
    function changeLevel(level) {
        currentLevel = level;
        currentSection = 0;

        saveJSON("currentLevel", currentLevel);
        saveJSON("currentSection", currentSection);
    }

    // @ts-ignore
    function changeSection(section) {
        currentSection = section;

        saveJSON("currentSection", currentSection);
    }

    // ##################### //
    // EDITING FUNCTIONS
    // ##################### //

    // @ts-ignore
    function editNode(text, level, section, id, step) {
        let editing = json.levels[level].sections[section].texts[id]
        
        if (editing.type === "dialogue") {
            if (text !== editing.text) {
                json.levels[level].sections[section].texts[id].steps[step].text = text;
            }
        } else {
            if (text !== editing.text) {
                json.levels[level].sections[section].texts[id].text = text;
            }
        }

        json = json;
    }

    // @ts-ignore
    function editType(text, level, section, id) {
        let editing = json.levels[level].sections[section].texts[id]
        
        // @ts-ignore
        if (type !== editing.type) {
            // @ts-ignore
            json.levels[level].sections[section].texts[id].type = type;
        }

        json = json;
    }


    // ##################### //
    // MODAL FUNCTIONS
    // ##################### //
    
    async function toggleLevelModal() {
        const { value: formValues } = await Swal.fire({
            title: "Add Level",
            html: `
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Name</label>
                    <input id="lName" name="name" class="swal2-input shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Description</label>
                    <textarea id="lDesc" name="description" class="swal2-textarea shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            showCloseButton: true,
            showLoaderOnConfirm: true,
            showConfirmButton: true,
            preConfirm: () => {
                return {
                    // @ts-ignore
                    "name": document.getElementById("lName").value,
                    // @ts-ignore
                    "description": document.getElementById("lDesc").value
                };
            }
        });
        if (formValues) {
            Swal.fire(JSON.stringify(formValues));
            
            const name = formValues.name;
            const description = formValues.description;

            if (name) {
                const randID = Math.floor(Math.random() * 10000);

                levels.push({ id: randID, name, description, sections: [] });
                levels = levels;

                json.levels = levels;
                json = json;

                saveJSON("json", json);

                Swal.fire({
                    title: "Level Added",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }
    }

    async function toggleSectionModal() {
        const { value: formValues } = await Swal.fire({
            title: "Add Section",
            html: `
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Name</label>
                    <input id="sName" name="name" class="swal2-input shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Description</label>
                    <textarea id="sDesc" name="description" class="swal2-textarea shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            showCloseButton: true,
            showLoaderOnConfirm: true,
            showConfirmButton: true,
            preConfirm: () => {
                return {
                    // @ts-ignore
                    "name": document.getElementById("sName").value,
                    // @ts-ignore
                    "description": document.getElementById("sDesc").value
                };
            }
        });

        if (formValues) {
            Swal.fire(JSON.stringify(formValues));

            const name = formValues.name;
            const description = formValues.description;

            if (name) {
                const randID = Math.floor(Math.random() * 10000);

                sections.push({ id: randID, name, description, texts: [] });
                sections = sections;

                json.levels[currentLevel]["sections"] = sections;
                levels = json.levels;
                json = json;

                saveJSON("json", json);

                Swal.fire({
                    title: "Section Added",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }
    }
</script>

<main>
    {JSON.stringify(json)}
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button on:click={() => exportJson("json")} class="fixed bottom-5 right-10 rounded-xl p-4 border-white border backdrop-blur-sm bg-white/30 hover:bg-white/10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12 rotate-180">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    </button>

    <div class="flex gap-5">
        <div class="flex flex-col flex-grow">
            <h2 class="text-2xl font-semibold">Levels (currently selected: {currentLevel})</h2>
            <div class="flex gap-5 justify-start bg-teal-400 min-h-fit rounded-md">
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button on:click={toggleLevelModal} type="button" class="rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/30 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>

                {#each levels as level}
                    <button 
                        title={level.description}
                        on:click={() => changeLevel(level.id)}
                        class="flex items-center justify-center rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/10 hover:bg-white/30">
                        <div class="bg-white font-semibold font-mono rounded-md p-3 cursor-pointer">{level.name}</div>
                    </button>
                {/each}
            </div>

            {#if levels.length > 0}
                <h2 class="text-2xl font-semibold">Sections (currently selected: {currentSection})</h2>
                <div class="flex gap-5 justify-start bg-red-400 min-h-fit rounded-md">
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button on:click={toggleSectionModal} type="button" class="rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/30 hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>

                    {#each sections as section}
                        <button
                            title={section.description}
                            on:click={() => changeSection(section.id)}
                            class="flex items-center justify-center rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/10 hover:bg-white/30">
                            <div class="bg-white font-semibold font-mono rounded-md p-3 cursor-pointer">{section.name}</div>
                        </button>
                    {/each}
                </div>

                {#if sections.length > 0}
                    <h2 class="text-2xl font-semibold">Editor</h2>
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="w-full h-full rounded-md">
                        <SvelteFlowProvider>
                            <DnDProvider>
                                <Flow></Flow>
                            </DnDProvider>
                        </SvelteFlowProvider>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</main>