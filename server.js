// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve everything in the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
