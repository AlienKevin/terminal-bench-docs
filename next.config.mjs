import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Root -> blog for every host EXCEPT harbor-index.org (which serves the
      // blog at its own root via the rewrite below, keeping the URL clean).
      {
        source: '/',
        destination: '/news/harbor-index',
        permanent: false,
        missing: [{ type: 'host', value: 'harbor-index\\.org' }],
      },
      {
        source: '/registry',
        destination: '/benchmarks',
        permanent: true,
      },
      {
        source: '/registry/terminal-bench/2.0',
        destination: '/benchmarks/terminal-bench-2',
        permanent: true,
      },
      {
        source: '/registry/terminal-bench-core/0.1.1',
        destination: '/benchmarks/terminal-bench-1',
        permanent: true,
      },
      {
        source: '/registry/terminal-bench/2.0/:id',
        destination: '/benchmarks/terminal-bench-2/:id',
        permanent: true,
      },
      {
        source: '/registry/terminal-bench-core/0.1.1/:id',
        destination: '/benchmarks/terminal-bench-1/:id',
        permanent: true,
      },
      {
        source: '/tasks',
        destination: '/benchmarks/terminal-bench-2',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // On harbor-index.org the blog is the home page: serve /news/harbor-index
      // at the root without a redirect, so the URL stays https://harbor-index.org.
      {
        source: '/',
        destination: '/news/harbor-index',
        has: [{ type: 'host', value: 'harbor-index\\.org' }],
      },
    ];
  },
};

export default withMDX(config);
