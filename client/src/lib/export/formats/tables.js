/** @param {unknown} value */
const csvField = (value) => {
	const text = String(value ?? '');
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * One row per line – matches an Unreal DataTable row struct with the columns
 * Section (FName), SpeakerId (FName), Speaker (FString), Text (FText), Next (TArray<FName>), IsStart (bool).
 * Also opens in any spreadsheet for proofreading or localization.
 * @param {import('../graph').CompiledStory} story
 */
export function renderCsv(story) {
	const entries = new Set(story.entries.map((block) => block.lines[0].id));
	const rows = [['Name', 'Section', 'SpeakerId', 'Speaker', 'Text', 'Next', 'IsStart']];

	for (const line of story.lines) {
		rows.push([
			line.id,
			line.section.label,
			line.speaker?.id ?? '',
			line.speaker?.name ?? '',
			line.text,
			// Unreal's text format for arrays: ("a","b")
			`(${line.next.map((id) => `"${id}"`).join(',')})`,
			entries.has(line.id) ? 'True' : 'False'
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
		lines: story.lines.map((line) => ({
			id: line.id,
			section: line.section.label,
			speakerId: line.speaker?.id ?? '',
			speakerName: line.speaker?.name ?? '',
			text: line.text,
			next: line.next
		}))
	};
	return JSON.stringify(graph, null, 2) + '\n';
}
