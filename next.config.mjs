import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    // Root routing ('/' -> '/news/harbor-index') now lives in middleware.ts: a
    // rewrite on the harbor-index.org host so its URL stays clean, and a normal
    // redirect on every other host. Keeping the literal '/news/harbor-index'
    // string in this file also stops the deploy script from re-injecting a plain
    // root redirect (which would run before the middleware).
    return [
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
};

export default withMDX(config);
