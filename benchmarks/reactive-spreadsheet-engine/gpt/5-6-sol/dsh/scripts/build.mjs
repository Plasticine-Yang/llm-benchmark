import { cp, mkdir, rm } from 'node:fs/promises';
import { basename, resolve, sep } from 'node:path';

const projectRoot = process.cwd();
const sourceDirectory = resolve(projectRoot, 'src');
const outputDirectory = resolve(projectRoot, 'dist');

if (basename(outputDirectory) !== 'dist' || !outputDirectory.startsWith(`${projectRoot}${sep}`)) {
  throw new Error(`Refusing to clean unexpected output path: ${outputDirectory}`);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(resolve(sourceDirectory, 'public'), resolve(outputDirectory, 'public'), { recursive: true });
await cp(resolve(sourceDirectory, 'server.js'), resolve(outputDirectory, 'server.js'));
console.log('Production build created in dist/');
