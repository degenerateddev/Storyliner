import { PUBLIC_API } from "$env/static/public";

export const load = async (event) => {
    const cookies = event.cookies;

    const responseJSON = await fetch(PUBLIC_API + "/json/", {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + cookies.get("access")
        }
    });
    const responseCharacters = await fetch(PUBLIC_API + "/characters/", {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + cookies.get("access")
        }
    });

    let data = {
        json: {},
        characters: {}
    };

    if (responseJSON.ok) {
        data.json = await responseJSON.json();
    }

    if (responseCharacters.ok) {
        data.characters = await responseCharacters.json();
    }

    console.log(data);
    if (data.json && data.characters) {
        return data;
    }

    return { status: 404 };
}