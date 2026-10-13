import { error, redirect } from '@sveltejs/kit';
import { backendFetch } from '$lib/server/backend';

export const load = async (event) => {
	const projectId = event.params.id;
	const path = `/projects/${encodeURIComponent(projectId)}/`;
	try {
		const [storyResponse, charactersResponse] = await Promise.all([
			backendFetch(event, path),
			backendFetch(event, `${path}characters/`)
		]);

		if (storyResponse.status === 401 || charactersResponse.status === 401) {
			redirect(303, '/auth');
		}
		if (storyResponse.status === 404) error(404, 'Story not found');
		if (!storyResponse.ok || !charactersResponse.ok) {
			return { projectId, story: null, characters: null, offline: true };
		}

		const { json: story } = await storyResponse.json();
		return { projectId, story, characters: await charactersResponse.json(), offline: false };
	} catch (err) {
		// The API is unreachable: let the editor fall back to its local cache.
		if (err instanceof TypeError)
			return { projectId, story: null, characters: null, offline: true };
		throw err;
	}
};
