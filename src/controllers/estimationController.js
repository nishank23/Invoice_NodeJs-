const Estimation = require('../models/EstimationModel/estimation');
const country = require('../models/addressModels/country');
const state = require('../models/addressModels/state');
const city = require('../models/addressModels/city');
const estimationCounter = require('../models/estimationCounter/estimationCounter');
const UserProfile = require('../models/UserModels/userprofile');
const puppeteer = require('puppeteer');
const ejs = require('ejs'); // Import the ejs library
const path = require('path');
const fs = require('fs');

exports.getLatestEstimationNo = async (req, res) => {
    try {
        const userId = req.userId;
        const nextEstimationNo= await getCurrentEstimationNumber(userId);
        res.status(200).json({data:{ estimationNo: nextEstimationNo }});
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
        // Handle the case where estimationCount is null
        estimationCount = { userId, counter: 1 }; // Set userId and default counter value
        await estimationCounter.create(estimationCount); // Create a new document
    }
    return `EST${estimationCount.counter}`;
};const getCurrentEstimationNumber = async (userId) => {
    let estimationCount = await estimationCounter.findOne(
        { userId },
    );
    if(estimationCount==null){
        return `EST${1}`;
    }
    return `EST${estimationCount.counter+1}`;
};

exports.createEstimation = async (req, res) => {
    try {

        console.log("tried");

        console.log(req.body);
        const userId = req.userId;
        const nextEstimationNo = await getNextEstimationNumber(userId);
        console.log("myestimationNumber"+nextEstimationNo);// Assuming you have the authenticated user's ID available in req.user.id

        let signImage = null;
        if (req.file && req.file.path) {
            signImage = req.file.path;
        }


        console.log(signImage);

        const { client, products, estimationDate, currency, subTotal, discount, taxes, totalAmount ,itemTotal} = req.body;


        const parsedProducts = JSON.parse(products);
        const parsedTaxes = JSON.parse(taxes);



        console.log(parsedProducts);
        console.log(parsedTaxes);



        const estimation = new Estimation({
            client,
           products: parsedProducts,
            estimationNo: nextEstimationNo,
            estimationDate,
            currency,
            itemTotal,
            sign:signImage,
            subTotal,
            discount,
           taxes: parsedTaxes,
            totalAmount,
            userId

        });
        await estimation.save();

        console.log(estimation);


        res.status(201).json({data:estimation,success:true});
    } catch (error) {

        console.log(error.message);
        res.status(500).json({ error: 'Failed to create the estimation' });
    }
};

exports.getEstimationPreview = async (req,res) =>{
    const estimationId = req.params.id;

    try {
        const estimation = await Estimation.findById(estimationId)
            .populate({
                path: 'products.product',
                select: 'name price currencySymbol images',
            })
            .populate('client');


        if (!estimation) {
            return res.status(404).json({message: 'Estimation not found'});
        }

        console.log(estimation.sign);

        const clientbilledcity = await city.findOne({id: Number(estimation.client.billingAddress.city)});
        const clientbilledstate = await state.findOne({id: Number(estimation.client.billingAddress.state)});
        const clientbilledcountry = await country.findOne({id: parseInt(estimation.client.billingAddress.country)});

        estimation.client.billingAddress.city = clientbilledcity.name;
        estimation.client.billingAddress.state = clientbilledstate.name;
        estimation.client.billingAddress.country = clientbilledcountry.name;


        const userprofile = await UserProfile.findOne({userId: estimation.userId})
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
            estimation: estimation,
            userprofile: userprofile,
            baseUrl: "http://165.22.218.255:3000/"
        });

        // Create a temporary HTML file with the rendered HTML content
        const htmlFilePath = path.join(__dirname, 'temp_invoice.html');
        fs.writeFileSync(htmlFilePath, renderedHtml);

        // Launch Puppeteer and generate the PDF
        const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
        const page = await browser.newPage();

        // Load the temporary HTML file
        await page.goto(`file://${htmlFilePath}`, { waitUntil: 'networkidle0' });

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


        // Send the PDF buffer as the response

    }catch (e) {
            console.log(e);
            res.status(500).json({error: 'Failed to get the estimation', e: e});

        }
    };

exports.getAllEstimateData = async (req,res) =>{
    const estimationId = req.params.id;

    try {
        const estimation = await Estimation.findById(estimationId)
            .populate({
                path: 'products.product',
                select: 'name price currencySymbol images',
            })
            .populate('client');


        const clientbilledcity = await city.findOne({ id: Number(estimation.client.billingAddress.city) });
        const clientbilledstate = await state.findOne({ id: Number(estimation.client.billingAddress.state) });
        const clientbilledcountry = await country.findOne({ id: parseInt(estimation.client.billingAddress.country) });

        estimation.client.billingAddress.city = clientbilledcity.name;
        estimation.client.billingAddress.state = clientbilledstate.name;
        estimation.client.billingAddress.country = clientbilledcountry.name;



        let userprofile = await UserProfile.findOne({userId:estimation.userId})
        if (!userprofile) {
            // Handle the case where userprofile is not found
            return res.status(404).json({ message: 'User profile not found' });
        }

        const usercity = await city.findOne({id:parseInt(userprofile.address.city)});
        const userstate = await state.findOne({id:parseInt(userprofile.address.state)});
        const usercountry = await country.findOne({id:parseInt(userprofile.address.country)});


        userprofile.address.city = usercity.name;
        userprofile.address.state = userstate.name;
        userprofile.address.country = usercountry.name;



        if (!estimation) {
            return res.status(404).json({ message: 'Estimation not found' });
        }

        console.log(estimation.sign);


        /*
                res.render('invoice', { estimation });
        */


        res.json({estimation:estimation,userprofile:userprofile});

/*
        res.render('myinvoice', {estimation: estimation,userprofile: userprofile });
*/



    }catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to get the estimation' });

    }
}

// Get all estimations
exports.getAllEstimations = async (req, res) => {
    try {
        const estimations = await Estimation.find();
        res.status(200).json({content:estimations,success:true});
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
        res.status(200).json({data:estimation});
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve the estimation' });
    }
};
exports.getEstimationByUser = async (req, res) => {
    try {
        const userId = req.userId;

        const estimation = await Estimation.find({userId:userId}).populate('client');
        if (!estimation) {
            return res.status(404).json({ error: 'Estimation not found' });
        }


        res.status(200).json({data:estimation});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to retrieve the estimation' });
    }
};

// Update a single estimation by ID
exports.updateEstimation = async (req, res) => {
    try {

        if(!req.params.id){
            return res.status(400).json({error:'Estimation id not provided'})
        }

        const estimation = await Estimation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!estimation) {
            return res.status(404).json({ error: 'Estimation not found' });
        }
        res.status(200).json({data:estimation});
    } catch (error) {
        res.status(500).json({ error: 'Failed to update the estimation' });
    }
};

// Delete a single estimation by ID
exports.deleteEstimation = async (req, res) => {
    try {
        const estimation = await Estimation.findByIdAndDelete(req.params.id);
        if (!estimation) {
            return res.status(404).json({ error: 'Estimation not found' });
        }
        res.status(200).json({ message: 'Estimation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete the estimation' });
    }
};

