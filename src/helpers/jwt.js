const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Read lazily so the env is loaded regardless of module load order.
const getSecret = () => process.env.JWT_SECRET_KEY;

// Generate JWT token
const generateToken = (payload, expiresIn = '240h') => {
    const secret = getSecret();
    if (!secret) {
        throw new Error('JWT_SECRET_KEY is not set. Create a config.env file (see config.env.example).');
    }
    return jwt.sign(payload, secret, { expiresIn, algorithm: 'HS256' });
};

function extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
}

async function authenticateToken(req, res, next) {
    const secret = getSecret();
    if (!secret) {
        return res.status(500).json({ auth: false, message: 'Server is not configured with a JWT secret.' });
    }

    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ auth: false, message: 'No token provided.' });
    }

    jwt.verify(token, secret, { algorithms: ['HS256'] }, function (error, decoded) {
        if (error) {
            return res.status(401).json({ auth: false, message: 'Failed to authenticate token.' });
        }
        req.userId = decoded.userId;
        next();
    });
}

// Generate a cryptographically secure, short-lived reset/verification token.
const generateResetToken = () => {
    const secret = getSecret();
    if (!secret) {
        throw new Error('JWT_SECRET_KEY is not set. Create a config.env file (see config.env.example).');
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = '24h';
    const token = jwt.sign({ resetToken }, secret, { expiresIn, algorithm: 'HS256' });
    return { token, expiresIn };
};

module.exports = {
    generateToken,
    authenticateToken,
    generateResetToken
};
