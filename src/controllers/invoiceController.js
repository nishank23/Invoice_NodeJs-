const Invoice = require('../models/InvoiceModel/invoice');
const country = require('../models/addressModels/country');
const state = require('../models/addressModels/state');
const city = require('../models/addressModels/city');
const invoiceCounter = require('../models/InvoiceModel/invoiceCounter');
const UserProfile = require('../models/UserModels/userprofile');
const puppeteer = require('puppeteer');
const ejs = require('ejs'); // Import the ejs library
const path = require('path');
const fs = require('fs');

exports.getLatestInvoiceNo = async (req, res) => {
    try {
        const userId = req.userId;
        const nextEstimationNo = await getCurrentInvoiceNumber(userId);
        res.status(200).json({data: {estimationNo: nextEstimationNo}});
    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve the latest estimation number'});
    }
};

const getNextInvoiceNumber = async (userId) => {
    let estimationCount = await invoiceCounter.findOneAndUpdate(
        {userId},
        {$inc: {counter: 1}},
        {upsert: true, new: true}
    );

    return `EST${estimationCount.counter}`;
};
const getCurrentInvoiceNumber = async (userId) => {
    let invoiceCount = await invoiceCounter.findOne(
        {userId},
    );
    if(invoiceCount==null){
        return `EST${1}`;
    }
    return `EST${invoiceCount.counter + 1}`;
};

exports.createInvoice = async (req, res) => {
    try {

        console.log("tried");

        console.log(req.body);
        const userId = req.userId;
        const nextEstimationNo = await getNextInvoiceNumber(userId);
        console.log("myestimationNumber" + nextEstimationNo);// Assuming you have the authenticated user's ID available in req.user.id

        let signImage = null;
        if (req.file && req.file.path) {
            signImage = req.file.path;
        }


        console.log(signImage);

        const {
            billingAddress,
            shippingAddress,
            products,
            invoiceDate,
            dueDate,
            currency,
            subTotal,
            discount,
            taxes,
            totalAmount
        } = req.body;


        const parsedProducts = JSON.parse(products);
        const parsedTaxes = JSON.parse(taxes);
        const parsedBilling = JSON.parse(billingAddress);
        const parsedshipping = JSON.parse(shippingAddress);


        console.log(parsedProducts);
        console.log(parsedTaxes);


        const invoice = new Invoice({
            shippingAddress: parsedshipping,
            billingAddress: parsedBilling,
            products: parsedProducts,
            estimationNo: nextEstimationNo,
            invoiceDate,
            dueDate,
            currency,
            sign: signImage,
            subTotal,
            discount,
            taxes: parsedTaxes,
            totalAmount,
            userId
        });
        await invoice.save();

        console.log(invoice);


        res.status(201).json({data: invoice, success: true});
    } catch (error) {

        console.log(error.message);
        res.status(500).json({error: 'Failed to create the estimation'});
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


        if (!estimation) {
            return res.status(404).json({message: 'Estimation not found'});
        }

        console.log(estimation.sign);

        const clientbilledcity = await city.findOne({id: Number(invoice.billingAddress.city)});
        const clientbilledstate = await city.findOne({id: Number(invoice.billingAddress.state)});
        const clientbilledcountry = await city.findOne({id: parseInt(invoice.billingAddress.country)});


        const clientshipcity = await city.findOne({id: Number(invoice.shippingAddress.city)});
        const clientshipstate = await city.findOne({id: Number(invoice.shippingAddress.state)});
        const clientshipcountry = await city.findOne({id: parseInt(invoice.shippingAddress.country)});

        invoice.billingAddress.city = clientbilledcity.name;
        invoice.billingAddress.state = clientbilledstate.name;
        invoice.billingAddress.country = clientbilledcountry.name;


        invoice.shippingAddress.city = clientshipcity.name;
        invoice.shippingAddress.state = clientshipstate.name;
        invoice.shippingAddress.country = clientshipcountry.name;


        const userprofile = await UserProfile.findOne({userId: invoice.userId})
        const usercity = await city.findOne({id: parseInt(userprofile.address.city)});
        const userstate = await state.findOne({id: parseInt(userprofile.address.state)});
        const usercountry = await country.findOne({id: parseInt(userprofile.address.country)});


        userprofile.address.city = usercity.name;
        userprofile.address.state = userstate.name;
        userprofile.address.country = usercountry.name;


        console.log(path.join(__dirname));
        console.log(path.join(__dirname, "./../views/myinvoice.ejs"));

        /*
                res.render('invoice', { estimation });
        */

        const renderedHtml = await ejs.renderFile(path.join(__dirname, '../../views/myinvoice.ejs'), {
            invoice: invoice,
            userprofile: userprofile,
            baseUrl: "http://165.22.218.255:3000/"
        });

        // Create a temporary HTML file with the rendered HTML content
        const htmlFilePath = path.join(__dirname, 'temp_invoice.html');
        fs.writeFileSync(htmlFilePath, renderedHtml);

        // Launch Puppeteer and generate the PDF
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
        const page = await browser.newPage();

        // Load the temporary HTML file
        await page.goto(`file://${htmlFilePath}`, {waitUntil: 'networkidle0'});

        // Generate the PDF as a buffer
        const pdfBuffer = await page.pdf({
            format: 'A4', // Use 'Letter' for US Letter paper size
            printBackground: true
        });

        await browser.close();

        // Clean up the temporary HTML file
        fs.unlinkSync(htmlFilePath);

        // Set the response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="rendered-invoice.pdf"');
        res.send(pdfBuffer);


    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to get the estimation', e: e});

    }
};

exports.getAllInvoiceData = async (req, res) => {
    const estimationId = req.params.id;

    try {
        const invoice = await Invoice.findById(estimationId)
            .populate({
                path: 'products.product',
                select: 'name price currencySymbol images',
            })



        if (!invoice) {
            return res.status(404).json({message: 'Invoice not found'});
        }
        const clientbilledcity = await city.findOne({id: Number(invoice.billingAddress.city)});
        const clientbilledstate = await city.findOne({id: Number(invoice.billingAddress.state)});
        const clientbilledcountry = await city.findOne({id: parseInt(invoice.billingAddress.country)});


        const clientshipcity = await city.findOne({id: Number(invoice.shippingAddress.city)});
        const clientshipstate = await city.findOne({id: Number(invoice.shippingAddress.state)});
        const clientshipcountry = await city.findOne({id: parseInt(invoice.shippingAddress.country)});

        invoice.billingAddress.city = clientbilledcity.name;
        invoice.billingAddress.state = clientbilledstate.name;
        invoice.billingAddress.country = clientbilledcountry.name;


        invoice.shippingAddress.city = clientshipcity.name;
        invoice.shippingAddress.state = clientshipstate.name;
        invoice.shippingAddress.country = clientshipcountry.name;


        const userprofile = await UserProfile.findOne({userId: invoice.userId})
        const usercity = await city.findOne({id: parseInt(userprofile.address.city)});
        const userstate = await state.findOne({id: parseInt(userprofile.address.state)});
        const usercountry = await country.findOne({id: parseInt(userprofile.address.country)});


        userprofile.address.city = usercity.name;
        userprofile.address.state = userstate.name;
        userprofile.address.country = usercountry.name;


        console.log(estimation.sign);


        res.json({invoice: invoice, userprofile: userprofile});

    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to get the estimation'});

    }
}
// Get a single estimation by ID
exports.getInvoiceById = async (req, res) => {
    try {
        const estimation = await Invoice.findById(req.params.id);
        if (!estimation) {
            return res.status(404).json({error: 'Estimation not found'});
        }
        res.status(200).json({data: estimation});
    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve the estimation'});
    }
};
exports.getInvoiceByUser = async (req, res) => {
    try {
        const userId = req.userId;

        const invoice = await Invoice.find({userId: userId});
        if (!invoice) {
            return res.status(404).json({error: 'Estimation not found'});
        }


        res.status(200).json({data: invoice});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to retrieve the estimation'});
    }
};

// Update a single estimation by ID
exports.updateInvoice = async (req, res) => {
    try {

        if (!req.params.id) {
            return res.status(400).json({error: 'Estimation id not provided'})
        }

        const estimation = await Invoice.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        );
        if (!estimation) {
            return res.status(404).json({error: 'Estimation not found'});
        }
        res.status(200).json({data: estimation});
    } catch (error) {
        res.status(500).json({error: 'Failed to update the estimation'});
    }
};

// Delete a single estimation by ID
exports.deleteInvoice = async (req, res) => {
    try {
        const estimation = await Invoice.findByIdAndDelete(req.params.id);
        if (!estimation) {
            return res.status(404).json({error: 'Estimation not found'});
        }
        res.status(200).json({message: 'Estimation deleted successfully'});
    } catch (error) {
        res.status(500).json({error: 'Failed to delete the estimation'});
    }
};

