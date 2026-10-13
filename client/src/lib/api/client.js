/**
 * Browser-side calls to the SvelteKit `/actions/*` proxy routes.
 * Never throws: returns `{ ok, status, data }` (status 0 = network error).
 * @param {string} path
 * @param {string} method
 * @param {unknown} [body]
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
async function request(path, method, body) {
	try {
		const response = await fetch(path, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		const data = await response.json().catch(() => null);
		return { ok: response.ok, status: response.status, data };
	} catch {
		return { ok: false, status: 0, data: null };
	}
}

/** @param {string | number} id */
const project = (id) => `/actions/projects/${encodeURIComponent(id)}`;

export const api = {
	/** @param {{ name?: string, json?: unknown }} [body] - resolves with the new project in `data` */
	createProject: (body = {}) => request('/actions/projects', 'POST', body),
	/** @param {string | number} id @param {unknown} story */
	saveProject: (id, story) => request(project(id), 'PUT', story),
	/** @param {string | number} id */
	deleteProject: (id) => request(project(id), 'DELETE'),
	/** @param {string | number} projectId @param {import('$lib/story/model').Character} character */
	saveCharacter: (projectId, character) =>
		request(`${project(projectId)}/characters`, 'POST', character),
	/** @param {string | number} projectId @param {string} id */
	deleteCharacter: (projectId, id) =>
		request(`${project(projectId)}/characters/${encodeURIComponent(id)}`, 'DELETE')
};
