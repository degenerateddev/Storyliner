import { PUBLIC_API } from "$env/static/public";
import { getContext } from "svelte";

// @ts-ignore
function exportJson(entry) {
    if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available');
        return;
    }
    const data = localStorage.getItem(entry);
    if (data) {
        const parsedData = JSON.parse(data);
        const blob = new Blob([JSON.stringify(parsedData, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = entry + '.json';
        a.click();
        URL.revokeObjectURL(url);
    } else {
        console.error('No data found for the given entry');
    }
}

/**
 * @param {string} key
 * @param {any} data
 */
async function saveJSON(key, data, adding=true) {
    // key = "characters" | "json"
    if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available');
        return;
    }
    localStorage.setItem(key, JSON.stringify(data));

    if (adding) {
        const saved = await saveToDB('actions/' + key + '/', 'POST', data);
        return saved;
    }
}

// @ts-ignore
async function saveToDB(url, method, data) {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    });

    if (response.ok) {
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

    if (!list.find((/** @type {any} */ elem) => elem === element)) {
        return;
    }
    
    // @ts-ignore
    list = list.filter(elem => elem !== element);
    return list;
}
 
function useDnD() {
  return getContext('dnd');
};

function getCharacters() {
    if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available');
        return null;
    }
    const characters = getContext('characters') || localStorage.getItem('characters');
    return characters;
}

export { exportJson, saveJSON, saveToDB, removeFromList, useDnD, getCharacters };