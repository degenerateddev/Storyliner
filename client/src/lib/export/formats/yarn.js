import { joinLines, lineTag, optionLabel, speakerName, textLines } from '../text';

/** Escape characters that Yarn would read as markup, commands, tags or comments. */
const escape = (/** @type {string} */ text) =>
	text.replace(/[\\{}[\]#<>]/g, '\\$&').replace(/\/\//g, '\\/\\/');

/**
 * Yarn Spinner 2+ (.yarn) – Unity, Godot, Unreal and GameMaker (Chatterbox).
 * Each block is a node, choices are `->` options, every line gets a `#line:` id for localization.
 * @param {import('../graph').CompiledStory} story
 */
export function renderYarn(story) {
	const out = [];

	if (story.entries.length) {
		out.push('title: Start', '---', `<<jump ${story.entries[0].name}>>`, '===', '');
	}

	for (const block of story.blocks) {
		const { x, y } = block.lines[0].position;
		out.push(`title: ${block.name}`, `position: ${Math.round(x)},${Math.round(y)}`, '---');

		for (const line of block.lines) {
			const name = speakerName(line.speaker);
			textLines(line.text).forEach((text, part) => {
				out.push(`${name ? `${name}: ` : ''}${escape(text)} #line:${lineTag(line.id, part)}`);
			});
		}

		const { exit } = block;
		if (exit.type === 'goto') out.push(`<<jump ${exit.target.name}>>`);
		if (exit.type === 'choice') {
			for (const option of exit.options) {
				out.push(`-> ${escape(optionLabel(option.line))}`, `    <<jump ${option.target.name}>>`);
			}
		}
		out.push('===', '');
	}

	return joinLines(out);
}
