import escodegen from 'escodegen';
import { namedTypes, builders } from 'ast-types';
import { ValidationErrorClass, ValidationErrorIdentifier } from './error';
import { OpenAPIRef, OpenAPISpec } from './types';
import { compileValueSchema } from './compileValueSchema';
import { hash } from './hash';
import { compileValidateRequest } from './compileValidateRequest';

/**
 * Compiler for OpenAPI specs.
 */
export class Compiler {
    private input: OpenAPISpec;

    /** Map of hash to an object in the `identifiers` map */
    private hashes: Map<string, object> = new Map();

    /** Map of objects from the spect to identifier name */
    private identifiers: WeakMap<object, string> = new WeakMap();

    /** Counter to get a new identifier */
    private identifierCounter: number = 0;

    private functions: Map<string, namedTypes.FunctionDeclaration | namedTypes.ClassDeclaration> =
        new Map([[ValidationErrorIdentifier.name, ValidationErrorClass]]);

    constructor(input: OpenAPISpec = {}) {
        this.input = input;
    }

    /**
     * Define a function generated from an object.
     */
    public defineFunction(
        input: object,
        gen: (id: string) => namedTypes.FunctionDeclaration,
    ): namedTypes.Identifier {
        const hash = this.hashObject(input);
        if (!this.functions.has(hash)) {
            const fn = gen(hash);
            this.functions.set(hash, fn);
        }

        return builders.identifier(hash);
    }

    /**
     * Define a function to validate an input.
     */
    public defineValidationFunction(
        input: object,
        gen: (args: {
            /** Identifier for the value argument being passed to the function */
            value: namedTypes.Identifier;
            /** Identifier for the path argument being passed to the function */
            path: namedTypes.Identifier;
            /** Generate an error */
            error: (message: string) => namedTypes.NewExpression;
        }) => namedTypes.BlockStatement['body'],
    ) {
        const pathIdentifier = builders.identifier('path');
        const valueIdentifier = builders.identifier('value');

        const error = (message: string) => {
            return builders.newExpression(ValidationErrorIdentifier, [
                pathIdentifier,
                builders.literal(message),
            ]);
        };

        return this.defineFunction(input, (id) => {
            return builders.functionDeclaration(
                builders.identifier(id),
                [pathIdentifier, valueIdentifier],
                builders.blockStatement(
                    gen({
                        value: valueIdentifier,
                        path: pathIdentifier,
                        error,
                    }),
                ),
            );
        });
    }

    /**
     * Build the AST from the entire spec.
     */
    public build() {
        // Index all the schema components.
        const schemas = this.input.components?.schemas ?? {};
        Object.values(schemas).forEach((schema) => {
            compileValueSchema(this, schema);
        });
    }

    /**
     * Return the AST for the program.
     */
    public ast() {
        return builders.program([
            ...compileValidateRequest(this, this.input),
            ...this.functions.values(),
        ]);
    }

    /**
     * Generate the JS code for the AST.
     */
    public compile() {
        return escodegen.generate(this.ast());
    }

    /**
     * Hash an object and return an identifier name.
     */
    public hashObject(input: object): string {
        if (this.identifiers.has(input)) {
            return this.identifiers.get(input)!;
        }

        const hashValue = hash(input);
        if (this.hashes.has(hashValue)) {
            return this.identifiers.get(this.hashes.get(hashValue)!)!;
        }

        this.hashes.set(hashValue, input);
        const name = `obj${this.identifierCounter++}`;
        this.identifiers.set(input, name);
        return name;
    }

    /**
     * Resolve a reference to part of the spec.
     * We only support "#/" type of references.
     */
    public resolveRef(ref: OpenAPIRef) {
        const parts = ref.$ref.split('/').slice(1);

        let value: any = this.input;
        for (const part of parts) {
            value = value[part];
            if (value === undefined) {
                throw new Error(`Could not resolve reference ${ref.$ref}`);
            }
        }

        return value;
    }
}
