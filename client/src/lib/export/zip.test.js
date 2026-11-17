import { describe, expect, it } from 'vitest';
import { crc32, createZip } from './zip';

describe('zip', () => {
	it('computes the standard CRC-32', () => {
		expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
	});

	it('writes one stored entry per file and an end record', () => {
		const zip = createZip([
			{ name: 'a.en.yarn', content: 'Hello' },
			{ name: 'a.de.yarn', content: 'Grüß dich' }
		]);
		const view = new DataView(zip.buffer);
		expect(view.getUint32(0, true)).toBe(0x04034b50);
		const end = zip.length - 22;
		expect(view.getUint32(end, true)).toBe(0x06054b50);
		expect(view.getUint16(end + 10, true)).toBe(2);
	});
});
