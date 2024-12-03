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

	return json(200);
};

export const PUT = async ({ request, cookies }) => {
	const data = await request.json();
	const characterId = data.characterId;
	const token = cookies.get("access");

	const response = await fetch(PUBLIC_API + "/character/" + characterId + "/", {
		method: 'PUT',
		body: data,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + token
		}
	});

	return json(200);
};

export const DELETE = async ({ request, cookies }) => {
	const data = await request.json();
	const characterId = data.characterId;
	const token = cookies.get("access");

	const response = await fetch(PUBLIC_API + "/character/" + characterId + "/", {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + token
		}
	});

	return json(200);
};