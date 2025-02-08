

app.get('/loanDetails', async (req, res) => {
  try {
    const loanDoc = await db.collection('loanData').doc('qq1oRNOPUZ5XIihYdYjc').get();
    if (!loanDoc.exists) {
      throw new Error('Loan document not found');
    }
    const loanAmount = loanDoc.data().loanAmount;

    res.render('pages/loanDetails', { loanAmount: loanAmount });
  } catch(error) {
    // Handle error
    console.error('Error fetching loan amount:', error);
    res.status(500).send('An error occurred while fetching loan amount');
  }
});

app.post('/submitPayment', async (req, res) => {
  try {
      const paymentAmount = parseFloat(req.body.paymentAmount); 
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
          throw new Error('Invalid payment amount');
      }

      const loanRef = db.collection('loanData').doc('qq1oRNOPUZ5XIihYdYjc');
      await loanRef.update({ amount: admin.firestore.FieldValue.increment(-paymentAmount) });

      res.send('Payment successful!');
  } catch(error) {
      console.error('Error processing payment:', error);
      res.status(500).send('An error occurred while processing payment');
  }
});

 