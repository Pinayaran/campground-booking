const DAY_MS = 24 * 60 * 60 * 1000;

//Parse a strict YYYY-MM-DD string to midnight UTC; null if not a real calendar date
const parseDateOnly = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
    return date;
};

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

//Midnight UTC today, shifted by offset days
const daysFromToday = (offset) => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return addDays(today, offset);
};

module.exports = { parseDateOnly, addDays, daysFromToday };
