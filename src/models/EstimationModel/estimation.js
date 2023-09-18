const mongoose = require('mongoose');

const estimationSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    estimationDate: {
        type: Date,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    currencyId: {
        type: String,
        required: true
    },
    sign: {
        type: String,
    },
    subTotal: {
        type: Number,
        required: true
    },
    itemTotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    taxes: [
        {
            percentage: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            amount:{
                type:Number,
                required:true
            }
        }
    ],
    estimationNo: {

        type: String,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,

    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Estimation = mongoose.model('Estimation', estimationSchema);

module.exports = Estimation;
