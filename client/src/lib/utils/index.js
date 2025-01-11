import { getContext } from "svelte";

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
        /* success = true;
        error = false; */
        return true;
    
    } else {
        /* success = false;
        error = true;
        errorMessage = response.statusText; */
        return false;
    }
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
    const characters =  getContext('characters') || localStorage.getItem('characters');
    return characters;
}

function getLevelAndSection() {
    const level_section = getContext("level_section") || {
        level: localStorage.getItem("level"),
        section: localStorage.getItem("section")
    }
    console.log(level_section);
    
    return { level: level_section.level, section: level_section.section };
}

export { exportJson, saveJSON, saveToDB, removeFromList, useDnD, getCharacters, getLevelAndSection };