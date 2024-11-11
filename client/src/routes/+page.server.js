import { PUBLIC_API } from "$env/static/public";

export const load = async (event) => {
    const response = await fetch(PUBLIC_API + "/");

    if (response.ok) {
        const data = await response.json();

        return {
            characters: data.characters,
            levels: data.levels,
            sections: data.sections
        }
    }

    return {}
}

export const actions = {
    addSection: async (event) => {
        const data = await event.request.formData();
        const levelId = data.get('levelId');
        const sectionName = data.get('sectionName');

    },
    removeSection: async (event) => {
        const data = await event.request.formData();
        const levelId = data.get('levelId');
        const sectionId = data.get('sectionId');

    },

    addLevel: async (event) => {
        const data = await event.request.formData();
        const levelName = data.get('levelName');

    },
    removeLevel: async (event) => {
        const data = await event.request.formData();
        const levelId = data.get('levelId');

    },

    addCharacter: async (event) => {
        const data = await event.request.formData();
        const characterName = data.get('characterName');
        const characterImage = data.get('characterImage');

    },
    addCharacterToSection: async (event) => {
        const data = await event.request.formData();
        const characterId = data.get('characterId');
        const sectionId = data.get('sectionId');

    }
}