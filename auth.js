document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleForms = document.getElementById('toggleForms');
    const toggleText = document.getElementById('toggleText');
    const errorMessage = document.getElementById('errorMessage');

    let isLoginForm = true;

    toggleForms.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginForm = !isLoginForm;
        
        // Clear any error messages
        errorMessage.style.display = 'none';
        
        // Clear form inputs
        loginForm.reset();
        signupForm.reset();

        if (isLoginForm) {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            toggleText.textContent = 'New chef? Create an account! 👨‍🍳';
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            toggleText.textContent = 'Already have an account? Login 🔑';
        }
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            // Store user info in localStorage (temporary solution)
            const user = { email, username: email.split('@')[0] };
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Redirect to home page
            window.location.href = 'home.html';
        } catch (error) {
            errorMessage.style.display = 'flex';
            errorMessage.querySelector('span').textContent = error.message;
        }
    });

    // Handle signup form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;

        try {
            // Store user info in localStorage (temporary solution)
            const user = { email, username };
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Redirect to home page
            window.location.href = 'home.html';
        } catch (error) {
            errorMessage.style.display = 'flex';
            errorMessage.querySelector('span').textContent = error.message;
        }
    });
}); 