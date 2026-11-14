//Telephone number check shared by User and Campground.
//Allows an optional leading +, then digits with optional spaces, dashes or parentheses,
//e.g. 0812345678, 02-123-4567, +66 81 234 5678. Must contain 9 to 15 digits.
const isValidTel = value => {
    if (typeof value !== 'string') return false;
    if (!/^\+?[0-9 \-()]+$/.test(value)) return false;
    const digits = value.replace(/\D/g, '').length;
    return digits >= 9 && digits <= 15;
};

exports.telValidator = {
    validator: isValidTel,
    message: 'Please add a valid telephone number (9-15 digits; spaces, dashes, parentheses and a leading + are allowed)'
};
