/** Space kept between a section's border and the lines inside (top leaves room for the label). */
export const SECTION_PADDING = { x: 24, top: 56, bottom: 24 };

/**
 * Grow sections so they wrap all their lines (with padding). A line sticking out on the left or
 * top moves the section's border there; its lines are shifted back so nothing moves on screen.
 * Sections never shrink.
 * @param {any[]} nodes - Svelte Flow nodes; lines have positions relative to their section
 * @param {Iterable<string>} sectionIds - sections to check
 * @param {(node: any) => { width: number, height: number }} sizeOf
 * @returns {any[]} `nodes` itself when nothing had to change
 */
export function fitSections(nodes, sectionIds, sizeOf) {
	/** @type {Map<string, { shift: { x: number, y: number }, size: { width: number, height: number }, position: { x: number, y: number } }>} */
	const changes = new Map();
	for (const sectionId of new Set(sectionIds)) {
		const section = nodes.find((node) => node.id === sectionId && node.type === 'section');
		const children = nodes.filter((node) => node.parentId === sectionId);
		if (!section || !children.length) continue;

		const boxes = children.map((child) => ({ ...child.position, ...sizeOf(child) }));
		const shift = {
			x: Math.max(0, SECTION_PADDING.x - Math.min(...boxes.map((box) => box.x))),
			y: Math.max(0, SECTION_PADDING.top - Math.min(...boxes.map((box) => box.y)))
		};
		const current = sizeOf(section);
		const size = {
			width: Math.max(
				current.width + shift.x,
				...boxes.map((box) => box.x + shift.x + box.width + SECTION_PADDING.x)
			),
			height: Math.max(
				current.height + shift.y,
				...boxes.map((box) => box.y + shift.y + box.height + SECTION_PADDING.bottom)
			)
		};
		if (!shift.x && !shift.y && size.width === current.width && size.height === current.height)
			continue;
		changes.set(sectionId, {
			shift,
			size,
			position: { x: section.position.x - shift.x, y: section.position.y - shift.y }
		});
	}
	if (!changes.size) return nodes;

	return nodes.map((node) => {
		const own = changes.get(node.id);
		if (own) return { ...node, position: own.position, ...own.size };
		const parent = node.parentId && changes.get(node.parentId);
		if (!parent || (!parent.shift.x && !parent.shift.y)) return node;
		return {
			...node,
			position: { x: node.position.x + parent.shift.x, y: node.position.y + parent.shift.y }
		};
	});
}
