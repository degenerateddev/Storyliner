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