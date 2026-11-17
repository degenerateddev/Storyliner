import { describe, expect, it } from 'vitest';
import { fitSections, SECTION_PADDING } from './layout';

const section = {
	id: 'S1',
	type: 'section',
	position: { x: 100, y: 100 },
	width: 400,
	height: 300
};
/** @param {number} x @param {number} y */
const line = (x, y) => ({ id: 'L1', type: 'text', parentId: 'S1', position: { x, y } });
/** @param {any} node */
const sizeOf = (node) =>
	node.type === 'section'
		? { width: node.width, height: node.height }
		: { width: 200, height: 100 };

describe('fitSections', () => {
	it('leaves sections that already wrap their lines alone', () => {
		const nodes = [section, line(50, 80)];
		expect(fitSections(nodes, ['S1'], sizeOf)).toBe(nodes);
	});

	it('grows right and down around a line sticking out', () => {
		const [s] = fitSections([section, line(300, 250)], ['S1'], sizeOf);
		expect(s).toMatchObject({
			position: { x: 100, y: 100 },
			width: 300 + 200 + SECTION_PADDING.x,
			height: 250 + 100 + SECTION_PADDING.bottom
		});
	});

	it('grows left and up without moving the line on screen', () => {
		const [s, l] = fitSections([section, line(-30, 10)], ['S1'], sizeOf);
		const shift = { x: SECTION_PADDING.x + 30, y: SECTION_PADDING.top - 10 };
		expect(s.position).toEqual({ x: 100 - shift.x, y: 100 - shift.y });
		expect(s).toMatchObject({ width: 400 + shift.x, height: 300 + shift.y });
		expect(l.position).toEqual({ x: SECTION_PADDING.x, y: SECTION_PADDING.top });
		// Same absolute position as before.
		expect(s.position.x + l.position.x).toBe(100 - 30);
		expect(s.position.y + l.position.y).toBe(100 + 10);
	});
});
