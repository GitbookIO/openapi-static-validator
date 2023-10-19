import escodegen from 'escodegen';
import esprima from 'esprima';
import { namedTypes, builders } from 'ast-types';

export const ValidationErrorIdentifier: namedTypes.Identifier = {
    type: 'Identifier',
    name: 'ValidationError',
};

const ValidationErrorClass = esprima.parseScript(`
class ValidationError extends Error {
  constructor(path, message) {
    super(message);
    this.path = path;
  }
}
`).body[0] as namedTypes.ClassDeclaration;

export class Compiler {
    private identifiers: WeakMap<object, string> = new WeakMap();
    private identifierCounter: number = 0;

    private functions: Map<string, namedTypes.FunctionDeclaration | namedTypes.ClassDeclaration> =
        new Map();

    constructor() {
        this.functions.set(ValidationErrorIdentifier.name, ValidationErrorClass);
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

    public ast() {
        return builders.program([...this.functions.values()]);
    }

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

        const name = `obj${this.identifierCounter++}`;
        this.identifiers.set(input, name);
        return name;
    }
}
