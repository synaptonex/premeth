/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  // The paper JSON data lives in Supabase Storage, so the Next bundle stays slim.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
