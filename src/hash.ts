import hashObject from 'hash-object';

const PRESERVE_PROPS = [
    '$ref',
    'name',
    'in',
    'type',
    'required',
    'schema',
    'enum',
    'nullable',
    'minimum',
    'maximum',
    'allOf',
    'anyOf',
    'oneOf',
    'not',
    'items',
    'minItems',
    'maxItems',
    'minLength',
    'maxLength',
    'pattern',
    'format',
    'properties',
    'additionalProperties',
    'minProperties',
    'maxProperties',
    'requestBody',
    'get',
    'post',
    'put',
    'delete',
    'patch',
    'operationId',
    'parameters',
    'responses',
];

/**
 * Normalize the input value as an object.
 */
function normalizeHashInput(input: any): object {
    if (typeof input === 'object' && input !== null) {
        // Remove all properties that are not important for the hash.
        input = Object.keys(input).reduce((acc, key) => {
            if (PRESERVE_PROPS.includes(key)) {
                acc[key] = input[key];
            }

            return acc;
        }, {} as any);
    }

    return { input };
}

/**
 * Hash an object only taking the important properties into account.
 */
export function hash(input: any): string {
    return hashObject(normalizeHashInput(input));
}
