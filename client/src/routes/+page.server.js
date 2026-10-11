import { redirect } from '@sveltejs/kit';
import { backendFetch } from '$lib/server/backend';

export const load = async (event) => {
	try {
		const [storyResponse, charactersResponse] = await Promise.all([
			backendFetch(event, '/json/'),
			backendFetch(event, '/characters/')
		]);

		if (storyResponse.status === 401 || charactersResponse.status === 401) {
			redirect(303, '/auth');
		}
		if (!storyResponse.ok || !charactersResponse.ok) {
			return { story: null, characters: null, offline: true };
		}

		const { json: story } = await storyResponse.json();
		return { story, characters: await charactersResponse.json(), offline: false };
	} catch (err) {
		// The API is unreachable: let the editor fall back to its local cache.
		if (err instanceof TypeError) return { story: null, characters: null, offline: true };
		throw err;
	}
};
