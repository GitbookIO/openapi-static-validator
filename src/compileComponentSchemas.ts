import { builders } from "ast-types";
import { Compiler } from "./compiler";
import { compileValueSchema } from "./compileValueSchema";
import { OpenAPIValueSchema } from "./types";
import { annotateWithJSDocComment } from "./comments";

const COMMENT = `
Map of all components defined in the spec to their validation functions.
`;

/**
 * Compile all component schemas to be expoerted as `components['Name']`.
 */
export function compileComponentSchemas(compiler: Compiler, schemas: {
    [key: string]: OpenAPIValueSchema;
}) {
    const properties = Object.entries(schemas).map(([name]) => {
        return builders.property(
            'init',
            builders.literal(name),
            compileValueSchema(compiler, schemas[name]),
        );
    });

    return [
        annotateWithJSDocComment(
            builders.exportNamedDeclaration(
                builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        builders.identifier('componentSchemas'),
                        builders.objectExpression(
                            properties,
                        ),
                    )
                ]),
            ),
            COMMENT,
        ),
    ];
}