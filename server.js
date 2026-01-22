const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const path = require('path');
const cors = require('cors');

// Ye line Windows/Nagpur network par ECONNREFUSED error ko fix karti hai
require('dns').setDefaultResultOrder('ipv4first');

const app = express();
app.use(express.json());
app.use(cors());

// Static files load karne ke liye path fix
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE CONNECTION ---
// server.js ke andar connection line change karein
const mongoURI = 'mongodb://mybotuser:OUyx645TaQVQlQiM@trunj-shard-00-00.cy6jth5.mongodb.net:27017,trunj-shard-00-01.cy6jth5.mongodb.net:27017,trunj-shard-00-02.cy6jth5.mongodb.net:27017/linkDB?ssl=true&replicaSet=atlas-trunj-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB Cloud Connected Successfully!'))
    .catch(err => console.log('❌ Connection Error:', err));

// --- DATA MODEL ---
const Url = mongoose.model('Url', new mongoose.Schema({
    longUrl: String,
    shortCode: String,
    clicks: { type: Number, default: 0 }
}));

// --- ROUTES ---

// Dashboard stats fetch karne ke liye
app.get('/api/stats', async (req, res) => {
    try {
        const totalLinks = await Url.countDocuments();
        const links = await Url.find();
        const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
        res.json({ totalLinks, totalClicks, earnings: (totalClicks * 0.01).toFixed(2) });
    } catch (err) { res.status(500).send(err); }
});

// Link short karne ke liye
app.post('/api/shorten', async (req, res) => {
    const { longUrl } = req.body;
    if (!longUrl) return res.status(400).send('URL missing');
    const shortCode = nanoid(6);
    const newUrl = new Url({ longUrl, shortCode });
    await newUrl.save();
    res.json({ shortUrl: `http://localhost:3000/go/${shortCode}` });
});

// Redirection flow
app.get('/go/:code', async (req, res) => {
    const urlData = await Url.findOne({ shortCode: req.params.code });
    if (urlData) {
        urlData.clicks++;
        await urlData.save();
        const encoded = Buffer.from(urlData.longUrl).toString('base64');
        res.redirect(`/step1.html?dest=${encoded}`);
    } else { res.status(404).send('Link not found'); }
});

// Default Dashboard load karne ke liye
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server LIVE: http://localhost:3000`));