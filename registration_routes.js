const express = require('express');
const router = express.Router();

module.exports = function (db) {

  router.get('/', async (req, res) => {
    try {
      const customerRef = db.collection('customerData');
      const snapshot = await customerRef.get();
      const customerCount = snapshot.size;
      res.render('pages/welcome');
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).send("Error fetching customers");
    }
  });

  router.get('/signup', (req, res) => {
    res.render('pages/signup');
  });

  router.post('/signupSuccess', async (req, res) => {
    try {
      const uData = req.body;
      console.log(uData);
      const userJson = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        contact: req.body.contact
      };
      const formDb = db.collection('userData');
      const response = await formDb.add(userJson);
      res.redirect("/login");
    } catch (error) {
      res.send(error);
    }
  });

  router.get('/login', (req, res) => {
    res.render('pages/Login');
  });

  router.post('/loginSuccess', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(req.body);

      const userRef = db.collection('userData').where('email', '==', email);
      const querySnapshot = await userRef.get();

      if (querySnapshot.size === 0) {
        return res.status(404).send("User not found");
      } else {
        const userData = querySnapshot.docs[0].data();

        if (userData.password !== password) {
          return res.status(401).send("Incorrect password");
        } else {
          console.log("Username:", userData.name);
          req.session.userId = querySnapshot.docs[0].id;
          console.log('Session Established');
          res.redirect('/welcome');
        }
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  router.get('/welcome', async (req, res) => {
    try {
      // Check if user session exists
      if (req.session.userId) {
        console.log("Session User ID On Welcome Route:", req.session.userId);

        const userId = req.session.userId;

        // Query Firestore to fetch user data based on user ID
        const userRef = db.collection('userData').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
          console.error("User not found in database");
          return res.send("User not found in database");
        }

        const userData = doc.data();
        // console.log("Here Is The User Data->", userData);

        // Render success page with user's name
        res.render("pages/success", { userName: userData.name });
      } else {
        // If user session does not exist
        res.send("SORRY YOU CANNOT LOGIN");
      }
    } catch (error) {
      // Handle errors
      console.error("Error fetching user data:", error);
      res.status(500).send("Error fetching user data");
    }
  });

  router.get('/addCustomer', (req, res) => {
    res.render('pages/addCustomer');
  })

  router.post('/customerAdded', async (req, res) => {
    try {
      console.log("Session UserID on Customer Route", req.session.userId);

      if (!req.session.userId) {
        console.error("Session user not found");
        return res.status(400).send("Session user not found");
      }

      const userId = req.session.userId;

      const userRef = db.collection('userData').doc(userId);
      const userSnapshot = await userRef.get();

      if (userSnapshot.empty) {
        console.error("User not found in database");
        return res.status(404).send("User not found in database");
      }

      const customerData = {
        name: req.body.name,
        contact: req.body.contact,
        email: req.body.email,
        city: req.body.city,
        userId: userId
      };

      //   if (req.body.accountType === "business") {
      //     customerData.businessName = req.body.businessName;
      //     customerData.previousLoan = req.body.previousLoan;
      // }
      const customerRef = db.collection('customerData');
      await customerRef.add(customerData);
      console.log('Customer Added!');
      res.redirect('/visitUs');
    } catch (error) {
      console.error("Error adding customer:", error);
      res.status(500).send(error.message);
    }
  });

  router.get('/visitUs', async (req, res) => {
    try {
      console.log("Session UserID on Take Loan ROUTE =>", req.session.userId);

      if (!req.session.userId) {
        console.error("Session user not found");
        return res.status(400).send("Session user not found");
      }

      const userId = req.session.userId;

      const userRef = db.collection('userData').doc(userId);
      const userSnapshot = await userRef.get();

      if (userSnapshot.empty) {
        console.error("User not found in database");
        return res.status(404).send("User not found in database");
      }

      const customerRef = db.collection('customerData').where('userId', '==', userId);
      const customerSnapshot = await customerRef.get();

      const customers = [];
      customerSnapshot.forEach(doc => {
        const data = doc.data();
        const customer = {
          id: doc.id,
          name: data.name,
          email: data.email,
          contact: data.contact,
          city: data.city
        };
        customers.push(customer);
      });

      // console.log("Customers:", customers); 

      res.render('pages/visitUs', { customers: customers });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).send(error.message);
    }
  });

  router.get('/editCustomer', async (req, res) => {
    try {
      console.log("Session UserID From Edit Customer Route ->", req.session.userId);
      // Check if user session exists
      if (!req.session.userId) {
        console.error("Session user not found");
        return res.status(400).send("Session user not found");
      }

      const userId = req.session.userId;

      // Query Firestore to fetch customer data added by the user
      const customerRef = db.collection('customerData').where('userId', '==', userId);
      const customerSnapshot = await customerRef.get();

      const customers = [];
      customerSnapshot.forEach(doc => {
        const data = doc.data();
        const customer = {
          id: doc.id,
          name: data.name,
          email: data.email,
          contact: data.contact,
          city: data.city
        };
        customers.push(customer);
      });

      res.render('pages/editCustomer', { customers: customers });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).send(error.message);
    }
  });

  router.post('/updateCustomer', async (req, res) => {
    try {
      const { customerId, name, contact, email, city } = req.body;
      // console.log(req.body);
      // Update customer document in the database
      const customerRef = db.collection('customerData').doc(customerId);
      await customerRef.update({
        name: name,
        contact: contact,
        email: email,
        city: city
      });

      res.redirect('/welcome');
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).send(error.message);
    }
  });

  router.post('/successLoanForm', async (req, res) => {
    try {
      console.log('here is the session user id from Loan Form', req.session.userId);
      // console.log("Received loan form submission:", req.body); 
      if (!req.session.userId) {
        console.error("Session user not found");
        return res.status(400).send("Session user not found");
      }
      const userId = req.session.userId;
      // console.log('received data', req.body);

      const loanJson = {
        accountType: req.body.accountType,
        businessName: req.body.businessName || null,
        previousLoan: req.body.previousLoan || null,
        userId: userId,
        name: req.body.name,
        contact: req.body.contact,
        email: req.body.email,
        city: req.body.city,
        customerId: req.body.customerId,
        loanAmount: req.body.loanAmount,
        loanDate: req.body.loanDate,
        paymentType: req.body.paymentType,
        interestRate: req.body.interestRate || null,
        emiDuration: req.body.emiDurationPrint || null,
        totalAmountWithInterest: req.body.totalAmountWithInterest || null,
        dueDates: req.body.dueDates || null
      }
      // console.log("Loan Data:", loanJson);
      const loanRef = db.collection('formData');
      const response = await loanRef.add(loanJson);

      res.send(response);
    }
    catch (error) {
      console.error("Error:", error);
      res.status(500).send("An error occurred while processing the form.");
    }
  });

  router.get('/bill', async (req, res) => {
    try {
      const customerId = req.query.id;
      console.log(customerId);

      const formDataRef = db.collection('formData').where('customerId', '==', customerId);
      const snapshot = await formDataRef.get();

      if (snapshot.empty) {
        console.error("Customer data not found for ID:", customerId);
        return res.status(404).send("Customer data not found");
      }

      const formData = [];
      snapshot.forEach(doc => {
        formData.push(doc.data());
      });
      console.log(formData);

      res.render('pages/bill', { customerId: customerId, formData: formData });
    } catch (error) {
      console.error('Error retrieving user data:', error);
      res.status(500).send('Error retrieving user data');
    }
  });

  router.get('/loanDetails', async (req, res) => {
    try {
      console.log("Session UserID on Loan Details ROUTE =>", req.session.userId);

      if (!req.session.userId) {
        console.error("Session user not found");
        return res.status(400).send("Session user not found");
      }

      const userId = req.session.userId;

      const userRef = db.collection('userData').doc(userId);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        console.error("User not found in database");
        return res.status(404).send("User not found in database");
      }

      const formDataRef = db.collection('formData').where('userId', '==', userId);
      const formDataSnapshot = await formDataRef.get();

      if (formDataSnapshot.empty) {
        console.error("No form data found for this user");
        return res.status(400).send("Form data not found for this user");
      }

      const tableData = [];

      formDataSnapshot.forEach(doc => {
        const formData = doc.data();
        const rowData = {
          customerId: formData.customerId,
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          loanAmount: formData.loanAmount,
          loanAmountWithInterest: formData.totalAmountWithInterest,
          paymentType: formData.paymentType,
          emiDuration: formData.emiDuration,
          dueDates: formData.dueDates
        };
        tableData.push(rowData);
      });

      console.log("Table Data:", tableData);

      res.render('pages/loanDetails', { tableData });
    } catch (error) {
      console.error("Error fetching loan details:", error);
      res.status(500).send(error.message);
    }
  });


  router.get('/payLoan', async (req, res) => {
    try {
      console.log('here is the session user id from payLoan Route', req.session.userId);
  
      if (!req.session.userId) {
        console.error("Session user not found");
        return res.status(400).send("Session user not found");
      }
  
      const userId = req.session.userId;
  
      const userRef = db.collection('userData').doc(userId);
      const userSnapshot = await userRef.get();
  
      if (!userSnapshot.exists) {
        console.error("User not found in database");
        return res.status(404).send("User not found in database");
      }
  
      const formDataRef = db.collection('formData').where('userId', '==', userId);
      const formDataSnapshot = await formDataRef.get();
  
      if (formDataSnapshot.empty) {
        console.error("No form data found for this user");
        return res.status(400).send("Form data not found for this user");
      }
  
      const tableData = [];
  
      formDataSnapshot.forEach(doc => {
        const formData = doc.data();
        const rowData = {
          customerId: formData.customerId,
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          loanAmount: formData.loanAmount,
          loanAmountWithInterest: formData.totalAmountWithInterest,
          paymentType: formData.paymentType,
          emiDuration: formData.emiDuration,
          dueDates: formData.dueDates
        };
        tableData.push(rowData);
      });
  
      console.log("Table Data:", tableData);
  
      res.render('pages/payLoan', { tableData });
    } catch (error) {
      console.error("Error fetching loan details:", error);
      res.status(500).send(error.message);
    }
  });
  router.post('/processPayment', async (req, res) => {
    try {
        const { customerId, paymentAmount } = req.body;
        console.log("Processing payment for customer ID:", customerId, "with amount:", paymentAmount);

        // Fetch the user and form data from the database
        const formDataRef = db.collection('formData').where('customerId', '==', customerId);
        const formDataSnapshot = await formDataRef.get();

        if (formDataSnapshot.empty) {
            return res.status(404).send("Form data not found for this customer");
        }

        // Assuming there's only one document per customerId
        const formDataDoc = formDataSnapshot.docs[0];
        const formData = formDataDoc.data();

        // Update the paid amount in the database
        const updatedAmountPaid = (formData.amountPaid || 0) + parseFloat(paymentAmount);
        await formDataDoc.ref.update({ amountPaid: updatedAmountPaid });

        res.send("Payment processed successfully");
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).send(error.message);
    }
});

  return router;
}