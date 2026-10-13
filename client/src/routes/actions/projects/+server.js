import { backendFetch, forward } from '$lib/server/backend';

/** Create a story (`{ name }` for an empty one, or `{ json }` with a whole story). */
export const POST = async (event) => {
	const { name, json } = await event.request.json();
	return forward(await backendFetch(event, '/projects/', { method: 'POST', body: { name, json } }));
};
