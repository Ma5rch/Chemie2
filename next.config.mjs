/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ketcher wird als ES-Module ausgeliefert und muss mitkompiliert werden.
  transpilePackages: ["ketcher-react", "ketcher-core", "ketcher-standalone"],
};

nextConfig.headers = async () => [
  { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
];

export default nextConfig;
