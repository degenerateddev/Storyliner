import { PUBLIC_API } from '$env/static/public';
import { json } from '@sveltejs/kit';

export const POST = async ({ request, cookies }) => {
	const data = await request.json();
	const token = cookies.get("access");

	if (data) {
		const response = await fetch(PUBLIC_API + "/characters/", {
			method: 'POST',
			body: JSON.stringify({
				"_id": data.id,
				"name": data.name,
				"meta": data.meta
			}),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		});

		return json(response.status);
	} 

	return json(400);
};

export const DELETE = async ({ request, cookies }) => {
	const data = await request.json();
	const token = cookies.get("access");
	
	const response = await fetch(PUBLIC_API + "/character/" + data.id + "/", {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + token
		}
	});

	return json(response.status);
}