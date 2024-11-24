import { PUBLIC_API } from '$env/static/public';
import { fail } from '@sveltejs/kit';

export const actions = {
    register: async (event) => {
        const data = await event.request.formData();
        const username = data.get('username')
        const password = data.get('password')
        const confirmPassword = data.get('confirmPassword')
        const email = data.get('email')

        if (!username || !password || !email) {
            return fail(400, {
                error: "Missing required fields"
            });
        }

        if (password !== confirmPassword) {
            return fail(400, {
                error: "Passwords do not match"
            });
        }

        const response = await fetch(PUBLIC_API + "/register/", {
            method: 'POST',
            body: JSON.stringify({
                username: data.get('username'),
                password: data.get('password'),
                email: data.get('email')
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const tokens = await response.json();

            event.cookies.set('access', tokens.access, {
                path: '/',
                httpOnly: true,
            });
            event.cookies.set('refresh', tokens.refresh, {
                path: '/',
                httpOnly: true,
            })

            return {
                success: true
            }

        } else {
            return fail(response.status, {
                error: "Failed to register"
            });
        }
    },

    login: async (event) => {
        const data = await event.request.formData();
        const username = data.get('username')
        const password = data.get('password')

        if (!username || !password) {
            return fail(400, {
                error: "Missing required fields"
            });
        }

        const response = await fetch(PUBLIC_API + "/token/", {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const tokens = await response.json();
            console.log(tokens)

            event.cookies.set('access', tokens.access, {
                path: '/',
                httpOnly: true,
            });
            event.cookies.set('refresh', tokens.refresh, {
                path: '/',
                httpOnly: true,
            })

            return {
                success: true
            }

        } else {
            return fail(response.status, {
                error: "Failed to login"
            });
        }
    },
}