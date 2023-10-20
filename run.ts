import { Compiler } from './src';

const spec = require('./openapi.all.json');
const compiler = new Compiler(spec);
compiler.build();
console.log(compiler.compile());
