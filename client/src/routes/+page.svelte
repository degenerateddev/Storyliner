<script>
    import { enhance } from "$app/forms";
	import Add from "$lib/components/Add.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import { onMount } from "svelte";

    export let data;
    var json = data.json || {};
    var characters = json.characters || [];
    var levels = json.levels || [];
    var sections = levels.forEach(level => {
        return level.sections;
    }) || [];
    var dialogues = sections.forEach(section => {
        return section.texts.dialogues;
    }) || [];
    var talkings = sections.forEach(section => {
        return section.texts.talking;
    }) || [];
    var jabberings = sections.forEach(section => {
        return section.texts.jabbering;
    }) || [];

    var showCharacterModal = false;
    var showDialogueModal = false;
    var newCharacter = { name: '', avatar: '', meta: '' };
    var newDialogue = { steps: [], meta: '' }

    var hoveringOverArea = null;

    onMount(() => {
        if (json) {
            

            buildNodes();
        }
    })

    function buildNodes() {
        
    }

    function addDialogue(base) {
        if (newDialogue.steps) {
            base["dialogue"].push({ ...newDialogue });
            base = base;

            showDialogueModal = false;
            newDialogue = { steps: [], meta: '' };
        }
    }

    function addCharacter() {
        if (newCharacter.name) {
            characters.push({ ...newCharacter });
            characters = characters;

            showCharacterModal = false;
            newCharacter = { name: '', avatar: '', meta: '' };
        }
    }

    function addLevel() {
        const name = prompt("Enter level name");

        if (name) {
            const description = prompt("Enter level description") || "";

            levels.push({ name, description, sections: [] });
            levels = levels;

            json.levels = levels;
        }
    }

    function addSection() {
        const name = prompt("Enter section name");

        if (name) {
            const description = prompt("Enter section description") || "";

            sections.push({ name, description, texts: [] });
            sections = sections;

            json.sections = sections;
        }
    }

    function exportJson() {
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        a.click();
        URL.revokeObjectURL(url);
    } 
</script>

<main>
    <button on:click={exportJson} class="fixed bottom-5 right-10 rounded-xl p-4 border-white border backdrop-blur-sm bg-white/30 hover:bg-white/10">
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
                    <div class="flex items-end justify-center">
                        <div class="bg-white font-semibold font-mono rounded-md p-3 cursor-pointer">{character.name}</div>
                    </div>
                {/each}
            </div>
        </div>

        <div class="flex flex-col flex-grow">
            <h2 class="text-2xl font-semibold">Levels</h2>
            <div class="flex gap-5 justify-start bg-teal-400 h-[10vh] rounded-md">
                <Add event={() => addLevel()} />

                {#each levels as level}
                    <button class="flex items-center justify-center rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/10 hover:bg-white/30">
                        <span>{level.name}</span>
                    </button>
                {/each}
            </div>

            <h2 class="text-2xl font-semibold">Sections</h2>
            <div class="flex gap-5 justify-start bg-red-400 h-[10vh] rounded-md">
                <Add event={() => addSection()} />

                {#each sections as section}
                    <button class="flex items-center justify-center rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-white/10 hover:bg-white/30">
                        <span>{section.id}</span>
                    </button>
                {/each}
            </div>

            {#if json.levels}
                <h2 class="text-2xl font-semibold">Editor</h2>
                <div class="bg-stone-800 text-white w-full h-full rounded-md" on:dragenter={() => hoveringOverArea = true} on:dragleave={() => hoveringOverArea = false} on:drop={event => drop(event, step)}>
                    <pre class="whitespace-pre-line font-mono">
                        {JSON.stringify(json, null, 2)}
                    </pre>
                </div>
            {/if}
        </div>
    </div>

    <form method="POST" action="?/addDialogueData">
        <input type="hidden" name="json" value={JSON.stringify(json)} />
    </form>
</main>

<Modal title="Add Character" bind:showModal={showCharacterModal}>
    <form>
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Name</label>
            <input bind:value={newCharacter.name} name="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="avatar">Avatar</label>
            <input bind:value={newCharacter.avatar} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="avatar" type="file" accept="image/*">
        </div>
        <div class="mb-4">
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

<Modal title="Add Dialogue Node" bind:showModal={showDialogueModal}>
    <form>
        {#each newDialogue.steps as step}
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">Meta</label>
                <textarea bind:value={newDialogue.meta} name="meta" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
            </div>

            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">Step</label>
                <input bind:value={step} name="step" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
        {/each}
        
        <div class="flex items-center justify-end">
            <button 
                on:click={() => addDialogue(json.currentLevel["sections"]["section_" + currentSection]["texts"])} 
                type="button"
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Add Character
            </button>
        </div>
    </form>
</Modal>