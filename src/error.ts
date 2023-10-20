import { namedTypes, builders } from 'ast-types';

export const ValidationErrorIdentifier = builders.identifier('ValidationError');

export const ValidationErrorClass = builders.classDeclaration.from({
    id: ValidationErrorIdentifier,
    superClass: builders.identifier('Error'),
    body: builders.classBody([
        builders.methodDefinition(
            'constructor',
            builders.identifier('constructor'),
            builders.functionExpression(
                null,
                [builders.identifier('path'), builders.identifier('message')],
                builders.blockStatement([
                    builders.expressionStatement(
                        builders.callExpression(builders.super(), [builders.identifier('message')]),
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
 * Build an empty error.
 */
export function buildValidationError(message: string) {
    return builders.newExpression(ValidationErrorIdentifier, [
        builders.arrayExpression([]),
        builders.literal(message),
    ]);
}
