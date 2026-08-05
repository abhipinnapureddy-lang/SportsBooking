const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+()\-\s\.]{7,32}$/;

const validateBody = (requiredFields, body) => {
    const errors = [];
    requiredFields.forEach((field) => {
        if (body[field] === undefined || body[field] === null || body[field] === "") {
            errors.push(`${field} is required`);
        }
    });
    return errors;
};

const validateEmail = (email) => {
    return typeof email === "string" && emailRegex.test(email);
};

const validatePassword = (password, options = {}) => {
    if (typeof password !== "string") return false;
    const minLength = options.minLength || 6;
    if (password.length < minLength) return false;
    if (options.requireLettersAndNumbers) {
        return /[A-Za-z]/.test(password) && /[0-9]/.test(password);
    }
    return true;
};

const validatePhone = (phone) => {
    if (phone === undefined || phone === null || phone === "") return true;
    return typeof phone === "string" && phoneRegex.test(phone.trim());
};

const validateEnum = (value, allowedValues) => {
    if (value === undefined || value === null || value === "") return true;
    return allowedValues.includes(value);
};

const validateInteger = (value, options = {}) => {
    if (value === undefined || value === null || value === "") return true;
    const number = Number(value);
    if (!Number.isInteger(number)) return false;
    if (options.min !== undefined && number < options.min) return false;
    if (options.max !== undefined && number > options.max) return false;
    return true;
};

const validateNumber = (value, options = {}) => {
    if (value === undefined || value === null || value === "") return true;
    const number = Number(value);
    if (Number.isNaN(number)) return false;
    if (options.min !== undefined && number < options.min) return false;
    if (options.max !== undefined && number > options.max) return false;
    return true;
};

module.exports = { validateBody, validateEmail, validatePassword, validatePhone, validateEnum, validateInteger, validateNumber };