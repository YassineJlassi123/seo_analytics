import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['@my-turbo-app/api'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
