const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// API endpoint
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// Serve React build folder
app.use(express.static(path.join(__dirname, 'build')));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
