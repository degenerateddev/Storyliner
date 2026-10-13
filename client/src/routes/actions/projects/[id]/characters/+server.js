import { error } from '@sveltejs/kit';
import { backendFetch, forward } from '$lib/server/backend';

/** Create or update a character of the story. */
export const POST = async (event) => {
	const { id, name, meta } = await event.request.json();
	if (!id || !name) error(400, 'Character needs an id and a name');

	const project = encodeURIComponent(event.params.id);
	return forward(
		await backendFetch(event, `/projects/${project}/characters/`, {
			method: 'POST',
			body: { _id: id, name, meta }
		})
	);
};
