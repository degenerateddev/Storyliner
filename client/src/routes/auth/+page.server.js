import { fail, redirect } from '@sveltejs/kit';
import { postPublic, setAuthCookies } from '$lib/server/backend';

/** @param {FormData} data @param {string} key */
const field = (data, key) => String(data.get(key) ?? '').trim();

export const actions = {
	register: async (event) => {
		const { request, fetch } = event;
		const data = await request.formData();
		const username = field(data, 'username');
		const email = field(data, 'email');
		const password = String(data.get('password') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');
		const values = { mode: 'register', username, email };

		if (!username || !email || !password) {
			return fail(400, { ...values, error: 'Please fill in all fields.' });
		}
		if (password !== confirmPassword) {
			return fail(400, { ...values, error: 'Passwords do not match.' });
		}

		let response;
		try {
			response = await postPublic(fetch, '/register/', { username, email, password });
		} catch {
			return fail(503, { ...values, error: 'The server is unreachable. Please try again later.' });
		}
		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			return fail(response.status, { ...values, error: body.error ?? 'Registration failed.' });
		}

		setAuthCookies(event, await response.json());
		redirect(303, '/');
	},

	login: async (event) => {
		const { request, fetch } = event;
		const data = await request.formData();
		const username = field(data, 'username');
		const password = String(data.get('password') ?? '');
		const values = { mode: 'login', username };

		if (!username || !password) {
			return fail(400, { ...values, error: 'Please enter your username and password.' });
		}

		let response;
		try {
			response = await postPublic(fetch, '/token/', { username, password });
		} catch {
			return fail(503, { ...values, error: 'The server is unreachable. Please try again later.' });
		}
		if (!response.ok) {
			return fail(response.status, { ...values, error: 'Wrong username or password.' });
		}

		setAuthCookies(event, await response.json());
		redirect(303, '/');
	}
};
