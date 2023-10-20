import { builders } from 'ast-types';

/**
 * Annotate a declaration with a JS Doc comment.
 */
export function annotateWithJSDocComment<T>(declaration: T, comment: string): T {
    return {
        ...declaration,
        leadingComments: [builders.block('* ' + comment, true)],
    };
}
