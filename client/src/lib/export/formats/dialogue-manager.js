import { joinLines, lineTag, speakerName, textLines } from '../text';

/** Words that start a statement instead of a line of dialogue in Dialogue Manager. */
const KEYWORDS = /^(if|elif|else|while|match|when|do|do!|set|import|using)\b/;

/**
 * Text after "Name: ". Unnamed lines also escape colons (otherwise the part before
 * the first colon becomes the speaker) and leading syntax characters.
 * @param {string} text
 * @param {boolean} named
 */
function escape(text, named) {
	let escaped = text.replace(/\{\{/g, '\\{{').replace(/\[/g, '\\[');
	if (!named) {
		escaped = escaped.replace(/:/g, '\\:');
		if (/^[#~\-=%]/.test(escaped) || KEYWORDS.test(escaped)) escaped = `\\${escaped}`;
	}
	return escaped;
}

/**
 * Godot Dialogue Manager 3 (.dialogue).
 * Each block is a `~ title`, choices are `- option => title` responses, lines carry static `[ID:...]` keys.
 * @param {import('../graph').CompiledStory} story
 */
export function renderDialogueManager(story) {
	const out = [`# ${story.name.replace(/\r?\n/g, ' ')} – exported from Storyliner`, ''];

	if (story.entries.length) out.push('~ start', `=> ${story.entries[0].name}`, '');

	for (const block of story.blocks) {
		out.push(`~ ${block.name}`);

		for (const line of block.lines) {
			const name = speakerName(line.speaker);
			textLines(line.text).forEach((text, part) => {
				out.push(
					`${name ? `${name}: ` : ''}${escape(text, Boolean(name))} [ID:${lineTag(line.id, part)}]`
				);
			});
		}

		const { exit } = block;
		if (exit.type === 'end') out.push('=> END');
		if (exit.type === 'goto') out.push(`=> ${exit.target.name}`);
		if (exit.type === 'choice') {
			for (const option of exit.options) {
				const label = escape(option.label, true).replace(/=>/g, '=\\>');
				const id = option.id ? ` [ID:${lineTag(option.id)}]` : '';
				out.push(`- ${label}${id} => ${option.target?.name ?? 'END'}`);
			}
		}
		out.push('');
	}

	return joinLines(out);
}
