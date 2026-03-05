import { describe, expect, test } from 'bun:test';
import { hash } from '../hash';

describe('Strings', () => {
    test('different', () => {
        expect(hash('foo')).not.toEqual(hash('bar'));
    });
});

describe('Objects', () => {
    test('with different propertyNames', () => {
        const baseSchema = {
            type: 'object',
            properties: {
                foo: { type: 'string' },
            },
        };
        expect(
            hash({
                ...baseSchema,
                propertyNames: {
                    pattern: '^[a-z]+$',
                },
            }),
        ).not.toEqual(
            hash({
                ...baseSchema,
                propertyNames: {
                    pattern: '^[A-Z]+$',
                },
            }),
        );
    });
});
