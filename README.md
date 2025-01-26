# Game Dev Writing Assistant

## Data Structure for use in Game Engines (JSON)
```
{
    "name": "First Level",
    "description": "Short level description",
    "sections": [
        {
            "meta": {
                "id": "S0",
                "position": "0,0",
                "type": "section",

                "custom_key": "Custom data"
            },
            "label": "First Section",
            "texts": [
                {
                    "meta": {
                        "id": "0",
                        "position": "0,0",
                        "type": "text",
                        "parentId": "S0",

                        "custom_key": "Custom data"
                    },
                    "data": {
                        "character": "characterId",
                        "content": "Are you free tomorrow?",
                        "next": ["1"]
                        /* "next": [
                            {
                                "id": "1",
                                "condition": "playerChoice == 'No'"
                            },
                            {
                                "id": "2",
                                "condition": "playerChoice == 'Yes'"
                            }
                        ] */
                    }
                },
                {
                    "meta": {
                        "id": "1",
                        "position": "10,0",
                        "type": "text",
                        "parentId": "S0",

                        "custom_key": "Custom data"
                    },
                    "data": {
                        "character": "characterId",
                        "content": "Oh, okay."
                    }
                }
            ]
        }
    ]
}
```

### Main difference between dialogue and jabbering are:
- dialogue is for more complex text and dialogue trees, they run in a certain order. e.g. Dialogue going back and forth between the PMC and an important story character
- jabbering is for simple text, only linear dialogue and always looping (e.g. Random NPCs with no story relevance)

### Base System for complex dialogue consisting of step based dialogue!
- "Level" as top level
- "Section" as medium level node
- "Text" as bottom level node

### Nodes
- Add text nodes into section nodes in the order of the stories' flow (one character can have multiple texts they work through during a section entry and one character can appear multiple times during a section with different text configurations)
- Add text nodes into Characters in the order of the stories' flow (one character can have multiple texts with multiple choices for the player)

### Export
- export as one file -> start with levels array, export as multiple -> one level per file
- export as JSON or XML
- save characters speaking into section but save sequences of multiple characters speaking right after each other in special section called "dialogue"