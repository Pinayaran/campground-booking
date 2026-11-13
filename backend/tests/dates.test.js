const { parseDateOnly, addDays, daysFromToday } = require('../utils/dates');

test('parseDateOnly returns midnight UTC for YYYY-MM-DD', () => {
    expect(parseDateOnly('2026-12-01').toISOString()).toBe('2026-12-01T00:00:00.000Z');
});

test.each(['2026-02-30', '12/01/2026', '2026-1-5', '', undefined, ['2026-12-01'], '2026-12-01T10:00'])(
    'parseDateOnly(%p) is null', value => expect(parseDateOnly(value)).toBeNull());

test('addDays adds whole days', () => {
    expect(addDays(new Date('2026-12-30T00:00:00Z'), 3).toISOString()).toBe('2027-01-02T00:00:00.000Z');
});

test('daysFromToday(0) is today at midnight UTC', () => {
    expect(daysFromToday(0).toISOString().slice(10)).toBe('T00:00:00.000Z');
});
