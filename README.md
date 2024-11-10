# Game Dev Writing Assistant

## Data Structure for use in Game Engines (JSON)
```
{
    "level_1": {
        "name": "First Level",
        "description": "Short level description",
        "sections": [
            {
                "section_1": {
                    "name": "First Section",
                    "description": "Short section description",
                    "texts": {
                        "dialogue": [
                            {
                                "d_1": {
                                    "meta": {
                                        "custom_key": "Custom data"
                                    },
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
                                        ...
                                    ]
                                }
                            },
                            {
                                "d_2": {
                                    ...
                                }
                            },
                            ...
                        ],
                        "talking": [
                            {
                                "t_1": {
                                    "steps": [
                                        {
                                            "s_1": {
                                                "character": "characterId",
                                                "text": "Short talking opening line"
                                            }
                                        },
                                        {
                                            "s_2": {
                                                "character": "characterId",
                                                "text": "Short talking line"
                                            }
                                        },
                                        ...
                                    ]
                                }
                            },
                            {
                                "t_2": {
                                    ...
                                }
                            },
                            ...
                        ],
                        "jabbering": [
                            {
                                "j_1": {
                                    "character": "characterId",
                                    "text": "Short jabber"
                                }
                            },
                            ...
                        ]
                    }
                }
            },
            {
                "section_2": {
                    ...
                }
            }
        ]
    },
    "level_2": {
        ...
    }
}
```

JavaScript Object:
```
const data = {
    level_1: {
        name: levelName,
        description: levelDescription,
        sections: [
            {
                section_1: {
                    name: "First Section",
                    description: "Short section description",
                    texts: {
                        dialogue: [
                            {
                                d_1: {
                                    meta: {
                                        custom_key: "Custom data"
                                    },
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
                                }
                            }
                        ],
                        talking: [
                            {
                                t_1: {
                                    steps: [
                                        {
                                            s_1: {
                                                character: "characterId",
                                                text: "Short talking opening line"
                                            }
                                        },
                                        {
                                            s_2: {
                                                character: "characterId",
                                                text: "Short talking line"
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        jabbering: [
                            {
                                j_1: {
                                    character: "characterId",
                                    text: "Short jabber"
                                }
                            }
                        ]
                    }
                }
            }
        ]
    }
};
```

Main difference between dialogue, talking and jabbering are:
- dialogue is for more complex text which can include custom metadata, dialogue trees, they run in a certain order and can only be ran once (e.g. Dialogue going back and forth between the PMC and an important story character)
- talking is for simple text, dialogue trees, they run in a certain order and can be ran indefinitely (e.g. Shopkeepers, Traders)
- jabbering is for simple text, only linear dialogue and always looping (e.g. Random NPCs with no story relevance)

Base System for complex dialogue consisting 

Braucht die Anwendung unbedingt eine Datenbankanbindung? 