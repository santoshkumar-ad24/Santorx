// Input validation middleware
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateString = (str, minLength = 1, maxLength = 5000) => {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Basic XSS prevention
        .substring(0, 5000);
};

module.exports = {
    validateEmail,
    validateString,
    sanitizeInput
};
