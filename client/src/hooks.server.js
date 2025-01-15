import { PUBLIC_API } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const cookies = event.cookies;

	if (event.url.pathname !== "/auth") {
		if (!(cookies.get("access") && cookies.get("refresh"))) {
			return redirect(303, "/auth");
		}
	}

	const response = await resolve(event);

	return response;
}