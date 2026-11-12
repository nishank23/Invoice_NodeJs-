const Invoice = require('../models/InvoiceModel/invoice');
const country = require('../models/addressModels/country');
const state = require('../models/addressModels/state');
const city = require('../models/addressModels/city');
const invoiceCounter = require('../models/InvoiceModel/invoiceCounter');
const UserProfile = require('../models/UserModels/userprofile');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const { sanitizeUpdate } = require('../helpers/sanitize');

exports.getLatestInvoiceNo = async (req, res) => {
    try {
        const userId = req.userId;
        const nextInvoiceNo = await getCurrentInvoiceNumber(userId);
        res.status(200).json({ data: { estimationNo: nextInvoiceNo } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve the latest estimation number' });
    }
};

const getNextInvoiceNumber = async (userId) => {
    let invoiceCount = await invoiceCounter.findOneAndUpdate(
        { userId },
        { $inc: { counter: 1 } },
        { upsert: true, new: true }
    );

    return `EST${invoiceCount.counter}`;
};

const getCurrentInvoiceNumber = async (userId) => {
    let invoiceCount = await invoiceCounter.findOne({ userId });
    if (invoiceCount == null) {
        return `EST${1}`;
    }
    return `EST${invoiceCount.counter + 1}`;
};

exports.createInvoice = async (req, res) => {
    try {
        const userId = req.userId;
        const nextEstimationNo = await getNextInvoiceNumber(userId);

        let signImage = null;
        if (req.file && req.file.path) {
            signImage = req.file.path;
        }

        const {
            client, billingAddress, shippingAddress, products, invoiceDate, dueDate,
            currency, subTotal, itemTotal, discountType, currencyId, discount, taxes, totalAmount
        } = req.body;

        let parsedProducts, parsedTaxes, parsedBilling, parsedshipping;
        try {
            parsedProducts = JSON.parse(products);
            parsedTaxes = JSON.parse(taxes);
            parsedBilling = JSON.parse(billingAddress);
            parsedshipping = JSON.parse(shippingAddress);
        } catch (e) {
            return res.status(400).json({ error: 'products, taxes, billingAddress and shippingAddress must be valid JSON strings.' });
        }

        const invoice = new Invoice({
            client,
            shippingAddress: parsedshipping,
            billingAddress: parsedBilling,
            products: parsedProducts,
            estimationNo: nextEstimationNo,
            invoiceDate,
            dueDate,
            currency,
            currencyId,
            itemTotal,
            discountType,
            sign: signImage,
            subTotal,
            discount,
            taxes: parsedTaxes,
            totalAmount,
            userId
        });
        await invoice.save();

        res.status(201).json({ data: invoice, success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Failed to create the invoice' });
    }
};

exports.getInvoicePreview = async (req, res) => {
    const invoiceId = req.params.id;

    try {
        const invoice = await Invoice.findById(invoiceId)
            .populate({
                path: 'products.product',
                select: 'name price currencySymbol images',
            })
            .populate('client');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (invoice.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to view this invoice' });
        }

        const clientbilledcity = await city.findOne({ id: Number(invoice.billingAddress.city) });
        const clientbilledstate = await state.findOne({ id: Number(invoice.billingAddress.state) });
        const clientbilledcountry = await country.findOne({ id: parseInt(invoice.billingAddress.country) });

        const clientshipcity = await city.findOne({ id: Number(invoice.shippingAddress.city) });
        const clientshipstate = await state.findOne({ id: Number(invoice.shippingAddress.state) });
        const clientshipcountry = await country.findOne({ id: parseInt(invoice.shippingAddress.country) });

        invoice.billingAddress.city = clientbilledcity ? clientbilledcity.name : '';
        invoice.billingAddress.state = clientbilledstate ? clientbilledstate.name : '';
        invoice.billingAddress.country = clientbilledcountry ? clientbilledcountry.name : '';

        invoice.shippingAddress.city = clientshipcity ? clientshipcity.name : '';
        invoice.shippingAddress.state = clientshipstate ? clientshipstate.name : '';
        invoice.shippingAddress.country = clientshipcountry ? clientshipcountry.name : '';

        const userprofile = await UserProfile.findOne({ userId: invoice.userId });
        const usercity = await city.findOne({ id: parseInt(userprofile.address.city) });
        const userstate = await state.findOne({ id: parseInt(userprofile.address.state) });
        const usercountry = await country.findOne({ id: parseInt(userprofile.address.country) });

        userprofile.address.city = usercity ? usercity.name : '';
        userprofile.address.state = userstate ? userstate.name : '';
        userprofile.address.country = usercountry ? usercountry.name : '';

        const renderedHtml = await ejs.renderFile(path.join(__dirname, '../../views/myinvoice.ejs'), {
            invoice: invoice,
            userprofile: userprofile,
            baseUrl: process.env.BASE_URL || `${req.protocol}://${req.get('host')}/`
        });

        const htmlFilePath = path.join(__dirname, `temp_invoice_${Date.now()}.html`);
        fs.writeFileSync(htmlFilePath, renderedHtml);

        let browser;
        try {
            browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
            const page = await browser.newPage();
            await page.goto(`file://${htmlFilePath}`, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="rendered-invoice.pdf"');
            res.send(pdfBuffer);
        } finally {
            if (browser) await browser.close();
            if (fs.existsSync(htmlFilePath)) fs.unlinkSync(htmlFilePath);
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to get the invoice' });
    }
};

exports.getAllInvoiceData = async (req, res) => {
    const invoiceId = req.params.id;

    try {
        const invoice = await Invoice.findById(invoiceId)
            .populate({
                path: 'products.product',
                select: 'name price currencySymbol images',
            })
            .populate('client');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (invoice.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to view this invoice' });
        }

        const clientbilledcity = await city.findOne({ id: Number(invoice.billingAddress.city) });
        const clientbilledstate = await state.findOne({ id: Number(invoice.billingAddress.state) });
        const clientbilledcountry = await country.findOne({ id: parseInt(invoice.billingAddress.country) });

        const clientshipcity = await city.findOne({ id: Number(invoice.shippingAddress.city) });
        const clientshipstate = await state.findOne({ id: Number(invoice.shippingAddress.state) });
        const clientshipcountry = await country.findOne({ id: parseInt(invoice.shippingAddress.country) });

        invoice.billingAddress.city = clientbilledcity ? clientbilledcity.name : '';
        invoice.billingAddress.state = clientbilledstate ? clientbilledstate.name : '';
        invoice.billingAddress.country = clientbilledcountry ? clientbilledcountry.name : '';

        invoice.shippingAddress.city = clientshipcity ? clientshipcity.name : '';
        invoice.shippingAddress.state = clientshipstate ? clientshipstate.name : '';
        invoice.shippingAddress.country = clientshipcountry ? clientshipcountry.name : '';

        const userprofile = await UserProfile.findOne({ userId: invoice.userId });
        const usercity = await city.findOne({ id: parseInt(userprofile.address.city) });
        const userstate = await state.findOne({ id: parseInt(userprofile.address.state) });
        const usercountry = await country.findOne({ id: parseInt(userprofile.address.country) });

        userprofile.address.city = usercity ? usercity.name : '';
        userprofile.address.state = userstate ? userstate.name : '';
        userprofile.address.country = usercountry ? usercountry.name : '';

        res.json({ invoice: invoice, userprofile: userprofile });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to get the invoice' });
    }
};

// Get a single invoice by ID
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        if (invoice.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to view this invoice' });
        }
        res.status(200).json({ data: invoice });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve the invoice' });
    }
};

exports.getInvoiceByUser = async (req, res) => {
    try {
        const userId = req.userId;
        const invoice = await Invoice.find({ userId: userId }).populate('client');
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.status(200).json({ data: invoice });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to retrieve the invoice' });
    }
};

// Update a single invoice by ID
exports.updateInvoice = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'Invoice id not provided' });
        }

        const existing = await Invoice.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        if (existing.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to update this invoice' });
        }

        const update = sanitizeUpdate(req.body);
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true });
        res.status(200).json({ data: invoice });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update the invoice' });
    }
};

// Delete a single invoice by ID
exports.deleteInvoice = async (req, res) => {
    try {
        const existing = await Invoice.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        if (existing.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this invoice' });
        }

        await Invoice.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete the invoice' });
    }
};
