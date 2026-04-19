// Admin Configuration Storage
class AdminConfig {
    constructor() {
        this.storageKey = 'shooterGameAdminConfig';
        this.defaultConfig = {
            burnTokens: [
                {
                    id: 1,
                    name: 'Basic Token',
                    amount: 1,
                    active: true
                }
            ],
            rewards: [
                {
                    score: 100,
                    tokenId: 2,
                    amount: 1,
                    name: 'Bronze Reward'
                },
                {
                    score: 500,
                    tokenId: 3,
                    amount: 5,
                    name: 'Silver Reward'
                },
                {
                    score: 1000,
                    tokenId: 4,
                    amount: 10,
                    name: 'Gold Reward'
                }
            ],
            lastUpdated: null
        };
        this.loadConfig();
    }

    loadConfig() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.config = JSON.parse(stored);
            } else {
                this.config = { ...this.defaultConfig };
                this.saveConfig();
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = { ...this.defaultConfig };
        }
    }

    saveConfig() {
        try {
            this.config.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    }

    // Burn Tokens Management
    getBurnTokens() {
        return this.config.burnTokens || [];
    }

    addBurnToken(token) {
        if (!this.config.burnTokens) {
            this.config.burnTokens = [];
        }
        
        const newToken = {
            id: token.id || Date.now(),
            name: token.name || `Token ${token.id}`,
            amount: token.amount || 1,
            active: token.active !== false
        };
        
        this.config.burnTokens.push(newToken);
        this.saveConfig();
        return newToken;
    }

    updateBurnToken(id, updates) {
        const token = this.config.burnTokens.find(t => t.id === id);
        if (token) {
            Object.assign(token, updates);
            this.saveConfig();
            return token;
        }
        return null;
    }

    removeBurnToken(id) {
        this.config.burnTokens = this.config.burnTokens.filter(t => t.id !== id);
        this.saveConfig();
    }

    // Rewards Management
    getRewards() {
        return this.config.rewards || [];
    }

    addReward(reward) {
        if (!this.config.rewards) {
            this.config.rewards = [];
        }
        
        const newReward = {
            score: reward.score,
            tokenId: reward.tokenId,
            amount: reward.amount,
            name: reward.name || `Reward for ${reward.score}+ points`
        };
        
        this.config.rewards.push(newReward);
        this.saveConfig();
        return newReward;
    }

    updateReward(score, updates) {
        const reward = this.config.rewards.find(r => r.score === score);
        if (reward) {
            Object.assign(reward, updates);
            this.saveConfig();
            return reward;
        }
        return null;
    }

    removeReward(score) {
        this.config.rewards = this.config.rewards.filter(r => r.score !== score);
        this.saveConfig();
    }

    // Get active burn tokens
    getActiveBurnTokens() {
        return this.config.burnTokens.filter(t => t.active);
    }

    // Get reward for specific score
    getRewardForScore(score) {
        const sortedRewards = this.config.rewards.sort((a, b) => b.score - a.score);
        return sortedRewards.find(r => score >= r.score);
    }

    // Export configuration
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }

    // Import configuration
    importConfig(configString) {
        try {
            const imported = JSON.parse(configString);
            this.config = { ...this.defaultConfig, ...imported };
            this.saveConfig();
            return true;
        } catch (error) {
            console.error('Error importing config:', error);
            return false;
        }
    }

    // Reset to default
    resetToDefault() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminConfig;
} else {
    window.AdminConfig = AdminConfig;
}
