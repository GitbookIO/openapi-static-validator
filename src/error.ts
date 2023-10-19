import { namedTypes, builders } from 'ast-types';

export const ValidationErrorIdentifier: namedTypes.Identifier = {
    type: 'Identifier',
    name: 'ValidationError',
};

export const ValidationErrorClass = builders.classDeclaration(
    builders.identifier('ValidationError'),
    builders.classBody([
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
);
