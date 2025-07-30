// SVG Save Handler for adrianzero.com
// Handles communication with TraitCreator DApp iframe and saves SVG files via GitHub API

class SVGSaveHandler {
    constructor() {
        this.githubToken = null;
        this.repository = 'adriangallery/adrianzero';
        this.branch = 'main';
        this.designsPath = 'designs';
        this.init();
    }

    async init() {
        // Listen for messages from the iframe
        window.addEventListener('message', this.handleMessage.bind(this));
        console.log('SVG Save Handler initialized');
    }

    async handleMessage(event) {
        // Verify origin for security
        if (event.origin !== 'https://traitcreator.vercel.app') {
            console.warn('Message from unauthorized origin:', event.origin);
            return;
        }

        const { type, tokenId, svgContent } = event.data;

        if (type === 'SAVE_SVG') {
            console.log('Received SVG save request for token:', tokenId);
            
            try {
                const result = await this.saveSVGToGitHub(tokenId, svgContent);
                
                // Send success response back to iframe
                event.source.postMessage({
                    type: 'SVG_SAVED',
                    success: true,
                    tokenId,
                    url: result.url,
                    message: `SVG saved successfully for token ${tokenId}`
                }, event.origin);
                
            } catch (error) {
                console.error('Error saving SVG:', error);
                
                // Send error response back to iframe
                event.source.postMessage({
                    type: 'SVG_SAVE_ERROR',
                    success: false,
                    tokenId,
                    error: error.message
                }, event.origin);
            }
        }
    }

    async saveSVGToGitHub(tokenId, svgContent) {
        try {
            // Create the file path
            const filePath = `${this.designsPath}/${tokenId}.svg`;
            
            // Get current file content (if exists) to get SHA
            const currentFile = await this.getFileContent(filePath);
            
            // Prepare the commit
            const commitData = {
                message: `Add SVG design for token ${tokenId}`,
                content: btoa(svgContent), // Base64 encode
                branch: this.branch
            };

            // If file exists, include the SHA for update
            if (currentFile) {
                commitData.sha = currentFile.sha;
            }

            // Make the API call
            const response = await fetch(`https://api.github.com/repos/${this.repository}/contents/${filePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(commitData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            
            // Wait a moment for GitHub to process
            await this.wait(2000);
            
            return {
                success: true,
                url: `https://adrianzero.com/${filePath}`,
                downloadUrl: result.content.download_url,
                sha: result.content.sha
            };

        } catch (error) {
            console.error('Error in saveSVGToGitHub:', error);
            throw error;
        }
    }

    async getFileContent(filePath) {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.repository}/contents/${filePath}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                return null; // File doesn't exist
            }

            if (!response.ok) {
                throw new Error(`Failed to get file content: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting file content:', error);
            return null;
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Method to set GitHub token (called from external script)
    setGitHubToken(token) {
        this.githubToken = token;
        console.log('GitHub token set');
    }
}

// Initialize the handler
window.svgSaveHandler = new SVGSaveHandler();

// Expose method to set token
window.setGitHubToken = function(token) {
    window.svgSaveHandler.setGitHubToken(token);
};

console.log('SVG Save Handler loaded successfully'); 