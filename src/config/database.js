const mongoose = require('mongoose');

function connectDB() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is not set. Create a config.env file (see config.env.example).');
        return Promise.reject(new Error('MONGO_URI is not set'));
    }
    return mongoose.connect(uri);
}

module.exports = connectDB;
