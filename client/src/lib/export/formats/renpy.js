import { characterHex } from '$lib/story/characters';
import { identifier, joinLines, textLines, uniqueNamer } from '../text';

/** Names Ren'Py (or Python) already uses. */
const RESERVED = new Set(
	(
		'narrator centered extend adv nvl config gui style store persistent renpy build define default ' +
		'label menu jump call return pass if elif else while for in and or not is with show hide scene ' +
		'play stop queue voice image init python screen transform at as behind onlayer zorder expression ' +
		'True False None start'
	).split(' ')
);

/** Ren'Py say-statement string: escape quotes/backslashes and text-tag/interpolation brackets. */
const quote = (/** @type {string} */ text) =>
	`"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\[/g, '[[').replace(/\{/g, '{{')}"`;

/**
 * Ren'Py script (.rpy) – drop into the `game/` folder of a Ren'Py project.
 * Each block is a label, choices are `menu:` entries, characters are `define`d with their editor color.
 * @param {import('../graph').CompiledStory} story
 */
export function renderRenpy(story) {
	const uniqueVar = uniqueNamer();
	/** @type {Map<string, string>} */
	const variables = new Map();
	for (const speaker of story.speakers) {
		let name = identifier(speaker.name, 'c').toLowerCase();
		if (RESERVED.has(name) || name.startsWith('_')) name = `c_${name}`;
		variables.set(speaker.id, uniqueVar(name));
	}
	/** @param {string} name */
	const label = (name) => name.toLowerCase();

	const out = [`# ${story.name.replace(/\r?\n/g, ' ')} – exported from Storyliner`, ''];
	for (const speaker of story.speakers) {
		out.push(
			`define ${variables.get(speaker.id)} = Character(${quote(speaker.name)}, color=${quote(characterHex(speaker.id))})`
		);
	}
	if (story.speakers.length) out.push('');

	out.push(
		'label start:',
		`    ${story.entries.length ? `jump ${label(story.entries[0].name)}` : 'return'}`,
		''
	);

	for (const block of story.blocks) {
		out.push(`label ${label(block.name)}:`);

		for (const line of block.lines) {
			const speaker = line.speaker ? variables.get(line.speaker.id) : null;
			for (const text of textLines(line.text)) {
				out.push(`    ${speaker ? `${speaker} ` : ''}${quote(text)}`);
			}
		}

		const { exit } = block;
		if (exit.type === 'end') out.push('    return');
		if (exit.type === 'goto') out.push(`    jump ${label(exit.target.name)}`);
		if (exit.type === 'choice') {
			out.push('    menu:');
			for (const option of exit.options) {
				out.push(
					`        ${quote(option.label)}:`,
					`            ${option.target ? `jump ${label(option.target.name)}` : 'return'}`
				);
			}
		}
		out.push('');
	}

	return joinLines(out);
}
