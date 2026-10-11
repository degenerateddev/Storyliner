import { text } from '@sveltejs/kit';

/** Liveness probe for Docker / Coolify (exempt from auth in hooks.server.js). */
export const GET = () => text('ok');
