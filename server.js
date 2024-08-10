const express = require('express');
const cors = require('cors');
const performanceAnalyzer = require('./performanceAnalyzer');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    const performanceData = await performanceAnalyzer(url);
    res.json(performanceData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});