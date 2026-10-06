require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// API
const requestFeatureAPI = require('./API/RequestfeatureAPI');
const updateFeatureAPi = require('./API/UpdatefeatureAPI');

const allowedOrigins = [
  'https://dailytool.space',
  'https://www.dailytool.space',
  'http://localhost:5173',
];

app.use(helmet());

app.use(cors({
  origin: allowedOrigins,
}));

app.use(express.json());

app.use("/api", requestFeatureAPI);
app.use("/api", updateFeatureAPi);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});