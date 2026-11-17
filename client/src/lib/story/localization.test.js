import { describe, expect, it } from 'vitest';
import { normalizeStory } from './model';
import { cleanLanguage, sectionsOf, syncSections, variantsOf, withSections } from './localization';

/** @param {string} id @param {string} content @param {string[]} next @param {any[]} [choices] */
const line = (id, content, next = [], choices = []) => ({
	meta: { id, type: 'text', parentId: 'S1', position: '0,0' },
	data: { character: null, content, next, choices }
});
/** @param {any[]} texts */
const sections = (texts) => [
	{ meta: { id: 'S1', position: '0,0', size: '640,400' }, label: 'Intro', texts }
];

describe('localizations', () => {
	it('normalizes localizations and drops duplicates or the original language', () => {
		const story = normalizeStory({
			graphs: [
				{
					id: 'D1',
					language: 'en',
					sections: sections([line('L1', 'Hello')]),
					localizations: [
						{ language: 'de', sections: sections([line('L1', 'Hallo')]) },
						{ language: 'de', sections: [] },
						{ language: 'en', sections: [] },
						{ language: ' pt_br ', sections: [] },
						{ language: '', sections: [] }
					]
				}
			]
		});
		const graph = story.graphs[0];
		expect(variantsOf(graph)).toEqual(['', 'de', 'pt-BR']);
		expect(sectionsOf(graph, 'de')[0].texts[0].data.content).toBe('Hallo');
		expect(sectionsOf(graph, 'fr')).toBe(graph.sections);
		expect(withSections(graph, 'de', []).localizations[0].sections).toEqual([]);
	});

	it('keeps graphs without localizations unchanged', () => {
		const graph = normalizeStory({ graphs: [{ id: 'D1', sections: [] }] }).graphs[0];
		expect(graph).not.toHaveProperty('localizations');
		expect(graph).not.toHaveProperty('language');
		expect(cleanLanguage('  ')).toBe('');
	});

	it('copies the structure without text into a new localization', () => {
		const source = normalizeStory({
			sections: sections([
				line('L1', 'Hello', [], [{ id: 'C1', text: 'Hi', next: 'L2', mood: 'calm' }]),
				line('L2', 'Bye')
			])
		}).graphs[0].sections;
		const { sections: copy, removed } = syncSections(source, []);
		expect(removed).toEqual({ lines: [], choices: [] });
		expect(copy[0].label).toBe('Intro');
		expect(copy[0].texts.map((/** @type {any} */ t) => t.data.content)).toEqual(['', '']);
		expect(copy[0].texts[0].data.choices[0]).toMatchObject({
			id: 'C1',
			text: '',
			next: 'L2',
			mood: 'calm'
		});
		// The source is not touched.
		expect(source[0].texts[0].data.content).toBe('Hello');
	});

	it('keeps translated text and reports removed lines and choices', () => {
		const source = normalizeStory({
			sections: sections([
				line('L1', 'Hello', [], [{ id: 'C1', text: 'Hi', next: 'L3' }]),
				line('L3', 'New line')
			])
		}).graphs[0].sections;
		const target = normalizeStory({
			sections: sections([
				line(
					'L1',
					'Hallo',
					[],
					[
						{ id: 'C1', text: 'Hey', next: 'L2' },
						{ id: 'C2', text: 'Nein', next: '' }
					]
				),
				line('L2', 'Tschüss')
			])
		}).graphs[0].sections;

		const { sections: synced, removed } = syncSections(source, target);
		const [l1, l3] = synced[0].texts;
		expect(l1.data.content).toBe('Hallo');
		expect(l1.data.choices).toEqual([
			expect.objectContaining({ id: 'C1', text: 'Hey', next: 'L3' })
		]);
		expect(l3.data.content).toBe('');
		expect(removed.lines).toEqual([{ id: 'L2', content: 'Tschüss' }]);
		expect(removed.choices).toEqual([{ id: 'C2', lineId: 'L1', text: 'Nein' }]);
	});
});
