# Storyliner – Game Dev Writing Assistant

Write branching dialogue on a canvas: **sections** group **lines** (text nodes) spoken by **characters**,
and arrows define which line comes next. Stories export to Yarn Spinner, ink, Godot Dialogue Manager,
Ren'Py, Twine, CSV and JSON, so they can be used directly in Unity, Godot, Unreal, GameMaker and more.

## Deploy with Docker / Coolify

The repository contains a ready-to-use `docker-compose.yml`:

| Service | What it is | Exposed |
|---|---|---|
| `web` | SvelteKit app (Node, port 3010) – the only public service, published on host port 3010 | yes |
| `api` | Django REST API (gunicorn, port 9010), only reachable from `web` | no |

Data (SQLite database and the generated Django secret key) is stored in the `storyliner-data` volume.
Migrations run automatically when the API starts.

**Coolify**
1. *New resource → Docker Compose* (or *Public/Private Repository* with build pack *Docker Compose*), pointing at this repository and `docker-compose.yml`.
2. Assign a domain to the `web` service (Coolify pre-fills one through `SERVICE_FQDN_WEB_3010`; it must point to port 3010).
3. Deploy. Optional environment variables: `DJANGO_SECRET_KEY` (otherwise generated once and kept in the volume), `GUNICORN_WORKERS` (default 3).
4. Back up the `storyliner-data` volume – it holds all users and stories.

**Locally**
```
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```
Then open http://localhost:3010 (use `WEB_PORT=3100 docker compose ...` if port 3010 is taken).

## Development setup

**API** (Django REST, `api/`)
```
cd api
python -m venv venv && venv/Scripts/activate   # or: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 9010
```
Environment variables: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG` (`1` by default, `0` in Docker),
`DJANGO_ALLOWED_HOSTS` (comma separated), `DJANGO_DATA_DIR` (where `db.sqlite3` lives).

**Client** (SvelteKit, `client/`)
```
cd client
cp .env.example .env      # API_URL=http://127.0.0.1:9010/api (read at runtime, server-side only)
npm install
npm run dev               # npm test runs the exporter tests
```

## Using the editor
- A story can hold several **dialogues** (dialogue graphs): create, rename and delete them in the *Dialogues* list of the sidebar. With more than one, tabs in the top bar switch between them (double-click a tab to rename it).
- Add characters in the left panel, then drag one onto the canvas to write a line (a section is created if you drop on empty space).
- Drag from a line's right handle to another line to connect them, or onto empty space to create the follow-up line.
- Click the **+** at the bottom of a line to add a **player choice**. Each choice has its own text, id and handle: drag from it to the line it leads to (or onto empty space to create that line). A choice without an arrow ends the dialogue. A line with choices continues only through them, so its plain right handle disappears (existing arrows move onto choices).
- Click the **tag** button on a choice (or in a line's header) to give it **custom keys** – e.g. `condition: "strength >= 5"` to lock a choice behind a stat, or a `mood` on a line. Each key is text, a number, yes/no or a **dropdown** with its own options (click the pencil next to a dropdown to edit them, comma separated).
- **Presets** (toolbar) are named sets of custom keys with default values, for choices and for nodes (lines). Apply one from a key list; the preset marked *Default* is added to every new choice / node.
- Every line and choice shows its **id** (generated as `L1`, `C1`, ...). Click an id to change it; ids must be unique across all dialogues, and arrows follow the rename.
- Double-click a section title to rename it; select a section to resize it. Dragging a line into another section moves it there.
- `Delete`/`Backspace` removes the selection, `Ctrl+S` saves immediately (saving is otherwise automatic).
- *Import* loads a Storyliner JSON file; *Export* offers all formats below. The Storyliner JSON backup holds every dialogue; the engine formats export the dialogue that is open.

## Exporting to game engines

How the graph is translated (same for every script format):
- Lines that simply follow each other are grouped into one **block** (Yarn node, ink knot, Dialogue Manager title, Ren'Py label, Twine passage), named `<Section>_<n>` in reading order.
- A line with **choices** becomes a player choice: each choice is offered with its text and id (the id is the option's localization key where the format supports it) and jumps to its target, or ends the dialogue if it has none.
- A line with **several outgoing arrows** also becomes a player choice: each target line is offered as an option (its text is the option label) and is then spoken. On a line with choices, plain arrows are added as extra options.
- A line with one arrow into a line that is reached from elsewhere becomes a jump; a line without arrows ends the dialogue.
- **Entry points** are lines without incoming arrows (plus the first line of any loop that nothing leads into). The first one is the start (`Start` node, `start` label, ...).
- Multi-line text is split into one line of dialogue per text line. Lines without text are skipped in script formats.
- Every spoken line carries its Storyliner id as a localization key, so translations survive re-exports.

| Format | File | Engines / tools | Notes |
|---|---|---|---|
| Storyliner JSON | `.json` | Backup, re-import | The native format described below. |
| Yarn Spinner | `.yarn` | Unity, Godot, Unreal (Yarn Spinner); GameMaker (Chatterbox) | `Start` node jumps to the first entry; `#line:` ids. |
| ink | `.ink` | Unity (ink-unity-integration), Unreal (Inkpot), Godot (godot-ink), web (inkjs) | Sticky `+ [option] -> knot` choices, `#id:` tags. Compiles with inklecate. |
| Dialogue Manager | `.dialogue` | Godot 4 (Dialogue Manager 3) | Start title `start`, `[ID:...]` static translation keys. |
| Ren'Py script | `.rpy` | Ren'Py | Drop into `game/`; characters are `define`d with their editor color; story starts at `label start`. |
| Twine (Twee 3) | `.twee` | Twine 2 (Library → Import), Tweego, Harlowe, SugarCube | One passage per block with links for jumps and choices. |
| CSV table | `.csv` | Unreal DataTable, spreadsheets, localization tools | See row struct below; custom node keys become extra columns after `IsStart`. |
| Flat JSON graph | `.json` | Any engine / custom code | `{ start, entries, characters, lines: [{ ...custom node keys, id, section, speakerId, speakerName, text, next, choices: [{ id, text, next, ...custom keys }] }] }` – flat arrays only, works with Unity's `JsonUtility`. |

**Unreal DataTable (CSV):** create a row struct with these fields, then import the CSV as a DataTable using it:

```cpp
USTRUCT(BlueprintType)
struct FStorylinerChoice
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName Id;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Text;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName Next;   // None = ends the dialogue
    // Custom choice keys are exported as extra properties – add one per key, e.g.:
    // UPROPERTY(EditAnywhere, BlueprintReadOnly) FString condition;
};

USTRUCT(BlueprintType)
struct FStorylinerLine : public FTableRowBase
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName Section;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName SpeakerId;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Speaker;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FText Text;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FName> Next;   // several entries = player choice
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FStorylinerChoice> Choices;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) bool IsStart;
};
```

## Storyliner JSON format
- A story has `graphs`: one `{ "id", "name", "sections" }` per dialogue. Files with top-level `sections` (older format) are read as a single dialogue.
- `next` is always an array of line ids (empty for the last line) within the same dialogue.
- `choices` (optional) is an array of `{ "id", "text", "next" }`, where `next` is a single line id or `""` (ends the dialogue). Line and choice ids share one namespace. Any other plain key (string, number, boolean) on a choice, or in a line's `data` besides `character`, `content`, `next` and `choices`, is a custom key.
- A custom key with dropdown options lists them in `meta.options` of its choice or line: `"meta": { "options": { "mood": ["happy", "sad"] } }`. The key itself holds the selected value.
- `choicePresets` and `nodePresets` (optional) are arrays of `{ "id", "name", "default", "fields": [{ "key", "type": "text" | "number" | "boolean" | "dropdown", "value", "options"? }] }`.
- Positions are `"x,y"`; line positions are relative to their section. Section `size` is `"width,height"`.
- Unknown keys (e.g. `custom_key`) are preserved when the story is edited.

```json
{
    "name": "First Level",
    "graphs": [
        {
            "id": "D1",
            "name": "Intro",
            "sections": [
                {
                    "meta": {
                        "id": "S0",
                        "position": "0,0",
                        "type": "section",
                        "custom_key": "Custom data",
                        "size": "640,400"
                    },
                    "label": "First Section",
                    "texts": [
                        {
                            "meta": {
                                "id": "0",
                                "position": "24,56",
                                "type": "text",
                                "parentId": "S0",
                                "custom_key": "Custom data"
                            },
                            "data": {
                                "character": {
                                    "id": "characterId",
                                    "name": "Character Name",
                                    "meta": ""
                                },
                                "content": "Are you free tomorrow?",
                                "next": [
                                    "1"
                                ]
                            }
                        },
                        {
                            "meta": {
                                "id": "1",
                                "position": "320,56",
                                "type": "text",
                                "parentId": "S0",
                                "custom_key": "Custom data"
                            },
                            "data": {
                                "character": {
                                    "id": "characterId",
                                    "name": "Character Name",
                                    "meta": ""
                                },
                                "content": "Oh, okay.",
                                "next": []
                            }
                        }
                    ]
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