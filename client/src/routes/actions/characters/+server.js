import { PUBLIC_API } from '$env/static/public';
import { json } from '@sveltejs/kit';

export const POST = async ({ request, cookies }) => {
	const data = await request.json();
	const token = cookies.get("access");

	const response = await fetch(PUBLIC_API + "/character/", {
		method: 'POST',
		body: data,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + token
		}
	});

	return json(response.status);
};