/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx}',
		'./components/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// Evolved Minimalism Dark Mode Color System
				'background': {
					'primary': '#1A1A1A',      // Moonlit Gray base
					'secondary': '#2A2A2A',    // Elevated surfaces
					'elevated': '#333333',     // Cards and modals
				},
				'text': {
					'primary': '#F5F5F5',      // Off-white primary text
					'secondary': '#A0A0A0',    // Light gray secondary text
					'tertiary': '#6B6B6B',     // Tertiary text and disabled states
				},
				'border': {
					'default': '#3C3C3C',      // Subtle borders
					'focus': '#007AFF',        // Focus indicators
				},
				'accent': {
					'interactive': {
						'default': '#0A84FF',    // Ethereal Blue for interactions
						'hover': '#40A3FF',      // Hover state
						'light': '#007AFF',      // Lighter variant
					},
					'critical': {
						'default': '#FF3B30',    // Electric Red for primary CTAs
						'hover': '#FF7066',      // Hover state
						'light': '#FF453A',      // Lighter variant
					},
				},
				'system': {
					'success': '#30D158',      // Success states
					'warning': '#FF9F0A',      // Warnings
					'error': '#FF453A',        // Errors
				},
			},
			fontFamily: {
				'sans': ['Inter', 'system-ui', 'sans-serif'],
				'display': ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
				'headline': ['Mozilla Headline', 'Outfit', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				// Typography Scale for Evolved Minimalism
				'xs': ['0.75rem', { lineHeight: '1rem' }],      // Caption/Meta
				'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // Small text
				'base': ['1rem', { lineHeight: '1.5rem' }],     // Body regular
				'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // Body large
				'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // Large text
				'2xl': ['1.5rem', { lineHeight: '2rem' }],      // Section headers
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }], // Card titles
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // Screen titles
				'5xl': ['3rem', { lineHeight: '1.1' }],         // Large headings
				'6xl': ['3.75rem', { lineHeight: '1.1' }],      // Hero headings
			},
			fontWeight: {
				'thin': '100',
				'extralight': '200',
				'light': '300',
				'normal': '400',
				'medium': '500',
				'semibold': '600',
				'bold': '700',
				'extrabold': '800',
				'black': '900',
			},
			borderRadius: {
				'xl': '1rem',
				'2xl': '1.5rem',
				'3xl': '2rem',
			},
			boxShadow: {
				'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
				'medium': '0 4px 16px rgba(0, 0, 0, 0.15)',
				'strong': '0 8px 32px rgba(0, 0, 0, 0.2)',
				'glow': '0 0 20px rgba(10, 132, 255, 0.3)',
				'glow-critical': '0 0 20px rgba(255, 59, 48, 0.3)',
			},
			animation: {
				'scale-in': 'scaleIn 150ms ease-out',
				'fade-in': 'fadeIn 200ms ease-out',
				'slide-up': 'slideUp 300ms ease-out',
				'bounce-subtle': 'bounceSubtle 600ms ease-out',
			},
			keyframes: {
				scaleIn: {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				bounceSubtle: {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' },
					'100%': { transform: 'scale(1)' },
				},
			},
		},
	},
	plugins: [],
};


