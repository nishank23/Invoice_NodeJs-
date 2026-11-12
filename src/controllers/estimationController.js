const Estimation = require('../models/EstimationModel/estimation');
const country = require('../models/addressModels/country');
const state = require('../models/addressModels/state');
const city = require('../models/addressModels/city');
const estimationCounter = require('../models/estimationCounter/estimationCounter');
const UserProfile = require('../models/UserModels/userprofile');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const { sanitizeUpdate } = require('../helpers/sanitize');

exports.getLatestEstimationNo = async (req, res) => {
    try {
        const userId = req.userId;
        const nextEstimationNo = await getCurrentEstimationNumber(userId);
        res.status(200).json({ data: { estimationNo: nextEstimationNo } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to retrieve the latest estimation number' });
    }
};

const getNextEstimationNumber = async (userId) => {
    let estimationCount = await estimationCounter.findOneAndUpdate(
        { userId },
        { $inc: { counter: 1 } },
        { upsert: true, new: true }
    );

    if (estimationCount === null) {
        estimationCount = { userId, counter: 1 };
        await estimationCounter.create(estimationCount);
    }
    return `EST${estimationCount.counter}`;
};

const getCurrentEstimationNumber = async (userId) => {
    let estimationCount = await estimationCounter.findOne({ userId });
    if (estimationCount == null) {
        return `EST${1}`;
    }
    return `EST${estimationCount.counter + 1}`;
};

exports.createEstimation = async (req, res) => {
    try {
        const userId = req.userId;
        const nextEstimationNo = await getNextEstimationNumber(userId);

        let signImage = null;
        if (req.file && req.file.path) {
            signImage = req.file.path;
        }

        const { client, products, estimationDate, currency, currencyId, subTotal, discount, discountType, taxes, totalAmount, itemTotal } = req.body;

        let parsedProducts, parsedTaxes;
        try {
            parsedProducts = JSON.parse(products);
            parsedTaxes = JSON.parse(taxes);
        } catch (e) {
            return res.status(400).json({ error: 'products and taxes must be valid JSON strings.' });
        }

        const estimation = new Estimation({
            client,
            products: parsedProducts,
            estimationNo: nextEstimationNo,
            estimationDate,
            currency,
            currencyId,
            discountType,
            itemTotal,
            sign: signImage,
            subTotal,
            discount,
            taxes: parsedTaxes,
            totalAmount,
            userId
        });
        await estimation.save();

        res.status(201).json({ data: estimation, success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Failed to create the estimation' });
    }
};

exports.getEstimationPreview = async (req, res) => {
    const estimationId = req.params.id;

    try {
        const estimation = await Estimation.findById(estimationId)
            .populate({
                path: 'products.product',
                select: 'name price currencySymbol images',
            })
            .populate('client');

        if (!estimation) {
            return res.status(404).json({ message: 'Estimation not found' });
        }
        if (estimation.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to view this estimation' });
        }

        const clientbilledcity = await city.findOne({ id: Number(estimation.client.billingAddress.city) });
        const clientbilledstate = await state.findOne({ id: Number(estimation.client.billingAddress.state) });
        const clientbilledcountry = await country.findOne({ id: parseInt(estimation.client.billingAddress.country) });

        estimation.client.billingAddress.city = clientbilledcity ? clientbilledcity.name : '';
        estimation.client.billingAddress.state = clientbilledstate ? clientbilledstate.name : '';
        estimation.client.billingAddress.country = clientbilledcountry ? clientbilledcountry.name : '';

        const userprofile = await UserProfile.findOne({ userId: estimation.userId });
        const usercity = await city.findOne({ id: parseInt(userprofile.address.city) });
        const userstate = await state.findOne({ id: parseInt(userprofile.address.state) });
        const usercountry = await country.findOne({ id: parseInt(userprofile.address.country) });

        userprofile.address.city = usercity ? usercity.name : '';
        userprofile.address.state = userstate ? userstate.name : '';
        userprofile.address.country = usercountry ? usercountry.name : '';

        const renderedHtml = await ejs.renderFile(path.join(__dirname, '../../views/myestimate.ejs'), {
            estimation: estimation,
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
            res.setHeader('Content-Disposition', 'attachment; filename="rendered-estimation.pdf"');
            res.send(pdfBuffer);
        } finally {
            if (browser) await browser.close();
            if (fs.existsSync(htmlFilePath)) fs.unlinkSync(htmlFilePath);
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to get the estimation' });
    }
};

exports.getAllEstimateData = async (req, res) => {
    const estimationId = req.params.id;

    try {
        const estimation = await Estimation.findById(estimationId)
            .populate({
                path: 'products.product',
                select: 'name price currencySymbol images',
            })
            .populate('client');

        if (!estimation) {
            return res.status(404).json({ message: 'Estimation not found' });
        }
        if (estimation.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to view this estimation' });
        }

        const clientbilledcity = await city.findOne({ id: Number(estimation.client.billingAddress.city) });
        const clientbilledstate = await state.findOne({ id: Number(estimation.client.billingAddress.state) });
        const clientbilledcountry = await country.findOne({ id: parseInt(estimation.client.billingAddress.country) });

        estimation.client.billingAddress.city = clientbilledcity ? clientbilledcity.name : '';
        estimation.client.billingAddress.state = clientbilledstate ? clientbilledstate.name : '';
        estimation.client.billingAddress.country = clientbilledcountry ? clientbilledcountry.name : '';

        const userprofile = await UserProfile.findOne({ userId: estimation.userId });
        if (!userprofile) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        const usercity = await city.findOne({ id: parseInt(userprofile.address.city) });
        const userstate = await state.findOne({ id: parseInt(userprofile.address.state) });
        const usercountry = await country.findOne({ id: parseInt(userprofile.address.country) });

        userprofile.address.city = usercity ? usercity.name : '';
        userprofile.address.state = userstate ? userstate.name : '';
        userprofile.address.country = usercountry ? usercountry.name : '';

        res.json({ estimation: estimation, userprofile: userprofile });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to get the estimation' });
    }
};

// Get all estimations for the authenticated user
exports.getAllEstimations = async (req, res) => {
    try {
        const estimations = await Estimation.find({ userId: req.userId });
        res.status(200).json({ content: estimations, success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve estimations' });
    }
};

// Get a single estimation by ID
exports.getEstimationById = async (req, res) => {
    try {
        const estimation = await Estimation.findById(req.params.id);
        if (!estimation) {
            return res.status(404).json({ error: 'Estimation not found' });
        }
        if (estimation.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to view this estimation' });
        }
        res.status(200).json({ data: estimation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve the estimation' });
    }
};

exports.getEstimationByUser = async (req, res) => {
    try {
        const userId = req.userId;
        const estimation = await Estimation.find({ userId: userId }).populate('client');
        if (!estimation) {
            return res.status(404).json({ error: 'Estimation not found' });
        }
        res.status(200).json({ data: estimation });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to retrieve the estimation' });
    }
};

// Update a single estimation by ID
exports.updateEstimation = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'Estimation id not provided' });
        }

        const existing = await Estimation.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Estimation not found' });
        }
        if (existing.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to update this estimation' });
        }

        const update = sanitizeUpdate(req.body);
        const estimation = await Estimation.findByIdAndUpdate(req.params.id, update, { new: true });
        res.status(200).json({ data: estimation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update the estimation' });
    }
};

// Delete a single estimation by ID
exports.deleteEstimation = async (req, res) => {
    try {
        const existing = await Estimation.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Estimation not found' });
        }
        if (existing.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this estimation' });
        }

        await Estimation.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Estimation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete the estimation' });
    }
};
