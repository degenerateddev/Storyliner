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