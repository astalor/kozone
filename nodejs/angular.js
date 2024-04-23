const express = require('express');
const path = require('path');

const app = express();

const p = "/var/www/kozone/angular/dist/angular";
// Serve static files from the dist directory
app.use(express.static(p));

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(p, 'index.html'));
});

// Start the server
const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
