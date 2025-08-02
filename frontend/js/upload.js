// Upload functionality
class Upload {
    constructor() {
        this.selectedFile = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormatTabs();
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadForm = document.getElementById('uploadForm');
        const removeFileBtn = document.getElementById('removeFile');

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files[0]);
            });
        }

        // Upload area click
        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                fileInput?.click();
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0]);
                }
            });
        }

        // Form submission
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadFile();
            });
        }

        // Remove file
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                this.clearFile();
            });
        }
    }

    setupFormatTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const formatContents = document.querySelectorAll('.format-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                // Remove active class from all tabs and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                formatContents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                btn.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}Format`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['.csv', '.json'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            alert('Please select a CSV or JSON file.');
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('File size exceeds 10MB limit.');
            return;
        }

        this.selectedFile = file;
        this.displayFileInfo(file);
        this.enableUploadButton();
    }

    displayFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const uploadArea = document.getElementById('uploadArea');

        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
        
        if (fileInfo) fileInfo.style.display = 'flex';
        if (uploadArea) uploadArea.style.display = 'none';
    }

    clearFile() {
        this.selectedFile = null;
        
        const fileInfo = document.getElementById('fileInfo');
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        if (fileInfo) fileInfo.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'block';
        if (fileInput) fileInput.value = '';
        if (uploadBtn) uploadBtn.disabled = true;

        this.hideProgress();
        this.hideResult();
    }

    enableUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = false;
        }
    }

    async uploadFile() {
        if (!this.selectedFile) {
            alert('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', this.selectedFile);

        const uploadBtn = document.getElementById('uploadBtn');
        const originalText = uploadBtn.textContent;

        try {
            // Show progress
            this.showProgress();
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="spinner"></span> Uploading...';

            // Simulate progress for user feedback
            this.simulateProgress();

            const response = await auth.apiRequest('/upload', {
                method: 'POST',
                body: formData
            });

            if (response && response.success) {
                this.showResult(true, response.message, response.count);
                
                // Auto-analyze if enabled
                const autoAnalyze = document.getElementById('autoAnalyze');
                if (autoAnalyze && autoAnalyze.checked) {
                    setTimeout(() => {
                        this.analyzeData(response.count);
                    }, 1000);
                }
            } else {
                throw new Error(response?.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showResult(false, error.message || 'Upload failed. Please try again.');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = originalText;
            this.hideProgress();
        }
    }

    async analyzeData(accountCount) {
        try {
            const uploadResult = document.getElementById('uploadResult');
            
            if (uploadResult) {
                uploadResult.innerHTML += '<div class="analysis-status"><span class="spinner"></span> Analyzing uploaded data...</div>';
            }

            const response = await auth.apiRequest('/analyze', {
                method: 'POST'
            });

            if (response && response.success) {
                const analysisHtml = `
                    <div class="analysis-results">
                        <h4>✅ Analysis Complete!</h4>
                        <div class="analysis-stats">
                            <div class="stat-item">
                                <span class="stat-number">${response.summary.totalProcessed}</span>
                                <span class="stat-label">Total Processed</span>
                            </div>
                            <div class="stat-item danger">
                                <span class="stat-number">${response.summary.totalFlagged}</span>
                                <span class="stat-label">Flagged as Suspicious</span>
                            </div>
                            <div class="stat-item warning">
                                <span class="stat-number">${response.summary.flaggedPercentage}%</span>
                                <span class="stat-label">Suspicion Rate</span>
                            </div>
                        </div>
                        <div class="analysis-actions">
                            <button onclick="window.location.href='dashboard.html'" class="btn btn-primary">
                                📊 View Dashboard
                            </button>
                            <button onclick="upload.exportResults()" class="btn btn-success">
                                📥 Export Results
                            </button>
                        </div>
                    </div>
                `;
                
                if (uploadResult) {
                    uploadResult.querySelector('.analysis-status')?.remove();
                    uploadResult.innerHTML += analysisHtml;
                }
                
                showSuccess('Analysis completed successfully!');
            } else {
                throw new Error(response?.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            const uploadResult = document.getElementById('uploadResult');
            if (uploadResult) {
                uploadResult.querySelector('.analysis-status')?.remove();
                uploadResult.innerHTML += `<div class="error-message">Analysis failed: ${error.message}</div>`;
            }
        }
    }

    showProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
    }

    hideProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    simulateProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (!progressBar || !progressText) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                progressText.textContent = 'Processing...';
            } else {
                progressText.textContent = `Uploading... ${Math.round(progress)}%`;
            }
            progressBar.style.width = `${progress}%`;
        }, 200);
    }

    showResult(success, message, accountCount = null) {
        const resultContainer = document.getElementById('uploadResult');
        if (!resultContainer) return;

        const resultClass = success ? 'success-message' : 'error-message';
        const icon = success ? '✅' : '❌';
        
        let resultHtml = `
            <div class="${resultClass}">
                <h4>${icon} ${success ? 'Upload Successful!' : 'Upload Failed'}</h4>
                <p>${message}</p>
        `;

        if (success && accountCount) {
            resultHtml += `
                <div class="upload-stats">
                    <div class="upload-stat">
                        <span class="stat-number">${accountCount}</span>
                        <span class="stat-label">Accounts Uploaded</span>
                    </div>
                </div>
            `;
        }

        resultHtml += '</div>';
        
        resultContainer.innerHTML = resultHtml;
        resultContainer.style.display = 'block';
    }

    hideResult() {
        const resultContainer = document.getElementById('uploadResult');
        if (resultContainer) {
            resultContainer.style.display = 'none';
        }
    }

    async exportResults() {
        try {
            const response = await auth.apiRequest('/export');
            
            if (response instanceof Response) {
                const csvContent = await response.text();
                const filename = `analysis_results_${new Date().toISOString().split('T')[0]}.csv`;
                downloadCSV(csvContent, filename);
                showSuccess('Results exported successfully!');
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize upload functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.upload = new Upload();
});

// Add some CSS for the upload results and analysis
const style = document.createElement('style');
style.textContent = `
    .analysis-results {
        background: #f0fff4;
        border: 1px solid #c6f6d5;
        border-radius: 8px;
        padding: 1.5rem;
        margin-top: 1rem;
    }
    
    .analysis-results h4 {
        color: #38a169;
        margin-bottom: 1rem;
    }
    
    .analysis-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .stat-item {
        text-align: center;
        padding: 1rem;
        background: white;
        border-radius: 6px;
        border-left: 4px solid #48bb78;
    }
    
    .stat-item.danger {
        border-left-color: #f56565;
    }
    
    .stat-item.warning {
        border-left-color: #ed8936;
    }
    
    .stat-number {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #2d3748;
    }
    
    .stat-label {
        font-size: 0.8rem;
        color: #718096;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .analysis-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .upload-stats {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }
    
    .upload-stat {
        text-align: center;
        padding: 1rem;
        background: rgba(255,255,255,0.8);
        border-radius: 6px;
        border-left: 4px solid #48bb78;
    }
    
    .analysis-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 6px;
        margin-top: 1rem;
        color: #4a5568;
    }
    
    .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }
    
    .setting-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .setting-item label {
        font-weight: 500;
        color: #4a5568;
    }
    
    .setting-item select {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.9rem;
    }
    
    .setting-item input[type="checkbox"] {
        margin-right: 0.5rem;
    }
    
    .sample-actions {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    
    .note {
        background: #f7fafc;
        border-left: 4px solid #4299e1;
        padding: 1rem;
        margin-top: 1rem;
        font-size: 0.9rem;
        color: #4a5568;
    }
    
    @media (max-width: 768px) {
        .analysis-stats {
            grid-template-columns: 1fr;
        }
        
        .analysis-actions {
            flex-direction: column;
        }
        
        .sample-actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(style);
