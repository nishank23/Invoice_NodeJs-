const mongoose = require('mongoose');

const estimationCounterSchema = new mongoose.Schema({
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

const estimationCounter = mongoose.model('invoiceCounter', estimationCounterSchema);

module.exports = estimationCounter;
