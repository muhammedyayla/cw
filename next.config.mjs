const nextConfig = {
  reactStrictMode: true,

  // -----------------------------------------------------------------
  // Fix: Watchpack EINVAL errors on Windows system files
  // Next.js tries to scan the whole C:\ drive which hits locked files.
  // We restrict the watcher to only the project directory.
  // -----------------------------------------------------------------
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        // Windows virtual / system files at the root of C:\
        '**/DumpStack.log.tmp',
        '**/hiberfil.sys',
        '**/pagefile.sys',
        '**/swapfile.sys',
        // Also ignore node_modules to speed up watching
        '**/node_modules/**',
        '**/.git/**',
      ],
    };
    return config;
  },
};

export default nextConfig;
