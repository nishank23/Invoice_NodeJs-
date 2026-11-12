// app.js loads config.env before returning, so process.env is ready here.
const app = require("./app");
const connectDB = require("./src/config/database");
const port = process.env.PORT || 3000;
const admin = require("firebase-admin");
const csv = require("csv-parser");
const fs = require("fs");
const mongoose = require("mongoose");
const Country = require("./src/models/addressModels/country");
const State = require("./src/models/addressModels/state");
const City = require("./src/models/addressModels/city");
const path = require("path");

// Load the Firebase service account from the (gitignored) JSON file, or an env var.
function loadServiceAccount() {
    const filePath = path.join(__dirname, "src/config/serviceAccountKey.json");
    if (fs.existsSync(filePath)) {
        return require(filePath);
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    throw new Error(
        "Firebase service account is missing. Restore src/config/serviceAccountKey.json or set FIREBASE_SERVICE_ACCOUNT."
    );
}

admin.initializeApp({
    credential: admin.cert(loadServiceAccount()),
});

connectDB()
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.error("Database connection failed:", err.message));

const importCSVData = (filePath, Model) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => {
                Model.insertMany(results)
                    .then(() => resolve(`Successfully imported data from ${filePath}`))
                    .catch((err) => reject(err));
            })
            .on("error", (err) => reject(err));
    });
};

// Import data for each collection
const importData = async () => {
    try {
        const countriesPath = path.join(__dirname, "data/countries.csv");
        const statesPath = path.join(__dirname, "data/states.csv");
        const citiesPath = path.join(__dirname, "data/cities.csv");

        await importCSVData(countriesPath, Country);
        await importCSVData(statesPath, State);
        await importCSVData(citiesPath, City);

        console.log("All data imported successfully!");
    } catch (err) {
        console.error("Error importing data:", err);
    }
};

// Run data import on server startup (disabled by default)
// importData();

const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
    console.error("Unhandled rejection:", err);
});
