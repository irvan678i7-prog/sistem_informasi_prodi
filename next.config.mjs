/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tree-shake import ikon/paket besar → bundle JS klien lebih kecil sehingga
  // halaman (login & antarmenu) lebih cepat dimuat.
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
