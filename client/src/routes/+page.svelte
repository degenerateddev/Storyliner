<script>
// @ts-nocheck

    import Modal from "$lib/components/Modal.svelte";
    import { onMount } from "svelte";

	import Swal from "sweetalert2";

    import { writable } from "svelte/store";
    import {
        SvelteFlow,
        Controls,
        Background,
        BackgroundVariant,
        MiniMap
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';

    // @ts-ignore
    export let data;

    // @ts-ignore
    var json = data.json || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("json"))) || {};
    // @ts-ignore
    var characters = json.characters || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("characters"))) || [];
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

    const nodes = writable([
        {
            id: '1',
            type: 'input',
            data: { label: 'Input Node' },
            position: { x: 0, y: 0 }
        },
        {
            id: '2',
            type: 'default',
            data: { label: 'Node' },
            position: { x: 0, y: 150 }
        }
    ]);
    const edges = writable([
        {
            id: '1-2',
            type: 'default',
            source: '1',
            target: '2',
            label: 'Edge Text'
        }
    ]);
    const snapGrid = [25, 25];

    onMount(() => {
        if (json) {
            buildNodes();
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

    // @ts-ignore
    function removeFromList(list, element) {
        if (!element) {
            return;
        }

        if (list.length === 0) {
            return;
        }

        if (!list.find(elem => elem === element)) {
            return;
        }
        
        // @ts-ignore
        list = list.filter(elem => elem !== element);
        return list;
    }

    // @ts-ignore
    function exportJson(entry) {
        const data = localStorage.getItem(entry);
        const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = entry + '.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // @ts-ignore
    function saveJSON(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // @ts-ignore
    async function saveToDB(data, url, method) {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            success = true;
            error = false;
        
        } else {
            success = false;
            error = true;
            errorMessage = response.statusText;
        }
    }

    // ##################### //
    // NAVIGATION FUNCTIONS
    // ##################### //
    // @ts-ignore
    function changeLevel(level) {
        currentLevel = level;
        currentSection = 0;
    }

    // @ts-ignore
    function changeSection(section) {
        currentSection = section;
    }

    // ##################### //
    // EDITING FUNCTIONS
    // ##################### //

    // @ts-ignore
    function handleDragStart(event, character) {
        event.dataTransfer.setData("character", JSON.stringify(character));
    }

    // @ts-ignore
    function handleDrop(event) {
        event.preventDefault();
        const character = JSON.parse(event.dataTransfer.getData("character"));
        console.log(currentLevel)
        console.log(currentSection)
        console.log(json);
        console.log(character);
        console.log(json.levels[currentLevel].sections[currentSection]);
        json.levels[currentLevel].sections[currentSection].texts.push({ character, text: '', type: "jabbering" });
        json = json;
        console.log(json);
    }

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

    async function toggleCharacterModal() {
        const { value: formValues } = await Swal.fire({
            title: "Add Character",
            html: `
                <div class="">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold">Name</label>
                        <input id="cName" name="name" class="swal2-input shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold">Avatar</label>
                        <input id="cAvatar" class="swal2-file shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="avatar" type="file" accept="image/*">
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold">Meta</label>
                        <textarea id="cMeta" name="meta" class="swal2-textarea shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
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
                    "name": document.getElementById("cName").value,
                    // @ts-ignore
                    "avatar": document.getElementById("cAvatar").value,
                    // @ts-ignore
                    "meta": document.getElementById("cMeta").value
                };
            }
        });

        if (formValues) {
            const name = formValues.name;
            const avatar = formValues.avatar;
            const meta = formValues.meta;

            if (name) {
                const randID = Math.floor(Math.random() * 10000);
                
                characters.push({ id: randID, name, avatar, meta });
                characters = characters;
                saveJSON("characters", characters);

                Swal.fire({
                    title: "Character Added",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }
    }

    /**
	 * @param {any} element
	 */
    async function toggleRemovalModal(list, element) {
        const { value: formValues } = await Swal.fire({
            title: "Remove",
            text: 'Are you sure you want to remove this element?',
            icon: 'warning',
            focusConfirm: false,
            showCancelButton: true,
            showCloseButton: true,
            showConfirmButton: true
        });

        if (formValues) {
            const newList = removeFromList(list, element)

            if (newList) {
                characters = newList;
                saveJSON("characters", characters);

                Swal.fire({
                    title: "Removed",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }
    }

    async function toggleTextModal() {
        /* {#each newDialogue.steps as step}
            <div class="mb-4">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="block text-gray-700 text-sm font-bold  ">Meta</label>
                <textarea bind:value={newDialogue.meta} name="meta" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
            </div>

            <div class="mb-4">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="block text-gray-700 text-sm font-bold  ">Step</label>
                <input bind:value={step} name="step" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
        {/each}
        
        <div class="flex items-center justify-end">
            <button 
                on:click={() => addText(json.currentLevel["sections"]["section_" + currentSection]["texts"])} 
                type="button"
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Add Character
            </button>
        </div> */
        const { value: formValues } = await Swal.fire({
            title: "Add Text",
            html: `
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Meta</label>
                    <textarea id="tMeta" name="meta" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Step</label>
                    <input name="tText" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Type</label>
                    <select id="type" name="type" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <option value="dialogue">Dialogue</option>
                        <option value="jabbering">Jabbering</option>
                    </select>
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
                    "type": document.getElementById("type").value,
                    // @ts-ignore
                    "text": document.getElementById("tText").value,
                    // @ts-ignore
                    "meta": document.getElementById("tMeta").value
                };
            }
        });

        if (formValues) {
            const type = formValues.type;
            const text = formValues.text;
            const meta = formValues.meta;

            if (type) {
                json.levels[currentLevel].sections[currentSection].texts.push({ character: characters[0], text, type });
                json = json;

                saveJSON("json", json);

                Swal.fire({
                    title: "Text Added",
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
        <div class="flex flex-col">
            <h2 class="text-2xl font-semibold">Characters</h2>
            <div class="flex flex-col bg-blue-400 h-screen rounded-md">
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button on:click={toggleCharacterModal} type="button" class="rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/30 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>

                {#each characters as character}
                    <button 
                        title={character.description}
                        on:click={() => { toggleRemovalModal(characters, character) }}
                        class="flex items-center justify-center rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/10 hover:bg-white/30">
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="bg-white font-semibold font-mono rounded-md p-3 cursor-pointer"
                            draggable="true"
                            on:dragstart={(event) => handleDragStart(event, character)}
                        >
                            {character.name}
                        </div>
                    </button>
                {/each}

                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button on:click={() => exportJson("characters")} class="mt-auto rounded-xl w-fit mx-auto p-4 m-5 border-white border backdrop-blur-sm bg-white/30 hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12 rotate-180">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
            </div>
        </div>

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
                    <div class="bg-stone-800 w-full h-full rounded-md">
                        <SvelteFlow
                              {nodes}
                              {edges}
                              {snapGrid}
                              fitView
                              on:nodeclick={(event) => console.log('on node click', event.detail.node)}
                            >
                              <Controls />
                              <Background variant={BackgroundVariant.Dots} />
                              <MiniMap />
                        </SvelteFlow>

                        <!-- {#each json.levels[currentLevel].sections[currentSection].texts as text, textIndex}
                            <div class="container w-fit text-white rounded-md p-5 bg-black border-white border">
                                <div class="flex items-center justify-between">
                                    <div>
                                        {text.character.name}
                                    </div>
                                    <div>
                                        <img src="{text.character.avatar}" alt="avatar" />
                                    </div>
                                </div>

                                <div class="flex flex-col gap-2">
                                    {#if text.type === "dialogue"}
                                        {#each text.steps as step, stepIndex}
                                            <div class="flex items-center justify-between">
                                                <p>{JSON.stringify(step.text)}</p>
                                                <input type="text" class="text-black" bind:value={step.text} />
                                                <button on:click={() => editNode(step.text, currentLevel, currentSection, textIndex, stepIndex)}>Edit</button>
                                            </div>
                                        {/each}
                                    {:else}
                                        <p>{JSON.stringify(text.text)}</p>
                                        <input type="text" class="text-black" bind:value={text.text} />
                                        <button on:click={() => editNode(text, currentLevel, currentSection, textIndex)}>Edit</button>   
                                    {/if}
                                    
                                    <p class="p-2 rounded-full border border-white w-fit">{text.type}</p>
                                </div>
                            </div>
                        {/each} -->
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</main>