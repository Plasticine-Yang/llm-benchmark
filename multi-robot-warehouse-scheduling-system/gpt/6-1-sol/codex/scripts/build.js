import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const name of ['public/app.js','server/map.js','server/planner.js','server/engine.js','server/index.js'])execFileSync(process.execPath,['--check',path.join(root,name)]);
fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});
fs.cpSync(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
console.log('Production build complete → dist/ (dependency-free client; Node.js backend)');
