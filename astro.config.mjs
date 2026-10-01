// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: "https://xdesai96.github.io",
  integrations: [mdx()],
  server: {
    host: true,
    port: 6969,
  },
  devToolbar: {
    enabled: false,
  },
});
