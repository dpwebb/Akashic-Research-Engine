import { cp, mkdir, rm } from 'node:fs/promises';

const siteDir = new URL('../site/', import.meta.url);
const distDir = new URL('../dist/', import.meta.url);
const siteDistDir = new URL('../site/dist/', import.meta.url);

await rm(siteDir, { recursive: true, force: true });
await mkdir(siteDistDir, { recursive: true });

await Promise.all([
  cp(new URL('../index.html', import.meta.url), new URL('../site/index.html', import.meta.url)),
  cp(new URL('../CNAME', import.meta.url), new URL('../site/CNAME', import.meta.url)),
  cp(distDir, siteDistDir, { recursive: true }),
]);
