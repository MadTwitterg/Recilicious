import { dbService } from './db-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Get user profile
        const userData = await dbService.getUserProfile(currentUser.email);
        
        // Update profile information
        document.querySelector('.profile-info h2').textContent = userData.username;
        document.querySelector('.profile-info p').textContent = userData.email;
        document.querySelector('.member-since').textContent = 
            `Member since: ${new Date(userData.memberSince).toLocaleDateString()}`;

        // Update profile picture if exists
        if (userData.profilePicture) {
            document.querySelector('.profile-picture').src = userData.profilePicture;
        }

        // Get and update user stats
        const stats = await dbService.getUserStats(currentUser.email);
        document.querySelector('.stats-grid').innerHTML = `
            <div class="stat-card">
                <h3>${stats.savedRecipesCount}</h3>
                <p>Saved Recipes</p>
            </div>
            <div class="stat-card">
                <h3>${stats.recipesShared}</h3>
                <p>Recipes Shared</p>
            </div>
        `;

        // Get and update recent activity
        const recentActivity = await dbService.getRecentActivity(currentUser.email);
        const activityList = document.querySelector('.activity-list');
        
        if (recentActivity.length === 0) {
            activityList.innerHTML = '<p>No recent activity</p>';
        } else {
            activityList.innerHTML = recentActivity.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.shared ? 'fa-share-alt' : 'fa-bookmark'}"></i>
                    </div>
                    <div class="activity-details">
                        <p>${activity.shared ? 'Shared: ' : 'Saved: '} ${activity.title}</p>
                        <span class="activity-time">
                            ${getTimeAgo(new Date(activity.savedDate))}
                        </span>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading user data:', error);
        // Show error message to user
        document.querySelector('.main-content').innerHTML = `
            <div class="error-message">
                Failed to load user data. Please try again later.
            </div>
        `;
    }
});

// Helper function to format time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
}

// Handle profile picture upload
document.querySelector('.change-photo-btn').addEventListener('click', async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                const imageData = e.target.result;
                
                await dbService.updateUserProfile(currentUser.email, {
                    profilePicture: imageData
                });

                document.querySelector('.profile-picture').src = imageData;
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Failed to update profile picture');
        }
    };

    input.click();
}); 