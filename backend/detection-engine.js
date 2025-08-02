// Detection engine with heuristic-based fake account detection
// TODO: Replace with ML model integration in future versions

const crypto = require('crypto');

// Known disposable email domains (sample list)
const DISPOSABLE_EMAIL_DOMAINS = [
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 
    'yopmail.com', 'tempmail.org', 'throwaway.email',
    'temp-mail.org', 'getnada.com', 'maildrop.cc'
];

// Common fake username patterns
const SUSPICIOUS_USERNAME_PATTERNS = [
    /^[a-z]+\d{4,}$/, // letters followed by many digits
    /^[a-z]{1,3}\d{8,}$/, // few letters + many digits
    /^user\d+$/i, // user + numbers
    /^account\d+$/i, // account + numbers
    /^test\d+$/i, // test + numbers
    /^fake\d+$/i, // fake + numbers
    /^bot\d+$/i, // bot + numbers
];

/**
 * Analyze a batch of accounts for fake indicators
 * @param {Array} accounts - Array of account objects
 * @returns {Object} - Analysis results
 */
function analyzeAccounts(accounts) {
    const results = {
        total: accounts.length,
        flagged: [],
        clean: []
    };

    // Track profile picture hashes for duplicate detection
    const profilePicHashes = new Map();

    accounts.forEach((account, index) => {
        const analysis = analyzeSingleAccount(account, profilePicHashes);
        
        if (analysis.suspicionScore >= 3) { // Threshold for flagging
            analysis.accountData = account;
            results.flagged.push(analysis);
        } else {
            results.clean.push(analysis);
        }
    });

    return results;
}

/**
 * Analyze a single account for fake indicators
 * @param {Object} account - Account object
 * @param {Map} profilePicHashes - Map to track duplicate profile pictures
 * @returns {Object} - Analysis result
 */
function analyzeSingleAccount(account, profilePicHashes = new Map()) {
    const flags = [];
    let suspicionScore = 0;

    // 1. Check posting frequency (burst behavior)
    const burstCheck = checkBurstPosting(account);
    if (burstCheck.isSuspicious) {
        flags.push(`High posting frequency: ${burstCheck.postsPerDay} posts/day`);
        suspicionScore += 2;
    }

    // 2. Check profile completeness
    const completenessCheck = checkProfileCompleteness(account);
    if (completenessCheck.isSuspicious) {
        flags.push(`Low profile completeness: ${completenessCheck.score}%`);
        suspicionScore += 1;
    }

    // 3. Check account age
    const ageCheck = checkAccountAge(account);
    if (ageCheck.isSuspicious) {
        flags.push(`New account: ${ageCheck.ageDays} days old`);
        suspicionScore += 1;
    }

    // 4. Check username patterns
    const usernameCheck = checkSuspiciousUsername(account.username);
    if (usernameCheck.isSuspicious) {
        flags.push(`Suspicious username pattern: ${usernameCheck.pattern}`);
        suspicionScore += 2;
    }

    // 5. Check for duplicate profile pictures
    const duplicateCheck = checkDuplicateProfilePic(account, profilePicHashes);
    if (duplicateCheck.isDuplicate) {
        flags.push(`Duplicate profile picture detected`);
        suspicionScore += 3;
    }

    // 6. Check suspicious metadata
    const metadataCheck = checkSuspiciousMetadata(account);
    if (metadataCheck.isSuspicious) {
        flags.push(`Suspicious metadata: ${metadataCheck.issues.join(', ')}`);
        suspicionScore += metadataCheck.score;
    }

    // 7. Check activity time anomalies
    const activityCheck = checkActivityAnomalies(account);
    if (activityCheck.isSuspicious) {
        flags.push(`Activity anomaly: ${activityCheck.issue}`);
        suspicionScore += 1;
    }

    // 8. Check content similarity (basic implementation)
    const contentCheck = checkContentSimilarity(account);
    if (contentCheck.isSuspicious) {
        flags.push(`Duplicate content detected: ${contentCheck.similarity}% similarity`);
        suspicionScore += 2;
    }

    // Determine risk level
    let riskLevel = 'LOW';
    if (suspicionScore >= 5) riskLevel = 'HIGH';
    else if (suspicionScore >= 3) riskLevel = 'MEDIUM';

    return {
        username: account.username,
        suspicionScore,
        riskLevel,
        flags,
        details: {
            burstPosting: burstCheck,
            profileCompleteness: completenessCheck,
            accountAge: ageCheck,
            usernamePattern: usernameCheck,
            duplicateProfile: duplicateCheck,
            metadata: metadataCheck,
            activity: activityCheck,
            content: contentCheck
        }
    };
}

// Individual check functions

function checkBurstPosting(account) {
    const posts = parseInt(account.posts) || 0;
    const accountAge = calculateAccountAge(account.created_at);
    
    if (accountAge === 0) accountAge = 1; // Avoid division by zero
    
    const postsPerDay = posts / accountAge;
    
    // Flag if posting more than 50 posts per day consistently
    const isSuspicious = postsPerDay > 50;
    
    return {
        isSuspicious,
        postsPerDay: Math.round(postsPerDay * 100) / 100,
        totalPosts: posts,
        accountAge
    };
}

function checkProfileCompleteness(account) {
    let score = 0;
    const fields = ['bio', 'profile_picture', 'full_name', 'website', 'location'];
    
    fields.forEach(field => {
        if (account[field] && account[field].trim() !== '') {
            score += 20; // Each field worth 20%
        }
    });
    
    const followers = parseInt(account.followers) || 0;
    const following = parseInt(account.following) || 0;
    
    // Bonus points for social connections
    if (followers > 10) score += 10;
    if (following > 5) score += 10;
    
    const isSuspicious = score < 40; // Less than 40% completeness is suspicious
    
    return {
        isSuspicious,
        score: Math.min(score, 100),
        missingFields: fields.filter(field => !account[field] || account[field].trim() === '')
    };
}

function checkAccountAge(account) {
    const ageDays = calculateAccountAge(account.created_at);
    const isSuspicious = ageDays < 30; // Accounts less than 30 days old are suspicious
    
    return {
        isSuspicious,
        ageDays
    };
}

function checkSuspiciousUsername(username) {
    if (!username) return { isSuspicious: false };
    
    for (const pattern of SUSPICIOUS_USERNAME_PATTERNS) {
        if (pattern.test(username)) {
            return {
                isSuspicious: true,
                pattern: pattern.toString()
            };
        }
    }
    
    return { isSuspicious: false };
}

function checkDuplicateProfilePic(account, profilePicHashes) {
    if (!account.profile_picture) {
        return { isDuplicate: false };
    }
    
    // Create a simple hash of the profile picture URL/data
    const picHash = crypto.createHash('md5').update(account.profile_picture).digest('hex');
    
    if (profilePicHashes.has(picHash)) {
        return {
            isDuplicate: true,
            originalAccount: profilePicHashes.get(picHash)
        };
    }
    
    profilePicHashes.set(picHash, account.username);
    return { isDuplicate: false };
}

function checkSuspiciousMetadata(account) {
    const issues = [];
    let score = 0;
    
    // Check email verification
    if (account.email_verified === false || account.email_verified === 'false') {
        issues.push('Email not verified');
        score += 1;
    }
    
    // Check for disposable email domains
    if (account.email) {
        const emailDomain = account.email.split('@')[1]?.toLowerCase();
        if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
            issues.push('Disposable email domain');
            score += 2;
        }
    }
    
    // Check phone verification
    if (account.phone_verified === false || account.phone_verified === 'false') {
        issues.push('Phone not verified');
        score += 1;
    }
    
    // Check for missing email
    if (!account.email || account.email.trim() === '') {
        issues.push('No email provided');
        score += 1;
    }
    
    return {
        isSuspicious: issues.length > 0,
        issues,
        score
    };
}

function checkActivityAnomalies(account) {
    // Simple implementation - check for 24/7 uniform posting
    if (account.posting_hours) {
        const hours = account.posting_hours.split(',').map(h => parseInt(h.trim()));
        const uniqueHours = new Set(hours);
        
        // If posting across too many different hours (suggesting bot behavior)
        if (uniqueHours.size > 20) {
            return {
                isSuspicious: true,
                issue: '24/7 posting pattern detected'
            };
        }
    }
    
    // Check for impossible geographic jumps (if location data exists)
    if (account.recent_locations) {
        const locations = account.recent_locations.split(',');
        if (locations.length > 3) {
            return {
                isSuspicious: true,
                issue: 'Multiple geographic locations in short time'
            };
        }
    }
    
    return { isSuspicious: false };
}

function checkContentSimilarity(account) {
    // Basic content similarity check
    if (account.recent_posts) {
        const posts = account.recent_posts.split('|||'); // Assuming posts separated by |||
        
        if (posts.length >= 2) {
            // Simple similarity check - look for exact duplicates
            const uniquePosts = new Set(posts.map(post => post.trim().toLowerCase()));
            const duplicateRatio = 1 - (uniquePosts.size / posts.length);
            
            if (duplicateRatio > 0.5) { // More than 50% duplicate content
                return {
                    isSuspicious: true,
                    similarity: Math.round(duplicateRatio * 100)
                };
            }
        }
    }
    
    return { isSuspicious: false };
}

// Utility functions

function calculateAccountAge(createdAt) {
    if (!createdAt) return 0;
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// String similarity function (simple Levenshtein distance)
function calculateStringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
        for (let i = 1; i <= len1; i++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j - 1][i] + 1,
                matrix[j][i - 1] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }
    
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 100 : ((maxLen - matrix[len2][len1]) / maxLen) * 100;
}

module.exports = {
    analyzeAccounts,
    analyzeSingleAccount,
    checkBurstPosting,
    checkProfileCompleteness,
    checkAccountAge,
    checkSuspiciousUsername,
    checkSuspiciousMetadata,
    calculateAccountAge,
    calculateStringSimilarity
};
