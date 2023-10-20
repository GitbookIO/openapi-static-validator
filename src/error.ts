import { namedTypes, builders } from 'ast-types';

export const RequestErrorIdentifier = builders.identifier('RequestError');
export const RequestErrorClass = builders.classDeclaration.from({
    id: RequestErrorIdentifier,
    superClass: builders.identifier('Error'),
    body: builders.classBody([
        builders.methodDefinition(
            'constructor',
            builders.identifier('constructor'),
            builders.functionExpression(
                null,
                [builders.identifier('code'), builders.identifier('message')],
                builders.blockStatement([
                    builders.expressionStatement(
                        builders.callExpression(builders.super(), [builders.identifier('message')]),
                    ),
                    builders.expressionStatement(
                        builders.assignmentExpression(
                            '=',
                            builders.memberExpression(
                                builders.thisExpression(),
                                builders.identifier('code'),
                            ),
                            builders.identifier('code'),
                        ),
                    ),
                ]),
            ),
        ),
    ]),
});

export const ValidationErrorIdentifier = builders.identifier('ValidationError');
export const ValidationErrorClass = builders.classDeclaration.from({
    id: ValidationErrorIdentifier,
    superClass: RequestErrorIdentifier,
    body: builders.classBody([
        builders.methodDefinition(
            'constructor',
            builders.identifier('constructor'),
            builders.functionExpression(
                null,
                [builders.identifier('path'), builders.identifier('message')],
                builders.blockStatement([
                    builders.expressionStatement(
                        builders.callExpression(builders.super(), [
                            builders.literal(409),
                            builders.identifier('message'),
                        ]),
                    ),
                    builders.expressionStatement(
                        builders.assignmentExpression(
                            '=',
                            builders.memberExpression(
                                builders.thisExpression(),
                                builders.identifier('path'),
                            ),
                            builders.identifier('path'),
                        ),
                    ),
                ]),
            ),
        ),
    ]),
});

/**
 * Build a request error.
 */
export function buildRequestError(code: number, message: string) {
    return builders.newExpression(RequestErrorIdentifier, [
        builders.literal(code),
        builders.literal(message),
    ]);
}
