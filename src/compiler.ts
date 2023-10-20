import escodegen from 'escodegen';
import { namedTypes, builders } from 'ast-types';
import { RequestErrorClass, ValidationErrorClass, ValidationErrorIdentifier } from './error';
import { OpenAPIRef, OpenAPISpec } from './types';
import { compileValueSchema } from './compileValueSchema';
import { hash } from './hash';
import { compileValidateRequest } from './compileValidateRequest';

/**
 * Compiler for OpenAPI specs.
 */
export class Compiler {
    private input: OpenAPISpec;

    /** Map of hash to the identifier */
    private hashes: Map<string, string> = new Map();
    /** Map of objects to the identifier */
    private objectHashes: WeakMap<object, string> = new WeakMap();

    /** Counter to get a new identifier */
    private declarationCounter: number = 0;

    /** Map of identifiers defined globally */
    private globalDeclarations: (
        | namedTypes.FunctionDeclaration
        | namedTypes.ClassDeclaration
        | namedTypes.VariableDeclaration
        | namedTypes.ExportNamedDeclaration
    )[] = [
        builders.exportNamedDeclaration(RequestErrorClass),
        builders.exportNamedDeclaration(ValidationErrorClass),
    ];

    /** Map of hashes already processed */
    private processedHashes: Set<string> = new Set();

    constructor(input: OpenAPISpec = {}) {
        this.input = input;
    }

    /**
     * Define a global identifier with a nickname.
     */
    public declareGlobally(
        declaration:
            | namedTypes.FunctionDeclaration
            | namedTypes.ClassDeclaration
            | namedTypes.VariableDeclaration,
    ) {
        this.globalDeclarations.push(declaration);
    }

    /**
     * Declare something globally basded on an input and return an identifier.
     */
    public declareForInput(
        input: any,
        gen: (
            id: namedTypes.Identifier,
        ) =>
            | namedTypes.FunctionDeclaration
            | namedTypes.ClassDeclaration
            | namedTypes.VariableDeclaration,
    ): namedTypes.Identifier {
        const hash = this.hashInput(input);
        const identifier = builders.identifier(hash);

        if (!this.processedHashes.has(hash)) {
            this.processedHashes.add(hash);
            const fn = gen(identifier);
            this.declareGlobally(fn);
        }

        return identifier;
    }

    /**
     * Define a function to validate an input.
     */
    public declareValidationFunction(
        input: object,
        gen: (args: {
            /** Identifier for the value argument being passed to the function */
            value: namedTypes.Identifier;
            /** Identifier for the path argument being passed to the function */
            path: namedTypes.Identifier;
            /** Identifier for the context argument being passed to the function */
            context: namedTypes.Identifier;
            /** Generate an error */
            error: (message: string) => namedTypes.NewExpression;
        }) => namedTypes.BlockStatement['body'],
    ) {
        const pathIdentifier = builders.identifier('path');
        const valueIdentifier = builders.identifier('value');
        const contextIdentifier = builders.identifier('context');

        const error = (message: string) => {
            return builders.newExpression(ValidationErrorIdentifier, [
                pathIdentifier,
                builders.literal(message),
            ]);
        };

        return this.declareForInput(input, (id) => {
            return builders.functionDeclaration(
                id,
                [pathIdentifier, valueIdentifier, contextIdentifier],
                builders.blockStatement(
                    gen({
                        value: valueIdentifier,
                        path: pathIdentifier,
                        context: contextIdentifier,
                        error,
                    }),
                ),
            );
        });
    }

    /**
     * Build the AST from the entire spec.
     */
    public indexAllComponents() {
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
            ...this.globalDeclarations,
        ]);
    }

    /**
     * Generate the JS code for the AST.
     */
    public compile() {
        return escodegen.generate(this.ast(), {
            comment: true,
        });
    }

    /**
     * Hash an object and return an identifier name.
     */
    public hashInput(input: any): string {
        const isObject = typeof input === 'object' && input !== null;

        // Fast track for objects
        if (isObject && this.objectHashes.has(input)) {
            return this.objectHashes.get(input)!;
        }

        const hashValue = hash(input);
        if (this.hashes.has(hashValue)) {
            return this.hashes.get(hashValue)!;
        }

        const name = `obj${this.declarationCounter++}`;
        this.hashes.set(hashValue, name);
        if (isObject) {
            this.objectHashes.set(input, name);
        }

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

    /**
     * Resolve a potential ref to a value.
     */
    public resolveMaybeRef<T>(value: T | OpenAPIRef): T {
        if (typeof value === 'object' && value !== null && '$ref' in value) {
            return this.resolveRef(value);
        }

        return value;
    }
}
