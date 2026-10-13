import { CHOICE_KEYS, splitFields } from '$lib/story/model';

/** @param {Record<string, any>} choice */
const choiceFields = (choice) => splitFields(choice, CHOICE_KEYS).values;

/** @param {unknown} value */
const csvField = (value) => {
	const text = String(value ?? '');
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** @param {string} text */
const unrealString = (text) => JSON.stringify(text.replace(/[\r\n]+/g, ' '));

/** @param {import('$lib/story/model').FieldValue} value */
const unrealValue = (value) => {
	if (typeof value === 'boolean') return value ? 'True' : 'False';
	return typeof value === 'number' ? String(value) : unrealString(value);
};

/** Plain cell value of a custom node key. @param {import('$lib/story/model').FieldValue} value */
const csvValue = (value) =>
	typeof value === 'boolean' ? (value ? 'True' : 'False') : String(value);

/**
 * One row per line – matches an Unreal DataTable row struct with the columns
 * Section (FName), SpeakerId (FName), Speaker (FString), Text (FText), Next (TArray<FName>),
 * Choices (TArray<FStorylinerChoice>: Id FName, Text FString, Next FName, plus one property
 * per custom choice key) and IsStart (bool), followed by one column per custom node key.
 * Also opens in any spreadsheet for proofreading or localization.
 * @param {import('../graph').CompiledStory} story
 */
export function renderCsv(story) {
	const entries = new Set(story.entries.map((block) => block.lines[0].id));
	const keys = [...new Set(story.lines.flatMap((line) => Object.keys(line.fields)))];
	const rows = [
		['Name', 'Section', 'SpeakerId', 'Speaker', 'Text', 'Next', 'Choices', 'IsStart', ...keys]
	];

	for (const line of story.lines) {
		rows.push([
			line.id,
			line.section.label,
			line.speaker?.id ?? '',
			line.speaker?.name ?? '',
			line.text,
			// Unreal's text format for arrays: ("a","b")
			`(${line.next.map((id) => `"${id}"`).join(',')})`,
			// ...and for arrays of structs: ((Id="a",Text="b",Next="c"))
			`(${line.choices
				.map((choice) => {
					const custom = Object.entries(choiceFields(choice)).map(
						([key, value]) => `,${key}=${unrealValue(value)}`
					);
					return `(Id=${unrealString(choice.id)},Text=${unrealString(choice.text)},Next=${unrealString(choice.next)}${custom.join('')})`;
				})
				.join(',')})`,
			entries.has(line.id) ? 'True' : 'False',
			...keys.map((key) => (key in line.fields ? csvValue(line.fields[key]) : ''))
		]);
	}

	return rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}

/**
 * Flat, engine-agnostic graph: a list of lines with ids, speaker and `next` ids.
 * Flat arrays and plain strings only, so it maps directly onto Unity's JsonUtility,
 * Godot's JSON, Unreal's JsonUtilities or a GameMaker struct.
 * @param {import('../graph').CompiledStory} story
 */
export function renderFlatJson(story) {
	const graph = {
		format: 'storyliner-graph',
		version: 1,
		name: story.name,
		start: story.entries[0]?.lines[0].id ?? '',
		entries: story.entries.map((block) => block.lines[0].id),
		characters: story.speakers,
		// Custom node keys come first, so they can never replace Storyliner's own fields.
		lines: story.lines.map((line) => ({
			...line.fields,
			id: line.id,
			section: line.section.label,
			speakerId: line.speaker?.id ?? '',
			speakerName: line.speaker?.name ?? '',
			text: line.text,
			next: line.next,
			// Custom keys sit next to id/text/next, so they map onto extra fields of a choice struct.
			choices: line.choices.map((choice) => ({
				id: choice.id,
				text: choice.text,
				next: choice.next,
				...choiceFields(choice)
			}))
		}))
	};
	return JSON.stringify(graph, null, 2) + '\n';
}
