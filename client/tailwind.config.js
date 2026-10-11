import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				accent: {
					50: '#fdf2f6',
					100: '#fce7ef',
					200: '#fbcfe0',
					300: '#f8a7c4',
					400: '#f2709d',
					500: '#e84679',
					600: '#d81e5b',
					700: '#b8164a',
					800: '#98163f',
					900: '#7f1739',
					DEFAULT: '#d81e5b'
				}
			},
			fontFamily: {
				sans: ['Poppins', ...defaultTheme.fontFamily.sans],
				display: ['"Bungee Shade"', 'cursive']
			}
		}
	},

	plugins: [typography, forms]
};
