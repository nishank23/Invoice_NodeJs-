const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    counter: {
        type: Number,
        required: true,
        default: 1
    }
});

const invoiceCounter = mongoose.model('invoiceCounter', invoiceCounterSchema);

module.exports = invoiceCounter;
