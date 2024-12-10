import { dbService } from './db-service.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleForms = document.getElementById('toggleForms');
    const formTitle = document.getElementById('formTitle');
    const errorMessage = document.getElementById('errorMessage');

    let isLoginForm = true;

    toggleForms.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginForm = !isLoginForm;
        formTitle.textContent = isLoginForm ? 'Login' : 'Sign Up';
        loginForm.style.display = isLoginForm ? 'block' : 'none';
        signupForm.style.display = isLoginForm ? 'none' : 'block';
        toggleForms.textContent = isLoginForm ? "Don't have an account? Sign up" : 'Already have an account? Login';
        errorMessage.textContent = '';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const user = await dbService.loginUser(email, password);
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'home.html';
        } catch (error) {
            errorMessage.textContent = error;
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            return;
        }

        try {
            const user = await dbService.registerUser({
                email,
                username,
                password,
                profilePicture: 'default-profile.jpg'
            });
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'home.html';
        } catch (error) {
            errorMessage.textContent = error;
        }
    });

    const logoutBtn = document.querySelector('.btn-danger');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

export function logout() {
    try {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error during logout:', error);
    }
} 