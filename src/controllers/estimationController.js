const Estimation = require('../models/EstimationModel/estimation');
const country = require('../models/addressModels/country');
const state = require('../models/addressModels/state');
const city = require('../models/addressModels/city');
const UserProfile = require('../models/UserModels/userprofile');

exports.getLatestEstimationNo = async (req, res) => {
    try {
        const userId = req.userId;


/*
        const latestEstimation = await Estimation.findOne({userId: userId }).sort({ estimationNo: -1 });


        if (latestEstimation) {
            console.log("inside");
            res.status(200).json({data:{ estimationNo: "EST1"} });
        } else {
            console.log("no data");

        }
        */

        res.status(200).json({data:{ estimationNo: "EST1" }});
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve the latest estimation number' });
    }
};
exports.createEstimation = async (req, res) => {
    try {

        console.log("tried");

        console.log(req.body);
        const userId = req.userId; // Assuming you have the authenticated user's ID available in req.user.id

        const signImage = req.file.path!=null?req.file.path:null;

        console.log(signImage);

        const { client, products, estimationDate, currency, subTotal, discount, taxes, totalAmount } = req.body;


        const parsedProducts = JSON.parse(products);
        const parsedTaxes = JSON.parse(taxes);

        // Get the latest estimation number for the current user
/*
        const latestEstimation = await Estimation.findOne({ userId }).sort({ estimationNo: -1 });
*/

        const size = await Estimation.find({userId:userId});

        var estimatNo =size.length+ 1;


        // Default estimation number for a new user

      /*  if (latestEstimation) {
       /!*     const latestEstimationNo = latestEstimation.estimationNo;
            const numberPart = parseInt(latestEstimationNo.substring(3)); // Extract the number part
            estimationNo = `EST${numberPart + 1}`;*!/

            estimationNo ='1';
        }*/

        console.log(parsedProducts);
        console.log(parsedTaxes);

        var myestt="EST"+estimatNo.toString();


        const estimation = new Estimation({
            client,
           products: parsedProducts,
            estimationNo: myestt,
            estimationDate,
            currency,
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
            return res.status(404).json({ message: 'Estimation not found' });
        }

        console.log(estimation.sign);

        const clientbilledcity = await city.findOne({ id: Number(estimation.client.billingAddress.city) });
        const clientbilledstate = await city.findOne({ id: Number(estimation.client.billingAddress.state) });
        const clientbilledcountry = await city.findOne({ id: parseInt(estimation.client.billingAddress.country) });

        estimation.client.billingAddress.city = clientbilledcity.name;
        estimation.client.billingAddress.state = clientbilledstate.name;
        estimation.client.billingAddress.country = clientbilledcountry.name;



        const userprofile = await UserProfile.findOne({userId:estimation.userId})
        const usercity = await city.findOne({id:parseInt(userprofile.address.city)});
        const userstate = await city.findOne({id:parseInt(userprofile.address.state)});
        const usercountry = await city.findOne({id:parseInt(userprofile.address.country)});


        userprofile.address.city = usercity.name;
        userprofile.address.state = userstate.name;
        userprofile.address.country = usercountry.name;






        /*
                res.render('invoice', { estimation });
        */


        res.render('myinvoice', {estimation: estimation,userprofile: userprofile });



    }catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to get the estimation' });

    }
}

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
        const clientbilledstate = await city.findOne({ id: Number(estimation.client.billingAddress.state) });
        const clientbilledcountry = await city.findOne({ id: parseInt(estimation.client.billingAddress.country) });

        estimation.client.billingAddress.city = clientbilledcity.name;
        estimation.client.billingAddress.state = clientbilledstate.name;
        estimation.client.billingAddress.country = clientbilledcountry.name;



        const userprofile = await UserProfile.findOne({userId:estimation.userId})
        const usercity = await city.findOne({id:parseInt(userprofile.address.city)});
        const userstate = await city.findOne({id:parseInt(userprofile.address.state)});
        const usercountry = await city.findOne({id:parseInt(userprofile.address.country)});


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

