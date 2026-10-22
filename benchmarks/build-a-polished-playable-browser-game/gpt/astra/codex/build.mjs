import { mkdir, copyFile } from 'node:fs/promises';

const destination = new URL('./dist/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const filename of ['index.html', 'style.css', 'game.js', 'art.js', 'favicon.svg']) {
  await copyFile(new URL(filename, import.meta.url), new URL(filename, destination));
}
console.log('Built Pelican Pedal Club → dist/');
