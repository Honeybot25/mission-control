/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default Next.js config - no custom output mode
  // This allows Vercel to handle deployment automatically
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
