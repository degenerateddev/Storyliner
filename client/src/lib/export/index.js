import { compileStory } from './graph';
import { renderDialogueManager } from './formats/dialogue-manager';
import { renderInk } from './formats/ink';
import { renderRenpy } from './formats/renpy';
import { renderCsv, renderFlatJson } from './formats/tables';
import { renderTwee } from './formats/twee';
import { renderYarn } from './formats/yarn';

/**
 * @typedef {{ story: any }} ExportInput
 * @typedef {{
 *   id: string,
 *   label: string,
 *   engines: string,
 *   extension: string,
 *   mime: string,
 *   render: (input: ExportInput) => string
 * }} ExportFormat
 */

/** @param {(story: import('./graph').CompiledStory, input: ExportInput) => string} render */
const compiled = (render) => (/** @type {ExportInput} */ input) =>
	render(compileStory(input.story), input);

/** @type {ExportFormat[]} */
export const EXPORT_FORMATS = [
	{
		id: 'storyliner',
		label: 'Storyliner JSON',
		engines: 'Backup – can be imported again',
		extension: 'json',
		mime: 'application/json',
		render: ({ story }) => JSON.stringify(story, null, 4) + '\n'
	},
	{
		id: 'yarn',
		label: 'Yarn Spinner',
		engines: 'Unity, Godot, Unreal, GameMaker (Chatterbox)',
		extension: 'yarn',
		mime: 'text/plain',
		render: compiled(renderYarn)
	},
	{
		id: 'ink',
		label: 'ink',
		engines: 'Unity, Unreal (Inkpot), Godot, web (inkjs)',
		extension: 'ink',
		mime: 'text/plain',
		render: compiled(renderInk)
	},
	{
		id: 'dialogue-manager',
		label: 'Dialogue Manager',
		engines: 'Godot 4',
		extension: 'dialogue',
		mime: 'text/plain',
		render: compiled(renderDialogueManager)
	},
	{
		id: 'renpy',
		label: "Ren'Py script",
		engines: "Ren'Py visual novels",
		extension: 'rpy',
		mime: 'text/plain',
		render: compiled(renderRenpy)
	},
	{
		id: 'twee',
		label: 'Twine (Twee 3)',
		engines: 'Twine, Tweego, Harlowe, SugarCube',
		extension: 'twee',
		mime: 'text/plain',
		render: compiled((story, { story: raw }) => renderTwee(story, { ifid: raw.ifid }))
	},
	{
		id: 'csv',
		label: 'CSV table',
		engines: 'Unreal DataTable, spreadsheets, localization',
		extension: 'csv',
		mime: 'text/csv',
		render: compiled(renderCsv)
	},
	{
		id: 'graph-json',
		label: 'Flat JSON graph',
		engines: 'Any engine – Unity JsonUtility, Godot, custom code',
		extension: 'json',
		mime: 'application/json',
		render: compiled(renderFlatJson)
	}
];

/**
 * @param {string} formatId
 * @param {ExportInput} input
 * @returns {{ content: string, extension: string, mime: string }}
 */
export function exportStory(formatId, input) {
	const format = EXPORT_FORMATS.find((f) => f.id === formatId);
	if (!format) throw new Error(`Unknown export format: ${formatId}`);
	return { content: format.render(input), extension: format.extension, mime: format.mime };
}
