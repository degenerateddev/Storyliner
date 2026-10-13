import { backendFetch, forward } from '$lib/server/backend';

/** @param {{ params: { id: string } }} event */
const path = ({ params }) => `/projects/${encodeURIComponent(params.id)}/`;

/** Replace the story JSON. */
export const PUT = async (event) => {
	const story = await event.request.json();
	return forward(
		await backendFetch(event, path(event), { method: 'PATCH', body: { json: story } })
	);
};

export const DELETE = async (event) =>
	forward(await backendFetch(event, path(event), { method: 'DELETE' }));
