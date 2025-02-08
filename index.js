const express = require('express');
const admin = require('firebase-admin');
const credentials = require('./udhaar-khata-2532e-firebase-adminsdk-j7g5b-10df429245.json');
const bodyParser = require('body-parser');
const session = require('express-session');

const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const port = 4000;


app.use(session({
  secret: "udhar-account",
  resave: false,
  saveUninitialized: true
}));

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});
const db = admin.firestore();

const router = require('./registration_routes')(db);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');

let k = path.join(__dirname, './views/public');
console.log(k);
app.use(express.static(k));

app.use('/', router);

app.get('/logout', (req, res) => {
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Error destroying session');
    } else {
      console.log('Session Destroyed Successfully');
      res.redirect('/');
    }
  });
});

app.listen(port , ()=>{
    console.log(`Server is running => http://localhost:${port}/`);
}); 
module.exports = function (){
  return{
    db
  };
};