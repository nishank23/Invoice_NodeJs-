const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Assuming you have models named 'Client' and 'Invoice'
const Client = mongoose.model('Client');
const Invoice = mongoose.model('Invoice');

// Utility function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current === 0 ? 0 : 100; // Avoid division by zero
    return ((current - previous) / previous) * 100;
};

// Endpoint to get data for the past 12 weeks for a specific user
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'userId query parameter is required' });
        }

        const weeksData = [];

        for (let i = 11; i >= 0; i--) {
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - (i * 7));
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);

            const clientsCount = await Client.countDocuments({
                userId:new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startOfWeek, $lt: endOfWeek }
            });

            const invoicesCount = await Invoice.countDocuments({
                userId:new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startOfWeek, $lt: endOfWeek }
            });

            weeksData.push({
                week: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
                clientsCount,
                invoicesCount
            });
        }

        // Calculate percentage changes
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

        // Send the response
        res.json(weeksData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the data.' });
    }
});

module.exports = router;
