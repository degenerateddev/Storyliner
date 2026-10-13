import { describe, expect, it } from 'vitest';
import { flowToStory, storyToFlow } from './convert';
import {
	applyPreset,
	changeFieldType,
	cleanKey,
	cleanOptions,
	LINE_KEYS,
	normalizePresets,
	normalizeStory,
	splitFields,
	CHOICE_KEYS
} from './model';

/** @param {string} id @param {string[]} next @param {any[]} [choices] @param {object} [extra] */
const text = (id, next, choices, extra = {}) => ({
	meta: { id, type: 'text', parentId: 'S1', position: '0,0' },
	data: { character: null, content: id, next, choices, ...extra }
});

const story = (/** @type {any[]} */ texts, extra = {}) =>
	normalizeStory({
		name: 'Keys',
		...extra,
		sections: [{ meta: { id: 'S1', position: '0,0', size: '640,400' }, label: 'S', texts }]
	});

/** The single graph of a test story. @param {any} normalized */
const graphOf = (normalized) => normalized.graphs[0];

describe('choice custom keys', () => {
	it('splits editable keys from Storyliner keys and nested data', () => {
		expect(
			splitFields(
				{ id: 'C1', text: 'Hi', next: '', cost: 5, locked: true, stat: 'str', ext: { a: 1 } },
				CHOICE_KEYS
			)
		).toEqual({
			values: { cost: 5, locked: true, stat: 'str' },
			rest: { id: 'C1', text: 'Hi', next: '', ext: { a: 1 } }
		});
	});

	it('rejects keys Storyliner owns', () => {
		expect(cleanKey(' needs stat ')).toBe('needs_stat');
		expect(cleanKey('next')).toBe('');
		expect(cleanKey('meta')).toBe('');
		expect(cleanKey('content', LINE_KEYS)).toBe('');
		expect(cleanKey('text', LINE_KEYS)).toBe('text');
	});

	it('round-trips custom keys through the canvas', () => {
		const original = story([
			text(
				'A',
				[],
				[{ id: 'C1', text: 'Go', next: 'B', condition: 'str >= 5', cost: 2, ext: { a: 1 } }]
			),
			text('B', [])
		]);
		const { nodes, edges } = storyToFlow(graphOf(original));
		const choice = nodes.find((node) => node.id === 'A').data.choices[0];
		expect(choice.fields).toEqual([
			{ key: 'condition', type: 'text', value: 'str >= 5' },
			{ key: 'cost', type: 'number', value: 2 }
		]);

		choice.fields = [{ key: 'condition', type: 'text', value: 'str >= 6' }];
		const saved = flowToStory(nodes, edges, []);
		expect(saved.sections[0].texts[0].data.choices[0]).toEqual({
			ext: { a: 1 },
			condition: 'str >= 6',
			id: 'C1',
			text: 'Go',
			next: 'B'
		});
	});

	it('keeps dropdown options in meta.options', () => {
		const original = story([
			text(
				'A',
				[],
				[
					{
						id: 'C1',
						text: 'Go',
						next: '',
						tone: 'calm',
						meta: { options: { tone: ['calm', 'rude'] } }
					}
				]
			)
		]);
		const { nodes, edges } = storyToFlow(graphOf(original));
		const choice = nodes[1].data.choices[0];
		expect(choice.fields).toEqual([
			{ key: 'tone', type: 'dropdown', value: 'calm', options: ['calm', 'rude'] }
		]);

		choice.fields = [changeFieldType(choice.fields[0], 'text')];
		expect(flowToStory(nodes, edges, []).sections[0].texts[0].data.choices[0]).toEqual({
			id: 'C1',
			text: 'Go',
			next: '',
			tone: 'calm'
		});
	});

	it('turns plain arrows of a line with choices into choices', () => {
		const { nodes, edges } = storyToFlow(
			graphOf(
				story([
					text('A', ['C'], [{ id: 'C1', text: 'Go', next: 'B' }]),
					text('B', []),
					text('C', [])
				])
			)
		);
		expect(
			nodes.find((node) => node.id === 'A').data.choices.map((/** @type {any} */ c) => c.id)
		).toEqual(['C1', 'C2']);
		expect(
			edges.filter((edge) => edge.source === 'A').map((e) => [e.sourceHandle, e.target])
		).toEqual([
			['C1', 'B'],
			['C2', 'C']
		]);
	});

	it('does not generate ids used in other graphs', () => {
		const { nodes } = storyToFlow(
			graphOf(story([text('A', ['B'], [{ id: 'C1', text: 'Go', next: '' }]), text('B', [])])),
			['C2']
		);
		expect(nodes[1].data.choices.map((/** @type {any} */ c) => c.id)).toEqual(['C1', 'C3']);
	});
});

describe('node custom keys', () => {
	it('round-trips through the canvas, with dropdown options in meta.options', () => {
		const original = story([text('A', [], [], { mood: 'happy', volume: 3, ext: { a: 1 } })]);
		original.graphs[0].sections[0].texts[0].meta.options = { mood: ['happy', 'sad'] };
		const { nodes, edges } = storyToFlow(graphOf(original));
		expect(nodes[1].data.fields).toEqual([
			{ key: 'mood', type: 'dropdown', value: 'happy', options: ['happy', 'sad'] },
			{ key: 'volume', type: 'number', value: 3 }
		]);

		nodes[1].data.fields = [{ key: 'mood', type: 'dropdown', value: 'sad', options: ['sad'] }];
		const saved = flowToStory(nodes, edges, []).sections[0].texts[0];
		expect(saved.meta.options).toEqual({ mood: ['sad'] });
		expect(saved.data).toEqual({
			character: null,
			content: 'A',
			next: [],
			choices: [],
			ext: { a: 1 },
			mood: 'sad'
		});

		nodes[1].data.fields = [];
		const cleared = flowToStory(nodes, edges, []).sections[0].texts[0];
		expect(cleared.meta).not.toHaveProperty('options');
		expect(cleared.data).not.toHaveProperty('mood');
	});
});

describe('field types', () => {
	it('cleans dropdown options', () => {
		expect(cleanOptions(' a, b ,, a ')).toEqual(['a', 'b']);
		expect(cleanOptions(['x', 2, null])).toEqual(['x', '2']);
	});

	it('turns a value into a dropdown with that value as option', () => {
		expect(changeFieldType({ key: 'k', type: 'text', value: 'calm' }, 'dropdown')).toEqual({
			key: 'k',
			type: 'dropdown',
			value: 'calm',
			options: ['calm']
		});
		expect(
			changeFieldType({ key: 'k', type: 'dropdown', value: 'a', options: ['a'] }, 'number')
		).toEqual({ key: 'k', type: 'number', value: 0 });
	});
});

describe('presets', () => {
	it('normalizes presets: one default, typed values, unique valid keys', () => {
		const presets = normalizePresets([
			{
				id: 'p1',
				name: 'Stat check',
				default: true,
				fields: [
					{ key: 'stat', type: 'text', value: 'str' },
					{ key: 'min', type: 'number', value: '5' },
					{ key: 'min', type: 'text' },
					{ key: 'id', type: 'text' },
					{ key: 'hidden', type: 'boolean', value: 'true' },
					{ key: 'tone', type: 'dropdown', value: 'loud', options: 'calm, rude' }
				]
			},
			{ id: 'p2', name: 'Effect', default: true, fields: [{ key: 'effect' }] }
		]);
		expect(presets.map((p) => p.default)).toEqual([true, false]);
		expect(presets[0].fields).toEqual([
			{ key: 'stat', type: 'text', value: 'str' },
			{ key: 'min', type: 'number', value: 5 },
			{ key: 'hidden', type: 'boolean', value: true },
			{ key: 'tone', type: 'dropdown', value: '', options: ['calm', 'rude'] }
		]);
		expect(presets[1].fields).toEqual([{ key: 'effect', type: 'text', value: '' }]);
	});

	it('adds only missing keys when applied', () => {
		const [preset] = normalizePresets([
			{
				fields: [
					{ key: 'stat', value: 'str' },
					{ key: 'min', type: 'number', value: 5 }
				]
			}
		]);
		expect(applyPreset([{ key: 'stat', type: 'text', value: 'dex' }], preset)).toEqual([
			{ key: 'stat', type: 'text', value: 'dex' },
			{ key: 'min', type: 'number', value: 5 }
		]);
	});

	it('are kept with the story, with the reserved keys of their kind', () => {
		const normalized = story([], {
			choicePresets: [{ id: 'p', name: 'P', fields: [] }],
			nodePresets: [{ id: 'n', name: 'N', fields: [{ key: 'content' }, { key: 'text' }] }]
		});
		expect(normalized.choicePresets).toEqual([{ id: 'p', name: 'P', default: false, fields: [] }]);
		expect(normalized.nodePresets[0].fields).toEqual([{ key: 'text', type: 'text', value: '' }]);
		expect(story([])).not.toHaveProperty('choicePresets');
		expect(story([])).not.toHaveProperty('nodePresets');
	});
});

describe('dialogue graphs', () => {
	it('reads a story with top-level sections as one graph', () => {
		const normalized = story([text('A', [])]);
		expect(normalized).not.toHaveProperty('sections');
		expect(normalized.graphs).toHaveLength(1);
		expect(normalized.graphs[0]).toMatchObject({ id: 'D1', name: 'Dialogue 1' });
		expect(normalized.graphs[0].sections[0].texts[0].meta.id).toBe('A');
	});

	it('always has a graph, with unique ids and names', () => {
		expect(normalizeStory({}).graphs).toEqual([{ id: 'D1', name: 'Dialogue 1', sections: [] }]);
		const { graphs } = normalizeStory({
			graphs: [{ id: 'x', name: 'Intro', sections: [] }, { id: 'x' }, null]
		});
		expect(graphs.map((/** @type {any} */ g) => [g.id, g.name])).toEqual([
			['x', 'Intro'],
			['D1', 'Dialogue 2']
		]);
	});

	it('keeps arrows inside their graph', () => {
		const section = (/** @type {string} */ id, /** @type {any[]} */ texts) => ({
			meta: { id, position: '0,0' },
			texts
		});
		const { graphs } = normalizeStory({
			graphs: [
				{ id: 'a', sections: [section('S1', [text('A', ['B'])])] },
				{ id: 'b', sections: [section('S2', [text('B', [])])] }
			]
		});
		expect(graphs[0].sections[0].texts[0].data.next).toEqual([]);
	});
});
