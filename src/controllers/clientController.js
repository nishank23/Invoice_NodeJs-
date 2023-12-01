const Client = require('../models/ClientModels/Client');

// Create or Update Client
    const createOrUpdateClient = async (req, res) => {
        try {
            const userId = req.userId; // Assuming you have the authenticated user's ID available in req.user.id
            console.log(userId);
            console.log(req.body);
            const clientId = req.params.clientId;



/*
            const clientPhoto =  req.file.path!=null?req.file.path:null;
*/


            let clientPhoto = null;
            if (req.file && req.file.path) {
                clientPhoto = req.file.path;
            }

            const {
                 company, shippingAddress, billingAddress
            } = req.body;



            const parsedCompany = JSON.parse(company);
            const parsedsAddress = JSON.parse(shippingAddress);
            const parsedbAddress = JSON.parse(billingAddress);


            let client = await Client.findById(clientId);

            if (client) {
                client.clientPhoto = clientPhoto;
                client.userId = userId;
                client.company = {
                    name: parsedCompany.name,
                    personName: parsedCompany.personName,
                    mobileNumber: parsedCompany.mobileNumber,
                    alternativeMobileNumber: parsedCompany.alternativeMobileNumber || '',
                    gstNumber: parsedCompany.gstNumber,
                    email: parsedCompany.email,
                    website: parsedCompany.website || '',
                };
                client.shippingAddress = {
                    addressLine: parsedsAddress.addressLine,
                    city: parsedsAddress.city,
                    state: parsedsAddress.state,
                    country: parsedsAddress.country,
                    postalCode: parsedsAddress.postalCode,
                };
                client.billingAddress = {
                    addressLine: parsedbAddress.addressLine,
                    city: parsedbAddress.city,
                    state: parsedbAddress.state,
                    country: parsedbAddress.country,
                    postalCode: parsedbAddress.postalCode,
                };

                await client.save();
                res.status(200).json({message: 'Client updated successfully.'});
            } else {
                client = new Client({
                    userId, clientPhoto,


                    company: {
                        name: parsedCompany.name,
                        personName: parsedCompany.personName,
                        mobileNumber: parsedCompany.mobileNumber,
                        alternativeMobileNumber: parsedCompany.alternativeMobileNumber || '',
                        gstNumber: parsedCompany.gstNumber,
                        email: parsedCompany.email,
                        website: parsedCompany.website || '',
                    }, shippingAddress: {
                        addressLine: parsedsAddress.addressLine,
                        city: parsedsAddress.city,
                        state: parsedsAddress.state,
                        country: parsedsAddress.country,
                        postalCode: parsedsAddress.postalCode,
                    }, billingAddress: {
                        addressLine: parsedbAddress.addressLine,
                        city: parsedbAddress.city,
                        state: parsedbAddress.state,
                        country: parsedbAddress.country,
                        postalCode: parsedbAddress.postalCode,
                    },
                });

                await client.save();
                res.status(200).json({message: 'Client created successfully.'});
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({message: 'Failed to create/update client.', error});
        }
    };


const uploadClientProfile = async (req, res) => {

    try {
        if (!req.file) {
            // No file was uploaded
            return res.status(400).json({success: false, message: 'No file was uploaded.'});
        }
        // File uploaded successfully
        res.json({success: true, message: 'File uploaded successfully.', file: req.file});

    } catch (error) {
        res.status(500).json({message: 'Failed to upload user profile.', error});
    }
};


// Get all Clients for a User
const getClientsByUser = async (req, res) => {
    try {
        const userId = req.userId; // Assuming you have the authenticated user's ID available in req.user.id

        const clients = await Client.find({userId});
        res.status(200).json({success: true, clientData: clients});
    } catch (error) {
        res.status(500).json({message: 'Failed to fetch clients.', error});
    }
};

// Delete a Client
const deleteClient = async (req, res) => {
    try {
        const {clientId} = req.params;

        const client = await Client.findByIdAndDelete(clientId);
        if (!client) {
            return res.status(400).json({message: 'Client not found.'});
        }

        res.status(200).json({message: 'Client deleted successfully.'});
    } catch (error) {
        res.status(500).json({message: 'Failed to delete client.', error});
    }
};
const getClientById = async (req, res) => {
    try {
        const {clientId} = req.params;

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(400).json({message: 'Client not found.'});
        }

        res.status(200).json({success:true,clientData:client});
    } catch (error) {
        res.status(500).json({message: 'Failed to fetch client.', error});
    }
};

module.exports = {
    createOrUpdateClient, getClientsByUser, uploadClientProfile, getClientById, deleteClient
};
