/**
 * Browser-side calls to the SvelteKit `/actions/*` proxy routes.
 * Never throws: returns `{ ok, status }` (status 0 = network error).
 * @param {string} path
 * @param {string} method
 * @param {unknown} [body]
 */
async function request(path, method, body) {
	try {
		const response = await fetch(path, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		return { ok: response.ok, status: response.status };
	} catch {
		return { ok: false, status: 0 };
	}
}

export const api = {
	/** @param {unknown} story */
	saveStory: (story) => request('/actions/story', 'POST', story),
	/** @param {import('$lib/story/model').Character} character */
	saveCharacter: (character) => request('/actions/characters', 'POST', character),
	/** @param {string} id */
	deleteCharacter: (id) => request(`/actions/characters/${encodeURIComponent(id)}`, 'DELETE')
};
