import { backendFetch, forward } from '$lib/server/backend';

export const DELETE = async (event) => {
	const project = encodeURIComponent(event.params.id);
	const id = encodeURIComponent(event.params.characterId);
	return forward(
		await backendFetch(event, `/projects/${project}/characters/${id}/`, { method: 'DELETE' })
	);
};
