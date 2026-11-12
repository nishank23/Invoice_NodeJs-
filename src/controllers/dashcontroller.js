const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../helpers/jwt');
const Client = require('../models/ClientModels/Client');
const Invoice = require('../models/InvoiceModel/invoice');

// Utility function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
};

// ObjectIds embed their creation timestamp (seconds) in the first 4 bytes.
// This lets us bucket documents by creation time for both new and pre-existing
// records (the Client/Invoice schemas have no `createdAt`/timestamps field).
function objectIdFromDate(date) {
    const hexSeconds = Math.floor(date.getTime() / 1000).toString(16).padStart(8, '0');
    return new mongoose.Types.ObjectId(hexSeconds + '0000000000000000');
}

// Endpoint to get data for the past 12 weeks for the authenticated user
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const weeksData = [];

        for (let i = 11; i >= 0; i--) {
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - (i * 7));
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);

            const idRange = { $gte: objectIdFromDate(startOfWeek), $lt: objectIdFromDate(endOfWeek) };

            const clientsCount = await Client.countDocuments({
                userId: new mongoose.Types.ObjectId(userId),
                _id: idRange
            });

            const invoicesCount = await Invoice.countDocuments({
                userId: new mongoose.Types.ObjectId(userId),
                _id: idRange
            });

            weeksData.push({
                week: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
                clientsCount,
                invoicesCount
            });
        }

        for (let i = 1; i < weeksData.length; i++) {
            weeksData[i].clientsPercentageChange = calculatePercentageChange(
                weeksData[i].clientsCount,
                weeksData[i - 1].clientsCount
            );
            weeksData[i].invoicesPercentageChange = calculatePercentageChange(
                weeksData[i].invoicesCount,
                weeksData[i - 1].invoicesCount
            );
        }

        res.json(weeksData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the data.' });
    }
});

module.exports = router;
