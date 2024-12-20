<script>
    import { enhance } from "$app/forms";
    import Add from "$lib/components/Add.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import { onMount } from "svelte";

    export let data;
    var json = data.json || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("json"))) || {};
    var characters = json.characters || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("characters"))) || [];
    var levels = json.levels || [];
    var sections = levels.flatMap(level => level.sections) || [];

    var success = false;
    var error = false;
    var errorMessage = "";

    var showCharacterModal = false;
    var showDialogueModal = false;
    var showRemovalModal = false;
    var toBeRemoved = null;
    var newCharacter = { name: '', avatar: '', meta: '' };
    var newDialogue = { steps: [], meta: '' }

    var currentLevel = 0;
    var currentSection = 0;

    var hoveringOverArea = false;
    /**
	 * @type {any[]}
	 */
    var texts = [];

    onMount(() => {
        if (json) {
            buildNodes();
        }
    })

    function buildNodes() {
        // Implement node building logic here
    }

    function addText(base) {
        if (newDialogue.steps) {
            base[currentEdit].push({ ...newDialogue });
            base = base;

            showDialogueModal = false;
            newDialogue = { steps: [], meta: '' };

            saveJSON("json", json);
        }
    }

    function addCharacter() {
        if (newCharacter.name) {
            characters.push({ ...newCharacter });
            characters = characters;

            showCharacterModal = false;
            newCharacter = { name: '', avatar: '', meta: '' };

            saveJSON("characters", characters);
        }
    }

    function addLevel() {
        const name = prompt("Enter level name");

        if (name) {
            const description = prompt("Enter level description") || "";
            const id = levels.length;

            levels.push({ id, name, description, sections: [] });
            levels = levels;

            json.levels = levels;
            json = json;

            saveJSON("json", json);
        }
    }

    function addSection() {
        const name = prompt("Enter section name");

        if (name) {
            const description = prompt("Enter section description") || "";
            const id = json.levels[currentLevel].sections.length;

            sections.push({ id, name, description, texts: [] });
            sections = sections;
            console.log(sections);

            json.levels[currentLevel]["sections"] = sections;
            levels = json.levels;
            json = json;

            saveJSON("json", json);
        }
    }

    function removeCharacter(id) {
        characters = characters.filter(character => character.id !== id);
        characters = characters;

        showCharacterModal = false;
        newCharacter = { name: '', avatar: '', meta: '' };

        saveJSON("characters", characters);
        
        showRemovalModal = false;
    }

    function initiateRemoval(elem) {
        toBeRemoved = elem;
        showRemovalModal = true;
    }

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

    function saveJSON(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

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

    function changeLevel(level) {
        currentLevel = level;
        currentSection = 0;
    }

    function changeSection(section) {
        currentSection = section;
    }

    function handleDragStart(event, character) {
        event.dataTransfer.setData("character", JSON.stringify(character));
    }

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

    function handleDragOver(event) {
        event.preventDefault();
    }

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

    function editType(text, level, section, id) {
        let editing = json.levels[level].sections[section].texts[id]
        
        if (type !== editing.type) {
            json.levels[level].sections[section].texts[id].type = type;
        }

        json = json;
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
                <Add event={() => showCharacterModal = true} />

                {#each characters as character}
                    <button 
                        title={character.description}
                        on:click={() => { initiateRemoval(character.name) }}
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
                <Add event={() => addLevel()} />

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
                    <Add event={() => addSection()} />

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
                    <div 
                        class="bg-stone-800 w-full h-full rounded-md" 
                        on:dragover={handleDragOver} 
                        on:drop={handleDrop}
                    >
                        {#each json.levels[currentLevel].sections[currentSection].texts as text, textIndex}
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
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</main>

<Modal title="Add Character" bind:showModal={showCharacterModal}>
    <form>
        <div class="mb-4">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-gray-700 text-sm font-bold mb-2">Name</label>
            <input bind:value={newCharacter.name} name="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
        <div class="mb-4">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-gray-700 text-sm font-bold mb-2">Avatar</label>
            <input bind:value={newCharacter.avatar} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="avatar" type="file" accept="image/*">
        </div>
        <div class="mb-4">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-gray-700 text-sm font-bold mb-2">Meta</label>
            <textarea bind:value={newCharacter.meta} name="meta" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
        </div>
        <div class="flex items-center justify-end">
            <button 
                on:click={addCharacter}
                type="button" 
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Add Character
            </button>
        </div>
    </form>
</Modal>

<Modal title="Add Text" bind:showModal={showDialogueModal}>
    <form>
        {#each newDialogue.steps as step}
            <div class="mb-4">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="block text-gray-700 text-sm font-bold mb-2">Meta</label>
                <textarea bind:value={newDialogue.meta} name="meta" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
            </div>

            <div class="mb-4">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="block text-gray-700 text-sm font-bold mb-2">Step</label>
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
        </div>
    </form>
</Modal>

<Modal title="Remove" bind:showModal={showRemovalModal}>
    <form>
        {#if toBeRemoved}
            <div class="mb-4">
                <p>Are you sure you want to remove {toBeRemoved.name}?</p>
            </div>
            <div class="flex items-center justify-end">
                <button 
                    on:click={() => removeCharacter(toBeRemoved.id) }
                    type="button" 
                    class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Remove
                </button>
            </div>
        {/if}
    </form>
</Modal>