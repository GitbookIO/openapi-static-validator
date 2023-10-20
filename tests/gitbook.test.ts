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
    expect(result instanceof ValidationError ? result.path : null).toEqual(['query', 'limit']);
});

test('POST orgs/appleId/custom-fields', () => {
    const result = validateRequest({
        path: '/orgs/appleId/spaces',
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: undefined,
    });
    expect(result).toMatchObject({
        params: {
            organizationId: 'appleId',
        },
    });
});

test('PUT orgs/apple/schemas/newType', () => {
    const result = validateRequest({
        path: '/orgs/apple/schemas/newType',
        method: 'put',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: {
            type: 'newType',
            title: {
                singular: 'New type',
                plural: 'New types',
            },
            properties: [
                {
                    name: 'title',
                    type: 'text',
                    title: 'Title',
                },
            ],
        },
    });
    expect(result).toMatchObject({
        operationId: 'setEntitySchema',
        params: {
            organizationId: 'apple',
            entityType: 'newType',
        },
    });
});

test('POST orgs/apple/members/jony (invalid)', () => {
    const result = validateRequest({
        path: '/orgs/apple/members/jony',
        method: 'patch',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: {
            role: 'invalid',
        },
    });
    expect(result instanceof ValidationError ? result.path : null).toEqual(['body', 'role']);
});

test('POST orgs/apple/members/jony (null)', () => {
    const result = validateRequest({
        path: '/orgs/apple/members/jony',
        method: 'patch',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: {
            role: null,
        },
    });
    expect(result).toMatchObject({
        operationId: 'updateMemberInOrganizationById',
        params: {
            organizationId: 'apple',
            userId: 'jony',
        },
    });
});
