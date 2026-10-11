import { error, redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const { pathname } = event.url;
	const loggedIn = Boolean(event.cookies.get('refresh'));
	const onAuthPage = pathname === '/auth';

	if (pathname === '/health') return resolve(event);

	if (!loggedIn && !onAuthPage) {
		// fetch() calls from the editor should see a 401, not an HTML redirect.
		if (pathname.startsWith('/actions/')) error(401, 'Not logged in');
		redirect(303, '/auth');
	}
	if (loggedIn && onAuthPage && event.request.method === 'GET') redirect(303, '/');

	return resolve(event);
}
