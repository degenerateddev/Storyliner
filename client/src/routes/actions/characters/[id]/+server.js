import { backendFetch, forward } from '$lib/server/backend';

export const DELETE = async (event) => {
	const id = encodeURIComponent(event.params.id);
	return forward(await backendFetch(event, `/characters/${id}/`, { method: 'DELETE' }));
};
