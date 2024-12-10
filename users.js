class UserManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
    }

    addUser(email, username, password) {
        // Check if username or email already exists
        if (this.users.some(user => user.username === username)) {
            throw new Error('Username already exists');
        }
        if (this.users.some(user => user.email === email)) {
            throw new Error('Email already exists');
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            email,
            username,
            password: this.hashPassword(password), // In a real app, use proper password hashing
            savedRecipes: []
        };

        this.users.push(newUser);
        this.saveUsers();
        return newUser;
    }

    verifyUser(username, password) {
        const user = this.users.find(user => user.username === username);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.password !== this.hashPassword(password)) {
            throw new Error('Incorrect password');
        }

        return user;
    }

    hashPassword(password) {
        // This is a simple hash function for demonstration
        // In a real app, use a proper password hashing library
        return btoa(password);
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }
}

const userManager = new UserManager(); 