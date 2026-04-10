/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f5f5f7',
                    100: '#e8e8ed',
                    200: '#d2d2d9',
                    300: '#86868b',
                    400: '#434344',
                    500: '#1d1d1f',
                    primary: 'var(--brand-primary)',
                    secondary: 'var(--brand-secondary)',
                    accent: 'var(--brand-accent)',
                },
                surface: {
                    DEFAULT: 'var(--surface-0)',
                    50: 'var(--surface-50)',
                    100: 'var(--surface-100)',
                    200: 'var(--surface-200)',
                    300: 'var(--surface-300)',
                },
                accent: {
                    cyan: '#2997ff',
                    violet: '#5e5ce6',
                    amber: '#f59e0b',
                    rose: '#ff3b30',
                    emerald: '#34c759',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    default: 'var(--border-default)',
                    active: 'var(--border-active)',
                },
                success: 'var(--success)',
                warning: 'var(--warning)',
                danger: 'var(--danger)',
            },
            fontFamily: {
                sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                display: ['var(--font-outfit)', '-apple-system', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-brand': 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,247,1) 100%)',
                'gradient-mesh': 'radial-gradient(at 0% 0%, hsla(210,100%,95%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(210,100%,98%,1) 0, transparent 50%)',
            },
            animation: {
                'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'scale-up': 'scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(24px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleUp: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            },
        },
    },
    plugins: [],
};
