import { redirect } from '@sveltejs/kit';
import { backendFetch } from '$lib/server/backend';

/** @typedef {{ id: number, name: string, dialogues: number, characters: number, created_at: string, updated_at: string }} ProjectSummary */

export const load = async (event) => {
	try {
		const response = await backendFetch(event, '/projects/');
		if (response.status === 401) redirect(303, '/auth');
		if (!response.ok) return { projects: /** @type {ProjectSummary[]} */ ([]), offline: true };
		return { projects: /** @type {ProjectSummary[]} */ (await response.json()), offline: false };
	} catch (err) {
		if (err instanceof TypeError)
			return { projects: /** @type {ProjectSummary[]} */ ([]), offline: true };
		throw err;
	}
};
