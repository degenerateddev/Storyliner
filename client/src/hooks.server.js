import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	if (event.url.pathname !== "/auth") {
		const cookies = event.cookies;
		if (!(cookies.get("access") && cookies.get("refresh"))) {
			return redirect(303, "/auth");
		}
	}

	const response = await resolve(event);
	return response;
}