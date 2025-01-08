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