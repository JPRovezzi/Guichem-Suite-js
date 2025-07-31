
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;


app.use(cors());
app.use(bodyParser.json());

// Endpoint to list all tool folders containing tool.json
app.get('/api/available-tools', (req, res) => {
  const appsDir = path.join(__dirname, 'public', 'addons', 'apps');
  fs.readdir(appsDir, { withFileTypes: true }, (err, entries) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read apps directory.' });
    }
    const folders = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(folder => {
        const toolJson = path.join(appsDir, folder, 'tool.json');
        return fs.existsSync(toolJson);
      });
    res.json({ folders });
  });
});



app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
