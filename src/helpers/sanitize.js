// Recursively strip Mongo operator keys ($...), prototype-pollution keys, and
// dangerous object keys from an update payload. Used before passing request
// bodies to Mongoose update queries to prevent NoSQL injection / mass-assignment.
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeUpdate(value) {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeUpdate(item));
    }
    if (value && typeof value === 'object') {
        const out = {};
        for (const key of Object.keys(value)) {
            if (key.startsWith('$') || BLOCKED_KEYS.has(key)) {
                continue;
            }
            out[key] = sanitizeUpdate(value[key]);
        }
        return out;
    }
    return value;
}

module.exports = { sanitizeUpdate };
