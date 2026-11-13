const { buildCampgroundFilter, escapeRegex } = require('../utils/campgroundQuery');

describe('escapeRegex', () => {
    test('escapes every regex metacharacter', () => {
        const text = 'a.b*(c)';
        expect(new RegExp(escapeRegex(text)).test(text)).toBe(true);
        for (const ch of '.*+?^${}()|[]\\/') {
            expect(new RegExp(`^${escapeRegex(ch)}$`).test(ch)).toBe(true);
        }
        expect(new RegExp(`^${escapeRegex('.')}$`).test('x')).toBe(false);
    });
});

describe('buildCampgroundFilter', () => {
    test('skips empty and whitespace-only values', () =>
        expect(buildCampgroundFilter({ province: '', search: '  ' })).toEqual({}));

    test('skips missing values', () =>
        expect(buildCampgroundFilter({})).toEqual({}));

    test('province and region are anchored case-insensitive regexes on trimmed input', () => {
        const filter = buildCampgroundFilter({ province: ' chiang mai ', region: 'North' });
        expect(filter.province).toEqual(/^chiang mai$/i);
        expect(filter.region).toEqual(/^North$/i);
    });

    test('search is an unanchored escaped regex on name', () =>
        expect(buildCampgroundFilter({ search: ' a.b ' })).toEqual({ name: /a\.b/i }));

    test('throws invalidQueryError for objects and arrays', () => {
        expect(() => buildCampgroundFilter({ province: { $ne: 'x' } })).toThrow('Invalid query');
        expect(() => buildCampgroundFilter({ region: ['North', 'South'] })).toThrow(
            expect.objectContaining({ statusCode: 400 })
        );
    });
});
