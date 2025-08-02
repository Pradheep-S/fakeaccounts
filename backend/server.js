const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { analyzeAccounts, analyzeSingleAccount } = require('./detection-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// In-memory storage for demo purposes
let accountsData = [];
let flaggedAccounts = [];
let dashboardStats = {
    totalProcessed: 0,
    totalFlagged: 0,
    recentFlags: []
};

// Routes
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        
        if (fileExtension === '.csv') {
            parseCSVFile(filePath, res);
        } else if (fileExtension === '.json') {
            parseJSONFile(filePath, res);
        } else {
            return res.status(400).json({ error: 'Unsupported file format. Please upload CSV or JSON.' });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

app.post('/api/analyze', (req, res) => {
    try {
        if (accountsData.length === 0) {
            return res.status(400).json({ error: 'No data to analyze. Please upload data first.' });
        }

        const results = analyzeAccounts(accountsData);
        
        // Update dashboard stats
        dashboardStats.totalProcessed = accountsData.length;
        dashboardStats.totalFlagged = results.flagged.length;
        dashboardStats.recentFlags = results.flagged.slice(-10); // Last 10 flagged

        flaggedAccounts = results.flagged;

        res.json({
            success: true,
            summary: {
                totalProcessed: results.total,
                totalFlagged: results.flagged.length,
                flaggedPercentage: ((results.flagged.length / results.total) * 100).toFixed(2)
            },
            flaggedAccounts: results.flagged
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

app.post('/api/check', (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const account = accountsData.find(acc => 
            acc.username && acc.username.toLowerCase() === username.toLowerCase()
        );

        if (!account) {
            return res.status(404).json({ error: 'Account not found in uploaded data' });
        }

        const analysis = analyzeSingleAccount(account);
        
        res.json({
            success: true,
            account: account,
            analysis: analysis
        });
    } catch (error) {
        console.error('Check error:', error);
        res.status(500).json({ error: 'Account check failed' });
    }
});

app.get('/api/dashboard', (req, res) => {
    try {
        res.json({
            success: true,
            stats: dashboardStats,
            recentActivity: flaggedAccounts.slice(-5) // Last 5 flagged accounts
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Dashboard data fetch failed' });
    }
});

app.get('/api/export', (req, res) => {
    try {
        if (flaggedAccounts.length === 0) {
            return res.status(400).json({ error: 'No flagged accounts to export' });
        }

        const csvHeader = 'Username,Email,Followers,Following,Posts,Account Age (days),Suspicion Score,Risk Level,Flags\n';
        const csvData = flaggedAccounts.map(acc => {
            const flags = acc.flags ? acc.flags.join(';') : '';
            return `"${acc.username}","${acc.email || ''}","${acc.followers || 0}","${acc.following || 0}","${acc.posts || 0}","${acc.accountAge || 0}","${acc.suspicionScore}","${acc.riskLevel}","${flags}"`;
        }).join('\n');

        const csvContent = csvHeader + csvData;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="flagged_accounts.csv"');
        res.send(csvContent);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Helper functions (will be implemented in next step)
function parseCSVFile(filePath, res) {
    const results = [];
    
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            accountsData = results;
            fs.unlinkSync(filePath); // Clean up uploaded file
            res.json({ 
                success: true, 
                message: `Successfully uploaded ${results.length} accounts`,
                count: results.length
            });
        })
        .on('error', (error) => {
            console.error('CSV parsing error:', error);
            res.status(500).json({ error: 'Failed to parse CSV file' });
        });
}

function parseJSONFile(filePath, res) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        
        accountsData = Array.isArray(jsonData) ? jsonData : [jsonData];
        fs.unlinkSync(filePath); // Clean up uploaded file
        
        res.json({ 
            success: true, 
            message: `Successfully uploaded ${accountsData.length} accounts`,
            count: accountsData.length
        });
    } catch (error) {
        console.error('JSON parsing error:', error);
        res.status(500).json({ error: 'Failed to parse JSON file' });
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;
