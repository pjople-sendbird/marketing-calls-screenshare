const express = require('express');

const app = express();

app.use('/public', express.static(__dirname + '/'));

app.get('/agent', (req, res) => {
  res.sendFile(__dirname + '/agent.html');
});

app.get('/customer', (req, res) => {
  res.sendFile(__dirname + '/customer.html');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Example app is listening on port ' + port));

