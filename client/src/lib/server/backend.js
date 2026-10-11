import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

/** Django API base URL, read at runtime (e.g. http://api:8000/api inside Docker). */
const apiUrl = () => (env.API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

const ACCESS_MAX_AGE = 60 * 120; // matches SIMPLE_JWT ACCESS_TOKEN_LIFETIME
const REFRESH_MAX_AGE = 60 * 60 * 24; // matches SIMPLE_JWT REFRESH_TOKEN_LIFETIME

/**
 * Store the JWTs in httpOnly cookies (`secure` whenever the app is served over HTTPS).
 * @param {{ cookies: import('@sveltejs/kit').Cookies, url: URL }} event
 * @param {{ access?: string, refresh?: string }} tokens
 */
export function setAuthCookies({ cookies, url }, { access, refresh }) {
	/** @param {number} maxAge */
	const options = (maxAge) => ({
		path: '/',
		httpOnly: true,
		sameSite: /** @type {const} */ ('lax'),
		secure: url.protocol === 'https:',
		maxAge
	});
	if (access) cookies.set('access', access, options(ACCESS_MAX_AGE));
	if (refresh) cookies.set('refresh', refresh, options(REFRESH_MAX_AGE));
}

/** @param {import('@sveltejs/kit').Cookies} cookies */
export function clearAuthCookies(cookies) {
	cookies.delete('access', { path: '/' });
	cookies.delete('refresh', { path: '/' });
}

/**
 * Unauthenticated JSON request to the Django API.
 * @param {typeof fetch} fetch
 * @param {string} path
 * @param {unknown} body
 */
export function postPublic(fetch, path, body) {
	return fetch(apiUrl() + path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
}

/** @typedef {{ cookies: import('@sveltejs/kit').Cookies, fetch: typeof fetch, url: URL }} BackendEvent */

/** @param {BackendEvent} event */
async function refreshAccessToken(event) {
	const refresh = event.cookies.get('refresh');
	if (!refresh) return false;

	const response = await postPublic(event.fetch, '/token/refresh/', { refresh });
	if (!response.ok) return false;

	setAuthCookies(event, await response.json());
	return true;
}

/**
 * Authenticated request to the Django API. Refreshes the access token once on 401.
 * @param {BackendEvent} event
 * @param {string} path
 * @param {{ method?: string, body?: unknown }} [options]
 */
export async function backendFetch(event, path, { method = 'GET', body } = {}) {
	const send = () =>
		event.fetch(apiUrl() + path, {
			method,
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ' + (event.cookies.get('access') ?? '')
			},
			body: body === undefined ? undefined : JSON.stringify(body)
		});

	let response = await send();
	if (response.status === 401 && (await refreshAccessToken(event))) {
		response = await send();
	}
	if (response.status === 401) {
		clearAuthCookies(event.cookies);
	}
	return response;
}

/**
 * Pass a backend response through to the browser, keeping its status code.
 * @param {Response} response
 */
export async function forward(response) {
	if (response.status === 204) return new Response(null, { status: 204 });
	const data = await response.json().catch(() => null);
	return json(data, { status: response.status });
}
