// Social media sharing functionality
class SocialMediaSharing {
    constructor() {
        this.savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || {};
    }

    getShareText() {
        const recipeCount = Object.keys(this.savedRecipes).length;
        return `Check out my cookbook on Recilicious! I have saved ${recipeCount} amazing recipes!`;
    }

    getShareUrl() {
        return encodeURIComponent(window.location.origin);
    }

    shareToTwitter() {
        const shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.getShareText())}&url=${this.getShareUrl()}`;
        this.openShareWindow(shareLink);
    }

    shareToFacebook() {
        const shareLink = `https://www.facebook.com/sharer/sharer.php?u=${this.getShareUrl()}&quote=${encodeURIComponent(this.getShareText())}`;
        this.openShareWindow(shareLink);
    }

    shareToInstagram() {
        // Instagram doesn't support direct URL sharing
        alert('To share on Instagram, please screenshot your cookbook and share it manually.');
    }

    openShareWindow(url) {
        window.open(url, '_blank', 'width=600,height=400');
    }

    share(platform) {
        switch(platform) {
            case 'twitter':
                this.shareToTwitter();
                break;
            case 'facebook':
                this.shareToFacebook();
                break;
            case 'instagram':
                this.shareToInstagram();
                break;
            default:
                console.error('Unsupported platform');
        }
    }
}

// Initialize social media sharing
const socialMedia = new SocialMediaSharing();

// Export the share function to be used in HTML
function shareTo(platform) {
    socialMedia.share(platform);
    
}

// Handle image uploads
export async function handleImageUpload(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result); // Returns base64 string of image
        };
        
        reader.onerror = (error) => {
            reject(error);
        };
        
        reader.readAsDataURL(file);
    });
}

// Validate file type and size
export function validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image (JPEG, PNG, or GIF).');
    }

    if (file.size > maxSize) {
        throw new Error('File is too large. Maximum size is 5MB.');
    }

    return true;
} 