const Client = require('../models/ClientModels/Client');
const City = require("../models/addressModels/city");
const State = require("../models/addressModels/state");
const Country = require("../models/addressModels/country");

// Create or Update Client
    const createOrUpdateClient = async (req, res) => {
        try {
            const userId = req.userId; // Assuming you have the authenticated user's ID available in req.user.id
            console.log(userId);
            console.log(req.body);
            let clientId = req.params.clientId;



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
                    personName: parsedsAddress.personName,
                    mobileNumber: parsedsAddress.mobileNumber,
                    addressLine: parsedsAddress.addressLine,
                    city: parsedsAddress.city,
                    state: parsedsAddress.state,
                    country: parsedsAddress.country,
                    postalCode: parsedsAddress.postalCode,
                };
                client.billingAddress = {
                    personName: parsedbAddress.personName,
                    mobileNumber: parsedbAddress.mobileNumber,
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
                    },
                    shippingAddress: {
                        personName: parsedsAddress.personName,
                        mobileNumber: parsedsAddress.mobileNumber,
                        addressLine: parsedsAddress.addressLine,
                        city: parsedsAddress.city,
                        state: parsedsAddress.state,
                        country: parsedsAddress.country,
                        postalCode: parsedsAddress.postalCode,
                    }, billingAddress: {
                        personName: parsedbAddress.personName,
                        mobileNumber: parsedbAddress.mobileNumber,
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
        const { clientId } = req.params;

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(400).json({ message: 'Client not found.' });
        }

        // Fetch address details using findOne
        const city_ship = await City.findOne({ id: client.shippingAddress.city });
        const state_ship = await State.findOne({ id: client.shippingAddress.state });
        const country_ship = await Country.findOne({ id: client.shippingAddress.country });

        const city_bill = await City.findOne({ id: client.billingAddress.city });
        const state_bill = await State.findOne({ id: client.billingAddress.state });
        const country_bill = await Country.findOne({ id: client.billingAddress.country });

        // Combine information
        const clientData = {
            ...client.toObject(), // Convert Mongoose model instance to plain object
            shippingAddressDetails: {
                city: city_ship ? city_ship.name : null,
                state: state_ship ? state_ship.name : null,
                country: country_ship ? country_ship.name : null
            },
            billingAddressDetails: {
                city: city_bill ? city_bill.name : null,
                state: state_bill ? state_bill.name : null,
                country: country_bill ? country_bill.name : null
            }
        };

        res.status(200).json({ success: true, clientData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch client.', error });
    }
};


module.exports = {
    createOrUpdateClient, getClientsByUser, uploadClientProfile, getClientById, deleteClient
};
