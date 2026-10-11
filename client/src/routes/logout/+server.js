import { redirect } from '@sveltejs/kit';
import { clearAuthCookies } from '$lib/server/backend';

export const POST = async ({ cookies }) => {
	clearAuthCookies(cookies);
	redirect(303, '/auth');
};
