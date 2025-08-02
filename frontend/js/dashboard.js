// Dashboard functionality
class Dashboard {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        this.setupEventListeners();
        this.setupAutoRefresh();
    }

    async loadDashboardData() {
        try {
            const data = await auth.apiRequest('/dashboard');
            
            if (data && data.success) {
                this.updateStats(data.stats);
                this.updateRecentActivity(data.recentActivity);
                await this.loadFlaggedAccounts();
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showNoDataMessage();
        }
    }

    updateStats(stats) {
        const elements = {
            totalProcessed: document.getElementById('totalProcessed'),
            totalFlagged: document.getElementById('totalFlagged'),
            flaggedPercentage: document.getElementById('flaggedPercentage'),
            cleanAccounts: document.getElementById('cleanAccounts')
        };

        if (elements.totalProcessed) {
            elements.totalProcessed.textContent = formatNumber(stats.totalProcessed || 0);
        }
        
        if (elements.totalFlagged) {
            elements.totalFlagged.textContent = formatNumber(stats.totalFlagged || 0);
        }
        
        if (elements.flaggedPercentage) {
            const percentage = stats.totalProcessed > 0 
                ? ((stats.totalFlagged / stats.totalProcessed) * 100).toFixed(1)
                : 0;
            elements.flaggedPercentage.textContent = `${percentage}%`;
        }
        
        if (elements.cleanAccounts) {
            const clean = (stats.totalProcessed || 0) - (stats.totalFlagged || 0);
            elements.cleanAccounts.textContent = formatNumber(clean);
        }
    }

    updateRecentActivity(recentActivity) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (!recentActivity || recentActivity.length === 0) {
            container.innerHTML = '<p class="no-data">No recent flagged accounts.</p>';
            return;
        }

        const activityHTML = recentActivity.map(account => `
            <div class="activity-item">
                <div class="activity-info">
                    <strong>@${account.username || account.accountData?.username}</strong>
                    <span class="risk-level ${account.riskLevel}">${account.riskLevel}</span>
                </div>
                <div class="activity-details">
                    <span>Score: ${account.suspicionScore}/10</span>
                    <span>${account.flags?.length || 0} issues detected</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = activityHTML;
    }

    async loadFlaggedAccounts() {
        try {
            // Get flagged accounts from the last analysis
            const response = await auth.apiRequest('/dashboard');
            
            if (response && response.success && response.recentActivity) {
                this.displayFlaggedAccounts(response.recentActivity);
            }
        } catch (error) {
            console.error('Failed to load flagged accounts:', error);
        }
    }

    displayFlaggedAccounts(accounts) {
        const tbody = document.getElementById('flaggedAccountsBody');
        if (!tbody) return;

        if (!accounts || accounts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No flagged accounts to display.</td></tr>';
            return;
        }

        const accountsHTML = accounts.map(account => {
            const accountData = account.accountData || {};
            const accountAge = this.calculateAccountAge(accountData.created_at);
            const primaryIssues = account.flags ? account.flags.slice(0, 2).join(', ') : 'No specific issues';
            
            return `
                <tr>
                    <td>
                        <strong>@${account.username || accountData.username}</strong>
                        <br>
                        <small>${accountData.full_name || 'No name provided'}</small>
                    </td>
                    <td>
                        <span class="risk-level ${account.riskLevel}">${account.riskLevel}</span>
                    </td>
                    <td>
                        <strong>${account.suspicionScore}/10</strong>
                    </td>
                    <td>
                        <div class="issues-preview">
                            ${primaryIssues}
                            ${account.flags && account.flags.length > 2 ? `<br><small>+${account.flags.length - 2} more</small>` : ''}
                        </div>
                    </td>
                    <td>${accountAge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="dashboard.showAccountDetails('${account.username || accountData.username}')">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = accountsHTML;
    }

    calculateAccountAge(createdAt) {
        if (!createdAt) return 'Unknown';
        
        const created = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) return `${diffDays} days`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
        return `${Math.floor(diffDays / 365)} years`;
    }

    async showAccountDetails(username) {
        try {
            const response = await auth.apiRequest('/check', {
                method: 'POST',
                body: JSON.stringify({ username })
            });

            if (response && response.success) {
                this.displayAccountModal(response.account, response.analysis);
            } else {
                showError('Could not load account details');
            }
        } catch (error) {
            console.error('Failed to load account details:', error);
            alert('Failed to load account details');
        }
    }

    displayAccountModal(account, analysis) {
        const modal = document.getElementById('accountModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        const modalHTML = `
            <div class="account-details">
                <div class="account-header">
                    <h4>@${account.username}</h4>
                    <span class="risk-level ${analysis.riskLevel}">${analysis.riskLevel} RISK</span>
                </div>
                
                <div class="score-display">
                    <div class="score-circle">
                        <span>${analysis.suspicionScore}</span>
                        <small>/10</small>
                    </div>
                    <p>Suspicion Score</p>
                </div>

                <div class="issues-section">
                    <h5>🚨 Detected Issues</h5>
                    ${analysis.flags && analysis.flags.length > 0 
                        ? analysis.flags.map(flag => `<div class="issue-item">${flag}</div>`).join('')
                        : '<p>No specific issues detected</p>'
                    }
                </div>

                <div class="account-info">
                    <h5>📋 Account Information</h5>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Full Name:</label>
                            <span>${account.full_name || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${account.email || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Followers:</label>
                            <span>${formatNumber(account.followers || 0)}</span>
                        </div>
                        <div class="info-item">
                            <label>Following:</label>
                            <span>${formatNumber(account.following || 0)}</span>
                        </div>
                        <div class="info-item">
                            <label>Posts:</label>
                            <span>${formatNumber(account.posts || 0)}</span>
                        </div>
                        <div class="info-item">
                            <label>Created:</label>
                            <span>${formatDate(account.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modalBody.innerHTML = modalHTML;
        modal.style.display = 'block';
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
                showSuccess('Dashboard data refreshed');
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportFlaggedAccounts();
            });
        }

        // Analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeData();
            });
        }

        // Search and filter
        const searchFilter = document.getElementById('searchFilter');
        const riskFilter = document.getElementById('riskFilter');
        
        if (searchFilter) {
            searchFilter.addEventListener('input', () => this.filterTable());
        }
        
        if (riskFilter) {
            riskFilter.addEventListener('change', () => this.filterTable());
        }

        // Modal close
        const modal = document.getElementById('accountModal');
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        if (modal) {
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    async exportFlaggedAccounts() {
        try {
            const response = await auth.apiRequest('/export');
            
            if (response instanceof Response) {
                const csvContent = await response.text();
                const filename = `flagged_accounts_${new Date().toISOString().split('T')[0]}.csv`;
                downloadCSV(csvContent, filename);
                showSuccess('Flagged accounts exported successfully');
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    }

    async analyzeData() {
        try {
            const analyzeBtn = document.getElementById('analyzeBtn');
            const originalText = analyzeBtn.textContent;
            
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
            
            const response = await auth.apiRequest('/analyze', {
                method: 'POST'
            });

            if (response && response.success) {
                showSuccess(`Analysis complete: ${response.summary.totalFlagged} accounts flagged out of ${response.summary.totalProcessed}`);
                await this.loadDashboardData();
            } else {
                throw new Error(response?.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            alert(error.message || 'Analysis failed. Please upload data first.');
        } finally {
            const analyzeBtn = document.getElementById('analyzeBtn');
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🔍 Re-analyze Data';
        }
    }

    filterTable() {
        const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase() || '';
        const riskFilter = document.getElementById('riskFilter')?.value || '';
        const tbody = document.getElementById('flaggedAccountsBody');
        
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return; // Skip header or no-data rows
            
            const username = cells[0].textContent.toLowerCase();
            const riskLevel = cells[1].textContent.trim();
            
            const matchesSearch = username.includes(searchTerm);
            const matchesRisk = !riskFilter || riskLevel.includes(riskFilter);
            
            row.style.display = matchesSearch && matchesRisk ? '' : 'none';
        });
    }

    setupAutoRefresh() {
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    showNoDataMessage() {
        const containers = ['recentActivity', 'flaggedAccountsBody'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                if (containerId === 'flaggedAccountsBody') {
                    container.innerHTML = '<tr><td colspan="6" class="no-data">No data available. Please upload and analyze account data.</td></tr>';
                } else {
                    container.innerHTML = '<p class="no-data">No data available. Please upload and analyze account data.</p>';
                }
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new Dashboard();
});

// Add some CSS for the activity items
const style = document.createElement('style');
style.textContent = `
    .activity-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid #e2e8f0;
        transition: background-color 0.2s;
    }
    
    .activity-item:hover {
        background-color: #f7fafc;
    }
    
    .activity-item:last-child {
        border-bottom: none;
    }
    
    .activity-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .activity-details {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 0.85rem;
        color: #718096;
    }
    
    .issues-preview {
        font-size: 0.85rem;
        color: #4a5568;
        max-width: 200px;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .info-item label {
        font-weight: 500;
        color: #4a5568;
    }
    
    @media (max-width: 768px) {
        .activity-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .activity-details {
            align-items: flex-start;
        }
    }
`;
document.head.appendChild(style);
