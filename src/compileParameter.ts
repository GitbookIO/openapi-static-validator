import { namedTypes, builders } from 'ast-types';

import { Compiler } from './compiler';
import { OpenAPIParameter } from './types';
import { compileValueSchema } from './compileValueSchema';

/**
 * Compile a parameter into a validation function.
 * The value input is an object:
 * {
 *   path: string;
 *   params: Record<string, string>;
 *   method: string;
 *   body: any;
 *   query: Record<string, string>;
 *   headers: any;
 * }
 */
export function compileParameter(compiler: Compiler, parameter: OpenAPIParameter) {
    return compiler.declareValidationFunction(parameter, ({ value, path, context, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        const paramValue = builders.memberExpression(
            value,
            parameter.in === 'path' ? builders.literal('params') : builders.literal('query'),
            true,
        );

        if (parameter.required) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression('===', paramValue, builders.identifier('undefined')),
                    builders.blockStatement([
                        builders.returnStatement(error('parameter is required')),
                    ]),
                ),
            );
        }

        const schemaFn = compileValueSchema(compiler, parameter.schema);

        nodes.push(
            builders.variableDeclaration('const', [
                builders.variableDeclarator(
                    builders.identifier('result'),
                    builders.callExpression(schemaFn, [path, paramValue, context]),
                ),
            ]),
        );

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}
