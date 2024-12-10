import { dbService } from './db-service.js';

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const passwordForm = document.getElementById('passwordForm');
    const errorMessage = document.getElementById('errorMessage');

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Clear previous error messages
        errorMessage.textContent = '';

        // Validate passwords
        if (newPassword !== confirmPassword) {
            errorMessage.textContent = 'New passwords do not match';
            return;
        }

        if (newPassword.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long';
            return;
        }

        try {
            // Verify current password
            const user = await dbService.loginUser(currentUser.email, currentPassword);
            
            // Update password
            await dbService.updateUserProfile(currentUser.email, {
                password: newPassword
            });

            alert('Password updated successfully!');
            window.location.href = 'account.html';
        } catch (error) {
            errorMessage.textContent = 'Current password is incorrect';
        }
    });
}); 