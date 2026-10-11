import { backendFetch, forward } from '$lib/server/backend';

export const POST = async (event) => {
	const story = await event.request.json();
	return forward(await backendFetch(event, '/json/', { method: 'POST', body: { json: story } }));
};
