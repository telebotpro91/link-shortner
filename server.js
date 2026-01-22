const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const path = require('path');
const cors = require('cors');

// DNS fix for local testing and cloud connectivity
require('dns').setDefaultResultOrder('ipv4first');

const app = express();
app.use(express.json());
app.use(cors());

// Static files (public folder) serve karna
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE CONNECTION CONFIG ---
// Render ke Environment Variable ko prioritize karna
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://trunj_db_user:XKmpwC85EBT3kruP@cluster2.3hpa4dj.mongodb.net/linkDB?retryWrites=true&w=majority';

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000 // 5 seconds mein connect hone ki koshish karega
        });
        console.log('✅ MongoDB Cloud Connected Successfully!');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        // Agar connect nahi hua, toh 5 second baad firse try karega
        setTimeout(connectDB, 5000);
    }
};

connectDB();

// --- DATA MODEL ---
const urlSchema = new mongoose.Schema({
    longUrl: String,
    shortCode: String,
    clicks: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
});
const Url = mongoose.model('Url', urlSchema);

// --- ROUTES ---

// 1. Dashboard Statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalLinks = await Url.countDocuments();
        const links = await Url.find();
        const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
        const earnings = (totalClicks * 0.01).toFixed(2);
        res.json({ totalLinks, totalClicks, earnings });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Link Shorten Karna
app.post('/api/shorten', async (req, res) => {
    const { longUrl } = req.body;
    if (!longUrl) return res.status(400).json({ error: 'URL is required' });

    const shortCode = nanoid(6);
    const newUrl = new Url({ longUrl, shortCode });
    await newUrl.save();
    
    // Render ka base URL automatic detect karna
    const host = req.get('host');
    const protocol = req.protocol;
    res.json({ shortUrl: `${protocol}://${host}/go/${shortCode}` });
});

// 3. Multi-Step Redirection
app.get('/go/:code', async (req, res) => {
    try {
        const urlData = await Url.findOne({ shortCode: req.params.code });
        if (urlData) {
            urlData.clicks++;
            await urlData.save();
            const encodedUrl = Buffer.from(urlData.longUrl).toString('base64');
            res.redirect(`/step1.html?dest=${encodedUrl}`);
        } else {
            res.status(404).send('Link not found');
        }
    } catch (err) {
        res.status(500).send('Redirection error');
    }
});

// 4. Default Route for Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Port configuration (Render ke liye process.env.PORT zaroori hai)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
