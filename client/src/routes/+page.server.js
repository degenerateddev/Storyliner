import { PUBLIC_API } from "$env/static/public";

export const load = async (event) => {
    const response = await fetch(PUBLIC_API + "/");

    if (response.ok) {
        const data = await response.json();

        return {
            characters: data.characters,
            json: data.json
        }
    }

    return {}
}

export const actions = {
    addCharacter: async (event) => {
        const data = await event.request.formData();
        const token = event.cookies.get("access");

        const response = await fetch(PUBLIC_API + "/character", {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
    },
    editCharacter: async (event) => {
        const data = await event.request.formData();
        const characterId = data.get('characterId');
        const token = event.cookies.get("access");

        const response = await fetch(PUBLIC_API + "/character/" + characterId, {
            method: 'PUT',
            body: data,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
    },
    deleteCharacter: async (event) => {
        const data = await event.request.formData();
        const characterId = data.get('characterId');
        const token = event.cookies.get("access");

        const response = await fetch(PUBLIC_API + "/character/" + characterId, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
    },

    addDialogueData: async (event) => {
        const data = await event.request.formData();
        const json = data.get('json');
        const token = event.cookies.get("access");

        const response = await fetch(PUBLIC_API + "/dialogue", {
            method: 'POST',
            body: json,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });

    }
}