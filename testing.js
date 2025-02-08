const express = require('express');
const admin = require('firebase-admin');
const credentials = require('./udhaar-khata-2532e-firebase-adminsdk-j7g5b-99fda2b747.json');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});
const db = admin.firestore();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');

let k = path.join(__dirname, './views/public');
console.log(k);
app.use(express.static(k));

app.get('/',(req,res)=>{
    res.render('pages/testing');
})

app.post('/success', async(req,res)=>{
    try {
        console.log('received form Data',req.body);
        const testingJson = {
            name: req.body.name,
            email: req.body.email,
        };
        const formDb = db.collection('testData');
        const response = await formDb.add(testingJson);
        res.send(response);
    } catch (error) {
        res.status(500).send(error);
    }
})

app.listen(port , ()=>{
    console.log(`Server is running => http://localhost:${port}/`);
}); 
