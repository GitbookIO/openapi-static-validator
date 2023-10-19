import { namedTypes, builders } from 'ast-types';

import { Compiler } from "./compiler";
import { OpenAPIPath } from "./types";
import { compileValueSchema } from './compileValueSchema';
import { ValidationErrorIdentifier } from './error';
import { compileOperation } from './compileOperation';

/**
 * Compile a path into a function.
 * The value input is an object:
 * {
 *   path: string;
 *   method: string;
 *   body: any;
 *   query: any;
 *   headers: any;
 * }
 */
export function compilePath(compiler: Compiler, pathOperations: OpenAPIPath) {
    return compiler.defineValidationFunction(pathOperations, ({ value, path, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        Object.entries(pathOperations).forEach(([method, operation]) => {
            const fnOperation = compileOperation(compiler, operation);

            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '===',
                        builders.memberExpression(
                            value,
                            builders.identifier('method'),
                        ),
                        builders.literal(method),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            builders.callExpression(fnOperation, [
                                path,
                                value,
                            ]),
                        ),
                    ]),
                )
            )
        });

        nodes.push(
            builders.returnStatement(
                error('method not supported')
            ),
        )

        return nodes;
    });
}
