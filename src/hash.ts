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
]

/**
 * Hash an object only taking the important properties into account.
 */
export function hash(input: object): string {
    // Remove all properties that are not important for the hash.
    const cleanInput = Object.keys(input).reduce((acc, key) => {
        if (PRESERVE_PROPS.includes(key)) {
            acc[key] = input[key];
        }

        return acc;
    }, {} as any);

    return hashObject(cleanInput);
}
