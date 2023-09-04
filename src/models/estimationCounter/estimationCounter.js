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
        default: 0
    }
});

const estimationCounter = mongoose.model('estimationCounter', estimationCounterSchema);

module.exports = estimationCounter;
