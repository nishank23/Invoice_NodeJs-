const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({

    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    shippingAddress: {
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
    },
    billingAddress: {
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
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
    sign: {
        type: String,
    },
    subTotal: {
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
            amount: {
                type: Number,
                required: true
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
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
