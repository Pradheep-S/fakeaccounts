// Account check functionality
class AccountCheck {
    constructor() {
        this.currentAccount = null;
        this.currentAnalysis = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const checkForm = document.getElementById('checkForm');
        const checkAnotherBtn = document.getElementById('checkAnother');
        const exportSingleBtn = document.getElementById('exportSingleResult');

        // Form submission
        if (checkForm) {
            checkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.checkAccount();
            });
        }

        // Check another account
        if (checkAnotherBtn) {
            checkAnotherBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }

        // Export single result
        if (exportSingleBtn) {
            exportSingleBtn.addEventListener('click', () => {
                this.exportSingleResult();
            });
        }

        // Enter key in search input
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.checkAccount();
                }
            });
        }
    }

    async checkAccount() {
        const usernameInput = document.getElementById('usernameInput');
        const username = usernameInput?.value.trim();

        if (!username) {
            alert('Please enter a username to check.');
            return;
        }

        const submitBtn = document.querySelector('#checkForm button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
            this.hideResults();

            const response = await auth.apiRequest('/check', {
                method: 'POST',
                body: JSON.stringify({ username })
            });

            if (response && response.success) {
                this.currentAccount = response.account;
                this.currentAnalysis = response.analysis;
                this.displayResults(response.account, response.analysis);
            } else {
                this.showError(response?.error || 'Account not found in uploaded data');
            }
        } catch (error) {
            console.error('Account check error:', error);
            this.showError('Failed to check account. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    displayResults(account, analysis) {
        // Update account header
        this.updateAccountHeader(account, analysis);
        
        // Update score display
        this.updateScoreDisplay(analysis);
        
        // Update detected issues
        this.updateDetectedIssues(analysis);
        
        // Update detailed analysis
        this.updateDetailedAnalysis(analysis);
        
        // Update account data
        this.updateAccountData(account);
        
        // Show analysis card
        const analysisCard = document.getElementById('analysisCard');
        if (analysisCard) {
            analysisCard.style.display = 'block';
            analysisCard.scrollIntoView({ behavior: 'smooth' });
        }
    }

    updateAccountHeader(account, analysis) {
        const accountUsername = document.getElementById('accountUsername');
        const accountFullName = document.getElementById('accountFullName');
        const riskLevel = document.getElementById('riskLevel');

        if (accountUsername) {
            accountUsername.textContent = `@${account.username}`;
        }

        if (accountFullName) {
            accountFullName.textContent = account.full_name || 'No name provided';
        }

        if (riskLevel) {
            riskLevel.textContent = `${analysis.riskLevel} RISK`;
            riskLevel.className = `risk-level ${analysis.riskLevel}`;
        }
    }

    updateScoreDisplay(analysis) {
        const suspicionScore = document.getElementById('suspicionScore');
        
        if (suspicionScore) {
            suspicionScore.textContent = analysis.suspicionScore;
            
            // Update circle color based on score
            const scoreCircle = suspicionScore.closest('.score-circle');
            if (scoreCircle) {
                scoreCircle.className = 'score-circle';
                if (analysis.suspicionScore >= 5) {
                    scoreCircle.classList.add('high-risk');
                } else if (analysis.suspicionScore >= 3) {
                    scoreCircle.classList.add('medium-risk');
                } else {
                    scoreCircle.classList.add('low-risk');
                }
            }
        }
    }

    updateDetectedIssues(analysis) {
        const detectedIssues = document.getElementById('detectedIssues');
        
        if (!detectedIssues) return;

        if (!analysis.flags || analysis.flags.length === 0) {
            detectedIssues.innerHTML = `
                <div class="no-issues">
                    <div class="no-issues-icon">✅</div>
                    <p>No significant issues detected. This account appears to be legitimate.</p>
                </div>
            `;
            return;
        }

        const issuesHTML = analysis.flags.map(flag => `
            <div class="issue-item">
                <span class="issue-icon">⚠️</span>
                <span class="issue-text">${flag}</span>
            </div>
        `).join('');

        detectedIssues.innerHTML = issuesHTML;
    }

    updateDetailedAnalysis(analysis) {
        // Profile Analysis
        const profileAnalysis = document.getElementById('profileAnalysis');
        if (profileAnalysis && analysis.details) {
            const profile = analysis.details.profileCompleteness;
            profileAnalysis.innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Completeness Score:</span>
                    <span class="detail-value">${profile?.score || 0}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Missing Fields:</span>
                    <span class="detail-value">${profile?.missingFields?.join(', ') || 'None'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Profile Status:</span>
                    <span class="detail-value ${profile?.isSuspicious ? 'suspicious' : 'normal'}">
                        ${profile?.isSuspicious ? 'Incomplete' : 'Complete'}
                    </span>
                </div>
            `;
        }

        // Activity Analysis
        const activityAnalysis = document.getElementById('activityAnalysis');
        if (activityAnalysis && analysis.details) {
            const burst = analysis.details.burstPosting;
            const activity = analysis.details.activity;
            
            activityAnalysis.innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Posts per Day:</span>
                    <span class="detail-value ${burst?.isSuspicious ? 'suspicious' : 'normal'}">
                        ${burst?.postsPerDay || 0}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Total Posts:</span>
                    <span class="detail-value">${burst?.totalPosts || 0}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Activity Pattern:</span>
                    <span class="detail-value ${activity?.isSuspicious ? 'suspicious' : 'normal'}">
                        ${activity?.isSuspicious ? activity.issue : 'Normal'}
                    </span>
                </div>
            `;
        }

        // Metadata Analysis
        const metadataAnalysis = document.getElementById('metadataAnalysis');
        if (metadataAnalysis && analysis.details) {
            const metadata = analysis.details.metadata;
            const username = analysis.details.usernamePattern;
            
            metadataAnalysis.innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Username Pattern:</span>
                    <span class="detail-value ${username?.isSuspicious ? 'suspicious' : 'normal'}">
                        ${username?.isSuspicious ? 'Suspicious' : 'Normal'}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Verification Issues:</span>
                    <span class="detail-value">${metadata?.issues?.length || 0}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Metadata Score:</span>
                    <span class="detail-value ${metadata?.isSuspicious ? 'suspicious' : 'normal'}">
                        ${metadata?.score || 0}/5
                    </span>
                </div>
            `;
        }

        // Content Analysis
        const contentAnalysis = document.getElementById('contentAnalysis');
        if (contentAnalysis && analysis.details) {
            const content = analysis.details.content;
            const duplicate = analysis.details.duplicateProfile;
            
            contentAnalysis.innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Content Similarity:</span>
                    <span class="detail-value ${content?.isSuspicious ? 'suspicious' : 'normal'}">
                        ${content?.similarity || 0}%
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duplicate Profile:</span>
                    <span class="detail-value ${duplicate?.isDuplicate ? 'suspicious' : 'normal'}">
                        ${duplicate?.isDuplicate ? 'Yes' : 'No'}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Content Status:</span>
                    <span class="detail-value ${content?.isSuspicious ? 'suspicious' : 'normal'}">
                        ${content?.isSuspicious ? 'Suspicious' : 'Normal'}
                    </span>
                </div>
            `;
        }
    }

    updateAccountData(account) {
        const fields = {
            accountEmail: account.email || 'Not provided',
            accountFollowers: formatNumber(account.followers || 0),
            accountFollowing: formatNumber(account.following || 0),
            accountPosts: formatNumber(account.posts || 0),
            accountAge: calculateDaysAgo(account.created_at),
            emailVerified: this.formatBoolean(account.email_verified),
            phoneVerified: this.formatBoolean(account.phone_verified),
            accountLocation: account.location || 'Not provided'
        };

        Object.entries(fields).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                
                // Add status classes for verification fields
                if (elementId.includes('Verified')) {
                    element.className = account[elementId.replace('account', '').toLowerCase()] 
                        ? 'verified' : 'not-verified';
                }
            }
        });
    }

    formatBoolean(value) {
        if (value === true || value === 'true') return '✅ Verified';
        if (value === false || value === 'false') return '❌ Not Verified';
        return '❓ Unknown';
    }

    showError(message) {
        const searchResult = document.getElementById('searchResult');
        
        if (searchResult) {
            searchResult.innerHTML = `
                <div class="error-message">
                    <h4>❌ Account Not Found</h4>
                    <p>${message}</p>
                    <div class="error-suggestions">
                        <h5>Suggestions:</h5>
                        <ul>
                            <li>Make sure the username is correct</li>
                            <li>Verify the account exists in your uploaded data</li>
                            <li>Try uploading fresh account data</li>
                        </ul>
                    </div>
                </div>
            `;
            searchResult.style.display = 'block';
        }
        
        this.hideResults();
    }

    hideResults() {
        const analysisCard = document.getElementById('analysisCard');
        if (analysisCard) {
            analysisCard.style.display = 'none';
        }
    }

    resetForm() {
        const usernameInput = document.getElementById('usernameInput');
        const searchResult = document.getElementById('searchResult');
        
        if (usernameInput) {
            usernameInput.value = '';
            usernameInput.focus();
        }
        
        if (searchResult) {
            searchResult.style.display = 'none';
        }
        
        this.hideResults();
        this.currentAccount = null;
        this.currentAnalysis = null;
    }

    exportSingleResult() {
        if (!this.currentAccount || !this.currentAnalysis) {
            alert('No analysis data to export');
            return;
        }

        const csvHeader = 'Username,Full_Name,Email,Risk_Level,Suspicion_Score,Issues,Followers,Following,Posts,Account_Age,Email_Verified,Phone_Verified\n';
        const issues = this.currentAnalysis.flags ? this.currentAnalysis.flags.join('; ') : '';
        const accountAge = calculateDaysAgo(this.currentAccount.created_at);
        
        const csvRow = [
            `"${this.currentAccount.username}"`,
            `"${this.currentAccount.full_name || ''}"`,
            `"${this.currentAccount.email || ''}"`,
            `"${this.currentAnalysis.riskLevel}"`,
            `"${this.currentAnalysis.suspicionScore}"`,
            `"${issues}"`,
            `"${this.currentAccount.followers || 0}"`,
            `"${this.currentAccount.following || 0}"`,
            `"${this.currentAccount.posts || 0}"`,
            `"${accountAge}"`,
            `"${this.formatBoolean(this.currentAccount.email_verified)}"`,
            `"${this.formatBoolean(this.currentAccount.phone_verified)}"`
        ].join(',');

        const csvContent = csvHeader + csvRow;
        const filename = `account_analysis_${this.currentAccount.username}_${new Date().toISOString().split('T')[0]}.csv`;
        
        downloadCSV(csvContent, filename);
        showSuccess('Account analysis exported successfully!');
    }
}

// Initialize account check functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.accountCheck = new AccountCheck();
});

// Add some CSS for the account check page
const style = document.createElement('style');
style.textContent = `
    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .detail-item:last-child {
        border-bottom: none;
    }
    
    .detail-label {
        font-weight: 500;
        color: #4a5568;
    }
    
    .detail-value {
        font-weight: 500;
        color: #2d3748;
    }
    
    .detail-value.suspicious {
        color: #e53e3e;
    }
    
    .detail-value.normal {
        color: #38a169;
    }
    
    .verified {
        color: #38a169;
    }
    
    .not-verified {
        color: #e53e3e;
    }
    
    .score-circle.high-risk {
        background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
    }
    
    .score-circle.medium-risk {
        background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
    }
    
    .score-circle.low-risk {
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    }
    
    .no-issues {
        text-align: center;
        padding: 2rem;
        background: #f0fff4;
        border-radius: 8px;
        border: 1px solid #c6f6d5;
    }
    
    .no-issues-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .no-issues p {
        color: #38a169;
        font-weight: 500;
    }
    
    .issue-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: #fed7d7;
        border: 1px solid #feb2b2;
        border-radius: 6px;
        margin-bottom: 0.5rem;
    }
    
    .issue-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
    }
    
    .issue-text {
        color: #c53030;
        font-weight: 500;
    }
    
    .error-suggestions {
        margin-top: 1rem;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 6px;
    }
    
    .error-suggestions h5 {
        color: #2d3748;
        margin-bottom: 0.5rem;
    }
    
    .error-suggestions ul {
        margin: 0;
        padding-left: 1.5rem;
        color: #4a5568;
    }
    
    .error-suggestions li {
        margin-bottom: 0.25rem;
    }
    
    .action-section {
        display: flex;
        gap: 1rem;
        justify-content: center;
        padding-top: 1.5rem;
        border-top: 1px solid #e2e8f0;
        margin-top: 2rem;
        flex-wrap: wrap;
    }
    
    @media (max-width: 768px) {
        .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
        }
        
        .action-section {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(style);
