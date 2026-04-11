/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		serverComponentsExternalPackages: ['firebase-admin'],
	},
};

module.exports = nextConfig;
