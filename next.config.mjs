/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse'],
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default nextConfig;
