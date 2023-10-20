import { Compiler } from './compiler';
import { readFileSync } from 'node:fs';

import { name } from '../package.json';

const inputFile = process.argv[2];

if (!inputFile) {
    console.error(`Usage: ${name} <spec>`);
    process.exit(1);
}

const spec = JSON.parse(readFileSync(inputFile, 'utf-8'));

const compiler = new Compiler(spec);
const code = compiler.compile();

console.log(code);
