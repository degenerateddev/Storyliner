# Game Dev Writing Assistant

## Data Structure for use in Game Engines (JSON)
```
{
    "level_1": {
        "name": "First Level",
        "description": "Short level description",
        "sections": [
            {
                "name": "First Section",
                "description": "Short section description",
                "texts": [
                    {
                        "meta": {
                            "custom_key": "Custom data"
                        },
                        "type": "dialogue",
                        "steps": [
                            {
                                "s_1": {
                                    "character": "characterId",
                                    "text": "Short dialogue opening line"
                                }
                            },
                            {
                                "s_2": {
                                    "character": "characterId",
                                    "text": "Short dialogue opening line"
                                }
                            },
                        ]
                    },
                    {
                        "type": "jabber"
                        "character": "characterId",
                        "text": "Short jabber"
                    }
                ]
            }
        ]
    }
}
```

## JavaScript Object:
```
const data = {
    level_1: {
        name: levelName,
        description: levelDescription,
        sections: [
            {
                name: "First Section",
                description: "Short section description",
                texts: [
                    {
                        meta: {
                            custom_key: "Custom data"
                        },
                        "type": "dialogue"
                        steps: [
                            {
                                s_1: {
                                    character: "characterId",
                                    text: "Short dialogue opening line"
                                }
                            },
                            {
                                s_2: {
                                    character: "characterId",
                                    text: "Short dialogue opening line"
                                }
                            }
                        ]
                    },
                    {
                        "type": "jabber",
                        character: "characterId",
                        text: "Short jabber"
                    }
                ]
            }
        ]
    }
};
```

## Python dictionary:
```

```

### Main difference between dialogue and jabbering are:
- dialogue is for more complex text and dialogue trees, they run in a certain order. e.g. Dialogue going back and forth between the PMC and an important story character
- jabbering is for simple text, only linear dialogue and always looping (e.g. Random NPCs with no story relevance)

Base System for complex dialogue consisting of step based dialogue!

"Level" as Top Level
Section as Sub Level
Add Characters into sections in the order of the stories' flow (one character can have multiple texts he works through during a section entry and one character can appear multiple times during a section with different text configurations)
Add Text Elements into Characters in the order of the stories' flow (one character can have multiple texts with multiple choices for the player) ######
export as one file -> start with levels array, export as multiple -> one level per file
export as JSON or XML
save characters speaking into section but save sequences of multiple characters speaking right after each other in special section called "dialogue"


### Bericht
1. Motivation und Anforderungen
Kurze Beschreibung der Projektidee und des Teams
Aufgabenstellung, Recherchen, bestehende Lösungen anderer Programmierer, usw.

Die Motivation hinter dem Game Dev Assistant war ein Spiele Entwicklungs Projekt, an dem ich vor einigen Jahren gearbeitet hatte. 
Es handelte sich um ein Spiel, das sehr viel Text mit verschiedenen Antwort Optionen enthalten sollte. Wiederum einige Figuren sollte lediglich rudimentären Text enthalten, der die Geschichte nicht voranschreiten lassen sollte (bspw. repetitive one-liner).
Ich brauchte also eine Möglichkeit, um große Mengen an Text, zusammen mit Antwort Optionen und Dialog Verzweigungen, zu speichern und darauf von meiner Game Engine aus zuzugreifen. 
Bereits damals hatte ich mit der Entwicklung einer Web Anwendung begonnen, die mir das Editieren von Text in JSON Dateien erleichtern sollte, stellte diese jedoch nie fertig.

2. Planung und Entwurf
Gewähltes Framework, Entwicklungsumgebung, verwendete Bibliotheken, Automatisierungswerkzeuge, usw.
Evtl. auch Diagramme der Datenbankstruktur

Ich entschied mich für eine Kombination aus Django und SvelteKit. Diese Entscheidung begründet sich dadurch, dass ich nicht das Gefühl hatte die benötige "Reactivity", die für ein Drag-and-drop basiertes Interface zwingend notwendig ist, alleinig durch JQuery über Django Templates zu erlangen.
Desweiteren nutzte ich innerhalb des Django Backends die Restframework Library, um API Endpoints für die entsprechenden Requests, wie das Erstellen/Editieren von Figuren, Levels, etc. zu haben.
Als Datenbank verwendet die Anwendung eine Kombination aus JSON Dateien, in denen die Dialoge, sowie eine SQLite Datenbank, in der die Nutzer gespeichert sind.

3. Entwicklung
Beschreibung der Funktionen (z.B. mit Bildschirmfotos) sowie technischer Herausforderungen (Code-Schnippsel)

Das Format der exportierten JSON Dateien ist in Levels, Level Abschnitte und Figuren unterteilt. 
Die Web Anwendung enthält somit die Möglichkeit entweder nur ein einziges Level (für Open World Spiele), oder mehrere Levels als oberste Instanz/en, festzulegen.
Ebenso gibt es die Möglichkeit zum Export aller Levels als separate Dateien, oder als einzelne, große Datei. 
Der Nutzer legt fest in welchem Level und Level Abschnitt er einen neuen Dialog hinzufügen will, zieht eine der erstellten Figuren von der linken Sidebar aus in das Bearbeitungs Feld und legt den anzuzeigenden Text fest. 
Desweiteren können eigene Metadaten zu jedem "Text Node" hinzugefügt und später noch weiter angepasst werden, beispielsweise um das Auslesen von Daten über spezifische Kamera Bewegungen innerhalb der Game Engine zu ermöglichen, sobald ein spezieller Dialog Teil gezeigt wird.
Der Meta Teil einzelner Text Nodes ist hierbei vollkommen frei gestaltbar und wird letztlich im `meta` Feld innerhalb des JSON Objekts gespeichert.
Mögliche Antwort Optionen können nach belieben hinzugefügt und mit entsprechend weiteren Dialog Nodes verknüpft werden. Sollten keine Antwort Optionen angegeben sein, geht der Dialog entweder bei einem verknüpften Dialog Node weiter (maximal eine Verknüpfung), oder er endet.

4. Inbetriebnahme
Zum Ausführen der Anwendung wird lediglich Docker bzw. NodeJS und Python benötigt.

NodeJS und Python Setup:
1. NodeJS installieren
2. Node Packages installieren `npm install` (in `/client`)
2. Python installieren (Version 3.12)
3. Requirements installieren `python -m pip install -r requirements.txt` (in `/api`)
4. `python manage.py runserver` (in `/api`)
5. `npm run dev` (in `/client`)

Docker setup:
1. Docker installieren
2. `docker compose up --build -d` (in top level directory)

5. Fazit
Was wurde von den ursprünglichen Anforderungen umgesetzt? Persönlicher Eindruck, Erweiterungsmöglichkeiten



6. Quellen
URLs oder andere Verweise zu den verwendeten Bibliotheken oder Code-Teilen von Dritten

https://www.djangoproject.com/
https://svelte.dev/
https://www.django-rest-framework.org/