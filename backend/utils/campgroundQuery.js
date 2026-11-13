const { invalidQueryError } = require('./queryFilter');

//Escape every regex metacharacter so user input is matched literally
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
exports.escapeRegex = escapeRegex;

//Trimmed string value, or null when missing/empty. Objects and arrays (?province[$ne]=x) are rejected.
const readText = value => {
    if (value === undefined) return null;
    if (typeof value !== 'string') throw invalidQueryError();
    return value.trim() || null;
};

//province/region: exact (anchored) and case-insensitive. search: part of the name, case-insensitive.
exports.buildCampgroundFilter = ({ province, region, search }) => {
    const filter = {};

    const provinceText = readText(province);
    if (provinceText) filter.province = new RegExp(`^${escapeRegex(provinceText)}$`, 'i');

    const regionText = readText(region);
    if (regionText) filter.region = new RegExp(`^${escapeRegex(regionText)}$`, 'i');

    const searchText = readText(search);
    if (searchText) filter.name = new RegExp(escapeRegex(searchText), 'i');

    return filter;
};
