
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const TOOLS_JSON = path.join(__dirname, 'public', 'addons', 'apps', 'tools.json');

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

// Get the current tools.json
app.get('/api/tools', (req, res) => {
  fs.readFile(TOOLS_JSON, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read tools.json' });
    res.json(JSON.parse(data));
  });
});

// Update tools.json
app.post('/api/tools', (req, res) => {
  const { tools } = req.body;
  if (!Array.isArray(tools)) return res.status(400).json({ error: 'Invalid tools array' });
  fs.writeFile(TOOLS_JSON, JSON.stringify({ tools }, null, 2), err => {
    if (err) return res.status(500).json({ error: 'Failed to write tools.json' });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
