import type { NextConfig } from "next";
import nextra from 'nextra';

const withNextra = nextra({
  // Nextra 4 configuration
  search: false, // Disable search to fix React 19 ref error
});

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.BASE_PATH || '',
  images: {
    unoptimized: true, // Required for static export
  },
};

export default withNextra(nextConfig);
