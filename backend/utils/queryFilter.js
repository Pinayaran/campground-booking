//Turn a parsed query string into a safe MongoDB filter.
//  ?name=X                 -> { name: 'X' }
//  ?tel[in]=A,B            -> { tel: { $in: ['A', 'B'] } }
//  ?createdAt[gte]=2026-01-01 -> { createdAt: { $gte: '2026-01-01' } }
//Only gt, gte, lt, lte and in are accepted as operators. Any key starting with $,
//any other operator and any deeper nesting throws, so callers can answer 400.
const OPERATORS = ['gt', 'gte', 'lt', 'lte', 'in'];

const invalid = () => {
    const err = new Error('Invalid query');
    err.statusCode = 400;
    return err;
};

const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

exports.buildFilter = reqQuery => {
    const filter = {};

    for (const [field, value] of Object.entries(reqQuery)) {
        if (field.startsWith('$')) throw invalid();

        if (!isPlainObject(value)) {
            if (Array.isArray(value) && value.some(v => typeof v === 'object')) throw invalid();
            filter[field] = value;
            continue;
        }

        filter[field] = {};
        for (const [op, opValue] of Object.entries(value)) {
            if (!OPERATORS.includes(op) || isPlainObject(opValue)) {
                throw invalid();
            }
            if (op === 'in') {
                const list = Array.isArray(opValue) ? opValue : String(opValue).split(',');
                if (list.some(v => typeof v === 'object')) throw invalid();
                filter[field].$in = list;
            } else {
                if (Array.isArray(opValue)) throw invalid();
                filter[field][`$${op}`] = opValue;
            }
        }
    }

    return filter;
};
