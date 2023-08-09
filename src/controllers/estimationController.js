const Estimation = require('../models/EstimationModel/estimation');
const UserProfile = require('../models/UserModels/userprofile');

exports.getLatestEstimationNo = async (req, res) => {
    try {
        const userId = req.userId;


        const latestEstimation = await Estimation.findOne({userId: userId }).sort({ estimationNo: -1 });

        if (latestEstimation) {
            console.log("inside");
            res.status(200).json({data:{ estimationNo: latestEstimation.estimationNo} });
        } else {
            console.log("no data");

            res.status(200).json({data:{ estimationNo: "EST1" }});
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve the latest estimation number' });
    }
};
exports.createEstimation = async (req, res) => {
    try {

        console.log("tried");

        console.log(req.body);
        const userId = req.userId; // Assuming you have the authenticated user's ID available in req.user.id

        if (!req.file) {
            // No file was uploaded
            return res.status(400).json({success: false, message: 'No file was uploaded.'});
        }
        const signImage = req.file.path!=null?req.file.path:null;

        console.log(signImage);

        const { client, products, estimationDate, currency, subTotal, discount, taxes, totalAmount } = req.body;


        const parsedProducts = JSON.parse(products);
        const parsedTaxes = JSON.parse(taxes);

        // Get the latest estimation number for the current user
        const latestEstimation = await Estimation.findOne({ userId }).sort({ estimationNo: -1 });

        let estimationNo = "EST1"; // Default estimation number for a new user

        if (latestEstimation) {
            const latestEstimationNo = latestEstimation.estimationNo;
            const numberPart = parseInt(latestEstimationNo.substring(3)); // Extract the number part
            estimationNo = `EST${numberPart + 1}`;
        }

        console.log(parsedProducts);
        console.log(parsedTaxes);


        const estimation = new Estimation({
            client,
           products: parsedProducts,
            estimationNo,
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
                select: 'name price currencySymbol',
            })
            .populate('client');


        const userprofile = await UserProfile.findOne({userId:estimation.userId})

        if (!estimation) {
            return res.status(404).json({ message: 'Estimation not found' });
        }

        console.log(estimation.sign);


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
                select: 'name price currencySymbol',
            })
            .populate('client');


        const userprofile = await UserProfile.findOne({userId:estimation.userId})

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

