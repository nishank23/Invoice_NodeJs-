const app = require('./app');
const connectDB = require('./src/config/database');
const port = process.env.PORT || 3000;
const admin = require("firebase-admin");
const serviceAccount = require('./src/config/serviceAccountKey.json');
const { initializeApp } = require('firebase-admin/app');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const Country = require('./src/models/addressModels/country');
const State = require('./src/models/addressModels/state');
const City = require('./src/models/addressModels/city');
const path = require("path");


/*const firebaseapp = initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: 'https://your-project-id.firebaseio.com',
});*/

/*var admin = require("firebase-admin");

var serviceAccount = require("path/to/serviceAccountKey.json");*/

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://invoicemanager-909f5-default-rtdb.asia-southeast1.firebasedatabase.app"
});
connectDB()
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error(err));

app.get('/', (req, res) => {

    res.render('home');

    console.log("data")
});

app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

