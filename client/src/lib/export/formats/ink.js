import { joinLines, lineTag, speakerName, textLines } from '../text';

/** Escape everything ink would read as logic, markup, diverts, glue, tags or comments. */
function escape(/** @type {string} */ text) {
	return (
		text
			.replace(/[\\{}[\]|#~]/g, '\\$&')
			.replace(/->|<-|<>/g, (match) => `${match[0]}\\${match[1]}`)
			// Comments are stripped before escapes are handled, so no "//" or "/*" may remain.
			.replace(/\//g, '\\/')
			.replace(/^[*+\-=]/, '\\$&')
			.replace(/^TODO\b/, '\\TODO')
	);
}

/**
 * Inkle's ink (.ink) – Unity (ink-unity-integration), Unreal (Inkpot), Godot (godot-ink), web (inkjs).
 * Each block is a knot, choices are sticky `+ [option] -> knot` lines.
 * @param {import('../graph').CompiledStory} story
 */
export function renderInk(story) {
	const out = [`// ${story.name.replace(/\r?\n/g, ' ')} – exported from Storyliner`];
	out.push(story.entries.length ? `-> ${story.entries[0].name}` : '-> END', '');

	for (const block of story.blocks) {
		out.push(`=== ${block.name} ===`);

		for (const line of block.lines) {
			const name = speakerName(line.speaker);
			textLines(line.text).forEach((text, part) => {
				out.push(`${name ? `${escape(name)}: ` : ''}${escape(text)} #id:${lineTag(line.id, part)}`);
			});
		}

		const { exit } = block;
		if (exit.type === 'end') out.push('-> END');
		if (exit.type === 'goto') out.push(`-> ${exit.target.name}`);
		if (exit.type === 'choice') {
			for (const option of exit.options) {
				out.push(`+ [${escape(option.label)}] -> ${option.target?.name ?? 'END'}`);
			}
		}
		out.push('');
	}

	return joinLines(out);
}
