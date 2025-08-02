# Fake Social Media Account Detection Dashboard

A full-stack application for detecting fake social media accounts using heuristic-based analysis with hooks for future ML model integration.

## 🚀 Features

### Current Implementation (MVP)
- **Bulk Data Upload**: Support for CSV and JSON file uploads
- **Heuristic Detection Engine**: Rule-based fake account detection
- **Real-time Dashboard**: Statistics and flagged account overview
- **Individual Account Check**: Analyze specific accounts
- **Export Functionality**: Download flagged accounts as CSV

### Detection Criteria
- ⚡ **Burst Posting**: Extremely high posting frequency detection
- 📝 **Profile Completeness**: Missing bio, picture, low follower count
- 🕒 **Account Age**: Newly created accounts flagging
- 🏷️ **Username Patterns**: Suspicious naming conventions
- 🖼️ **Duplicate Profiles**: Reused profile pictures via hashing
- ✉️ **Suspicious Metadata**: Unverified emails, disposable domains
- 🌍 **Activity Anomalies**: 24/7 posting, geographic inconsistencies
- 📋 **Content Similarity**: Duplicate posts detection

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express
- **Data Storage**: JSON files / In-memory storage
- **File Processing**: CSV parsing with csv-parser

## 📁 Project Structure

```
fakeaccounts/
├── README.md
├── backend/
│   ├── package.json
│   ├── server.js                    # Main Express server
│   ├── detection-engine.js          # Heuristic analysis engine
│   └── uploads/                     # Temporary file storage
└── frontend/
    ├── index.html                   # Main landing page
    ├── dashboard.html               # Main dashboard
    ├── upload.html                  # Data upload interface
    ├── account-check.html           # Individual account analysis
    ├── css/
    │   └── style.css               # Complete styling
    └── js/
        ├── auth.js                 # API utilities
        ├── dashboard.js            # Dashboard functionality
        ├── upload.js               # File upload handling
        └── account-check.js        # Individual account analysis
```

## 🚦 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd fakeaccounts
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Start the backend server**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

4. **Open the frontend**
   - Navigate to `frontend/index.html` in your browser
   - Or serve the frontend using any HTTP server:
```bash
# Using Python
python -m http.server 8080

# Using Node.js http-server
npx http-server frontend -p 8080
```

## 📊 Usage Guide

### 1. Upload Data
- Navigate to "Upload Data" page
- Drag & drop or select CSV/JSON files
- Auto-analysis option available

### 2. View Dashboard
- Overview statistics of processed accounts
- Recent flagged accounts list
- Filter and search functionality
- Export flagged results

### 3. Check Individual Accounts
- Search for specific usernames
- Detailed analysis breakdown
- Risk scoring (0-10 scale)
- Export individual results

## 📋 Data Format Requirements

### CSV Format
Required columns:
- `username` - Account username/handle
- `created_at` - Account creation date (YYYY-MM-DD)

Optional columns (improve detection accuracy):
- `email`, `full_name`, `bio`, `followers`, `following`, `posts`
- `profile_picture`, `email_verified`, `phone_verified`
- `website`, `location`, `posting_hours`, `recent_posts`

### JSON Format
Array of account objects with same field structure as CSV.

## 🔍 Detection Algorithm Details

### Scoring System
- **0-2**: Low risk (likely legitimate)
- **3-4**: Medium risk (some suspicious indicators)
- **5+**: High risk (multiple red flags)

### Heuristic Rules
1. **Burst Posting**: >50 posts/day
2. **Profile Completeness**: <40% complete
3. **Account Age**: <30 days old
4. **Username Patterns**: user123456, bot999, etc.
5. **Disposable Emails**: Known temporary email domains
6. **Activity Patterns**: 24/7 posting, impossible geo-jumps
7. **Content Duplication**: >50% similar posts

## 🤖 Future ML Integration

The current system is designed with ML integration in mind:

### Integration Points
- `detection-engine.js` - Replace heuristic functions with ML predictions
- `analyzeAccounts()` - Batch processing endpoint
- `analyzeSingleAccount()` - Individual analysis endpoint

### Planned Enhancements
- **Feature Engineering**: Convert heuristics to ML features
- **Model Training**: Use labeled datasets for supervised learning
- **Real-time Scoring**: API integration with trained models
- **Continuous Learning**: Feedback loop for model improvement

### TODO Comments
Look for `# TODO: Replace with ML model integration` throughout the codebase.

## 🔧 API Endpoints

### Data Management
- `POST /api/upload` - File upload (CSV/JSON)
- `POST /api/analyze` - Analyze uploaded data
- `POST /api/check` - Check individual account

### Dashboard & Export
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/export` - Export flagged accounts (CSV)

## 🛡️ Security Considerations

### Current Implementation
- File upload validation
- Input sanitization
- CORS configuration

### Production Recommendations
- Use environment variables for secrets
- Implement rate limiting
- Database integration
- HTTPS enforcement
- File upload restrictions

## 🎯 Customization

### Adjusting Detection Sensitivity
Edit `detection-engine.js`:
```javascript
// Modify thresholds in individual check functions
function checkBurstPosting(account) {
    const POSTS_PER_DAY_THRESHOLD = 50; // Adjust this value
    // ...
}
```

### Adding New Detection Rules
1. Create new check function in `detection-engine.js`
2. Add to `analyzeSingleAccount()` function
3. Update scoring logic

## 📈 Performance Notes

- **In-memory Storage**: Suitable for demos, limited by RAM
- **File Processing**: 10MB upload limit (configurable)
- **Concurrent Users**: Single-user focused (extend for multi-user)

## 🧪 Testing

### Test Scenarios
1. Upload real account data
2. Run analysis
3. Check detection accuracy
4. Test individual account lookup
5. Export functionality

## 🚀 Deployment

### Local Development
```bash
cd backend && npm run dev
```

### Production Deployment
1. Set environment variables
2. Use process manager (PM2)
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Database integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or support:
- Create an issue in the repository
- Review the code comments for implementation details
- Check the TODO comments for ML integration points

---

**Note**: This is an MVP implementation focused on demonstrating heuristic-based fake account detection. The modular architecture allows for easy ML model integration and scaling to production environments.