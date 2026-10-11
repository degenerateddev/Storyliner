import { error } from '@sveltejs/kit';
import { backendFetch, forward } from '$lib/server/backend';

/** Create or update a character. */
export const POST = async (event) => {
	const { id, name, meta } = await event.request.json();
	if (!id || !name) error(400, 'Character needs an id and a name');

	return forward(
		await backendFetch(event, '/characters/', { method: 'POST', body: { _id: id, name, meta } })
	);
};
