/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/**/*.{js,jsx}",
		"./components/**/*.{js,jsx}",
		"./lib/**/*.{js,jsx}"
	],
	theme: {
		extend: {
			colors: {
				"border-gray": "#BDC2C7",
				"button-gray": "#ECECEC",
				"text-white": "#FFFFFF",
				"text-blue": "#5CA0E2",
				"text-dark": "#182434",
				"text-light": "#808080",
				"custom-blue": "#5CA0E2",
				"custom-orange": "linear-gradient(to right, #FFA033, #FFC042)",
				"custom-blue-gray": "#182434",
				"custom-table-head": "#CFE6FC",
				"custom-table-soft-blue": "#E7F2FD",
				"custom-button-green": "#2A6AA2"
			},
			fontFamily: {
				montserrat: ['var(--font-montserrat)', 'sans-serif'],
			},
			boxShadow: {
				custom: '0px 2px 20px 0px rgba(0, 0, 0, 0.25)',
			},
		},
	},
	plugins: [],
};
