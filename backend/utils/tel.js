//Telephone number rules shared by User and Campground.
//Spaces are removed automatically (e.g. "081 234 5678" -> "0812345678"),
//then the value must be exactly 10 digits (no dashes, parentheses or +).
exports.stripSpaces = value => (typeof value === 'string' ? value.replace(/\s/g, '') : value);

const isValidTel = value => typeof value === 'string' && /^[0-9]{10}$/.test(value);

exports.telValidator = {
    validator: isValidTel,
    message: 'Please add a valid telephone number (exactly 10 digits)'
};
