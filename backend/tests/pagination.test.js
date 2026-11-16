const { getPagination } = require('../utils/pagination');

describe('getPagination', () => {
    test('defaults to page 1, limit 10', () =>
        expect(getPagination({}, 25)).toEqual({ skip: 0, limit: 10, pagination: { next: { page: 2, limit: 10 } } }));

    test('caps limit at 50 and floors page at 1', () =>
        expect(getPagination({ page: '0', limit: '500' }, 10)).toMatchObject({ skip: 0, limit: 50, pagination: {} }));

    test('limit 0 falls back to the default', () =>
        expect(getPagination({ limit: '0' }, 5)).toMatchObject({ limit: 10 }));

    test('negative limit is floored at 1', () =>
        expect(getPagination({ limit: '-5' }, 5)).toMatchObject({ limit: 1 }));

    test('middle page has next and prev', () =>
        expect(getPagination({ page: '2', limit: '1' }, 3).pagination)
            .toEqual({ next: { page: 3, limit: 1 }, prev: { page: 1, limit: 1 } }));

    test('last page has only prev and skip is the offset', () =>
        expect(getPagination({ page: '3', limit: '1' }, 3))
            .toEqual({ skip: 2, limit: 1, pagination: { prev: { page: 2, limit: 1 } } }));
});
