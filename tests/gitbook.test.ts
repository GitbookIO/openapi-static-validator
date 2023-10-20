import { expect, test } from 'bun:test';
import { validateRequest, ValidationError } from './gitbook.validate';

test('POST /spaces/1234/hive/token', () => {
    const result = validateRequest({
        path: '/spaces/1234/hive/token',
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
    });
    expect(result).toMatchObject({
        headers: {
            'content-type': 'application/json',
        },
        method: 'post',
        operationId: 'generateSpaceHiveReadAccessToken',
        params: {
            spaceId: '1234',
        },
        path: '/spaces/1234/hive/token',
        query: {},
    });
});

test('POST orgs/appleId/custom-fields', () => {
    const result = validateRequest({
        path: '/orgs/appleId/custom-fields',
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: { name: 'jira_board', type: 'number' },
    });
    expect(result).toMatchObject({
        params: {
            organizationId: 'appleId',
        },
    });
});

test('GET orgs/microsoft/collections?limit=invalid', () => {
    const result = validateRequest({
        path: '/orgs/microsoft/collections',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            limit: 'invalid',
        },
    });
    expect(result instanceof ValidationError).toBeTruthy();
    expect(result.path).toEqual(['query', 'limit']);
});
