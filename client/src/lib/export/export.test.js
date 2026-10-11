import { describe, expect, it } from 'vitest';
import { Compiler } from 'inkjs/compiler/Compiler';
import { compileStory } from './graph';
import { EXPORT_FORMATS, exportStory } from './index';

const ann = { id: 'c-ann', name: 'Ann', meta: '' };
const bob = { id: 'c-bob', name: 'Bob', meta: '' };

/** @param {string} id @param {any} character @param {string} content @param {string[]} next @param {string} position */
const text = (id, character, content, next, position) => ({
	meta: { id, type: 'text', parentId: 'S1', position },
	data: { character, content, next }
});

// A: Ann asks -> choice B ("Yes") / C ("No"); B -> D -> end; C loops back to A.
// E is a narrator line with characters that are syntax in most formats.
const story = {
	name: 'Test story',
	ifid: '3f2b8d5e-1c4a-4f7e-9a6b-2d8c0e1f3a5b',
	sections: [
		{
			meta: { id: 'S1', type: 'section', position: '100,100', size: '640,400' },
			label: 'First meeting',
			texts: [
				text('A', ann, 'Are you free tomorrow?', ['B', 'C'], '24,56'),
				text('B', bob, 'Yes!', ['D'], '300,20'),
				text('C', bob, 'No.', ['A'], '300,200'),
				text('D', ann, 'Great.\nSee you then.', [], '500,20')
			]
		},
		{
			meta: { id: 'S2', type: 'section', position: '900,100', size: '640,400' },
			label: 'Epilogue',
			texts: [
				text(
					'E',
					null,
					'- Note: {curly} [square] #hash // slashes -> arrow <> glue | pipe "quotes" \\ TODO: x',
					[],
					'24,56'
				)
			]
		}
	]
};

describe('compileStory', () => {
	const compiled = compileStory(story);

	it('groups lines into blocks and detects choices, jumps and entries', () => {
		expect(compiled.blocks.map((b) => [b.name, b.lines.map((l) => l.id), b.exit.type])).toEqual([
			['First_meeting_1', ['A'], 'choice'],
			['First_meeting_2', ['B', 'D'], 'end'],
			['First_meeting_3', ['C'], 'goto'],
			['Epilogue_1', ['E'], 'end']
		]);
		// A is also the target of the loop from C, so it becomes an entry point of its own.
		expect(compiled.entries.map((b) => b.name)).toEqual(['First_meeting_1', 'Epilogue_1']);
		expect(compiled.speakers.map((s) => s.name)).toEqual(['Ann', 'Bob']);
	});

	it('handles pure cycles and empty stories', () => {
		const loop = compileStory({
			sections: [
				{
					meta: { id: 'S', position: '0,0' },
					label: '1st',
					texts: [text('x', null, 'x', ['y'], '0,0'), text('y', null, 'y', ['x'], '0,50')]
				}
			]
		});
		expect(loop.blocks.map((b) => [b.name, b.lines.length, b.exit.type])).toEqual([
			['Section_1st_1', 2, 'goto']
		]);
		expect(loop.entries).toHaveLength(1);
		expect(compileStory({}).blocks).toEqual([]);
	});
});

describe('exports', () => {
	it('renders every format for normal, empty and legacy stories', () => {
		const legacy = {
			sections: [
				{ meta: { id: 0, position: '0,0' }, texts: [{ meta: { id: 1 }, data: { next: '2' } }] }
			]
		};
		for (const format of EXPORT_FORMATS) {
			for (const input of [story, {}, legacy]) {
				expect(exportStory(format.id, { story: input }).content.length).toBeGreaterThan(0);
			}
		}
	});

	it('ink compiles and plays through a choice', () => {
		const source = exportStory('ink', { story }).content;
		/** @type {string[]} */
		const errors = [];
		const options = /** @type {any} */ ({
			errorHandler: (/** @type {string} */ message, /** @type {number} */ type) =>
				type === 2 && errors.push(message)
		});
		const compiler = new Compiler(source, options);
		const runtime = compiler.Compile();
		expect(errors).toEqual([]);

		expect(runtime.ContinueMaximally()).toBe('Ann: Are you free tomorrow?\n');
		expect(runtime.currentChoices.map((c) => c.text)).toEqual(['Yes!', 'No.']);
		runtime.ChooseChoiceIndex(0);
		expect(runtime.ContinueMaximally()).toBe('Bob: Yes!\nAnn: Great.\nAnn: See you then.\n');
		expect(runtime.currentTags).toEqual(['id:D_2']);

		runtime.ChoosePathString('Epilogue_1');
		expect(runtime.ContinueMaximally()).toBe(
			'- Note: {curly} [square] #hash // slashes -> arrow <> glue | pipe "quotes" \\ TODO: x\n'
		);
	});

	it('yarn', () => {
		const yarn = exportStory('yarn', { story }).content;
		expect(yarn).toContain('title: Start\n---\n<<jump First_meeting_1>>\n===');
		expect(yarn).toContain(
			'title: First_meeting_1\nposition: 124,156\n---\nAnn: Are you free tomorrow? #line:A\n-> Yes!\n    <<jump First_meeting_2>>\n-> No.\n    <<jump First_meeting_3>>\n==='
		);
		expect(yarn).toContain('Ann: Great. #line:D\nAnn: See you then. #line:D_2');
		expect(yarn).toContain(
			'\\{curly\\} \\[square\\] \\#hash \\/\\/ slashes -\\> arrow \\<\\> glue'
		);
	});

	it('dialogue manager', () => {
		const dm = exportStory('dialogue-manager', { story }).content;
		expect(dm).toContain('~ start\n=> First_meeting_1');
		expect(dm).toContain(
			'~ First_meeting_1\nAnn: Are you free tomorrow? [ID:A]\n- Yes! => First_meeting_2\n- No. => First_meeting_3'
		);
		expect(dm).toContain('~ First_meeting_3\nBob: No. [ID:C]\n=> First_meeting_1');
		expect(dm).toMatch(/^\\- Note\\: \{curly\} \\\[square\]/m);
	});

	it('twee', () => {
		const twee = exportStory('twee', { story }).content;
		expect(twee).toContain('"ifid": "3F2B8D5E-1C4A-4F7E-9A6B-2D8C0E1F3A5B"');
		expect(twee).toContain('"start": "First_meeting_1"');
		expect(twee).toContain(
			':: First_meeting_1 [First_meeting] {"position":"124,156","size":"100,100"}\n\'\'Ann:\'\' Are you free tomorrow?\n\n[[Yes!->First_meeting_2]]\n[[No.->First_meeting_3]]'
		);
	});

	it("ren'py", () => {
		const rpy = exportStory('renpy', { story }).content;
		expect(rpy).toMatch(/^define ann = Character\("Ann", color="#[0-9a-f]{6}"\)$/m);
		expect(rpy).toContain('label start:\n    jump first_meeting_1');
		expect(rpy).toContain(
			'label first_meeting_1:\n    ann "Are you free tomorrow?"\n    menu:\n        "Yes!":\n            jump first_meeting_2\n        "No.":\n            jump first_meeting_3'
		);
		expect(rpy).toContain('{{curly} [[square] #hash');
		expect(rpy).toContain('\\"quotes\\" \\\\ TODO');
	});

	it('csv and flat json', () => {
		const csv = exportStory('csv', { story }).content.split('\r\n');
		expect(csv[0]).toBe('Name,Section,SpeakerId,Speaker,Text,Next,IsStart');
		expect(csv[1]).toBe('A,First meeting,c-ann,Ann,Are you free tomorrow?,"(""B"",""C"")",True');
		// Rows follow reading order; multi-line text stays in one quoted field.
		expect(csv[3]).toBe('D,First meeting,c-ann,Ann,"Great.\nSee you then.",(),False');

		const graph = JSON.parse(exportStory('graph-json', { story }).content);
		expect(graph.start).toBe('A');
		expect(graph.entries).toEqual(['A', 'E']);
		expect(graph.lines[0]).toEqual({
			id: 'A',
			section: 'First meeting',
			speakerId: 'c-ann',
			speakerName: 'Ann',
			text: 'Are you free tomorrow?',
			next: ['B', 'C']
		});
	});
});
