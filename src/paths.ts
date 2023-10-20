import { pathToRegexp, Key } from 'path-to-regexp';

export interface OpenAPIParsedPath {
    regex: RegExp;
    keys: Key[];
}

/**
 * Compile an OpenAPI path to a regex.
 */
export function openapiPathToRegex(path: string): OpenAPIParsedPath {
    // Normalize the path to convert {param} as :param
    const rxPathParam = /{([^}]+)}/;
    while (rxPathParam.test(path)) {
        path = path.replace(rxPathParam, ':$1');
    }

    const keys: Key[] = [];
    const regex = pathToRegexp(path, keys);
    return { regex, keys };
}

/**
 * Get the index of the value in the regexp match corresponding to a named parameter.
 */
export function getPathParamIndex(parsed: OpenAPIParsedPath, name: string) {
    const index = parsed.keys.findIndex((key) => key.name === name);
    if (index === -1) {
        throw new Error(`could not find parameter ${name} in path`);
    }

    // Add 1 because the first value is the full match
    return index + 1;
}
