import { joinLines, optionLabel, speakerName, textLines } from '../text';

/** Link text may not contain the link delimiters. */
const linkText = (/** @type {string} */ text) =>
	text
		.replace(/\]/g, ')')
		.replace(/\[/g, '(')
		.replace(/->|<-|\|/g, ' ')
		.trim() || 'Continue';

/**
 * Twine 2 / Twee 3 (.twee) – importable into Twine and usable with Tweego, Harlowe or SugarCube.
 * Each block is a passage, choices and jumps are links.
 * @param {import('../graph').CompiledStory} story
 * @param {{ ifid?: string }} [options]
 */
export function renderTwee(story, { ifid = crypto.randomUUID() } = {}) {
	const data = {
		ifid: ifid.toUpperCase(),
		format: 'Harlowe',
		'format-version': '3.3.9',
		start: story.entries[0]?.name,
		zoom: 1
	};
	const out = [':: StoryTitle', story.name, '', ':: StoryData', JSON.stringify(data, null, 2), ''];

	for (const block of story.blocks) {
		const { x, y } = block.lines[0].position;
		const metadata = JSON.stringify({
			position: `${Math.max(0, Math.round(x))},${Math.max(0, Math.round(y))}`,
			size: '100,100'
		});
		const tag = block.section.label.replace(/[\s[\]]+/g, '_');
		out.push(`:: ${block.name} [${tag}] ${metadata}`);

		for (const line of block.lines) {
			const name = speakerName(line.speaker);
			for (const text of textLines(line.text)) out.push(name ? `''${name}:'' ${text}` : text);
		}

		const { exit } = block;
		if (exit.type === 'goto') out.push('', `[[Continue->${exit.target.name}]]`);
		if (exit.type === 'choice') {
			out.push('');
			for (const option of exit.options) {
				out.push(`[[${linkText(optionLabel(option.line))}->${option.target.name}]]`);
			}
		}
		out.push('');
	}

	return joinLines(out);
}
