const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@${process.env.COUCHDB_URL.replace('http://', '')}`);
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

dotenv.config();

const app = express();

// Initialize CouchDB database
let userDb = nano.use(process.env.COUCHDB_DATABASE);

async function initializeDatabase() {
    try {
        // Check if database exists
        const dbList = await nano.db.list();
        
        if (!dbList.includes('users')) {
            // Create the database if it doesn't exist
            await nano.db.create('users');
            console.log('Users database created');
        }
        
        // Use the database
        userDb = nano.use('users');
        console.log('Connected to users database');
        
        // Create indexes
        await createIndexes();
        
        await setupDatabaseSecurity();
        
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1); // Exit if we can't initialize the database
    }
}

async function createIndexes() {
    try {
        // Index for username lookups
        await userDb.createIndex({
            index: {
                fields: ['username'],
                name: 'username-index'
            }
        });
        console.log('Username index created');

        // Index for email lookups
        await userDb.createIndex({
            index: {
                fields: ['email'],
                name: 'email-index'
            }
        });
        console.log('Email index created');

        // Compound index for auth tokens
        await userDb.createIndex({
            index: {
                fields: ['tokens.token', '_id'],
                name: 'tokens-index'
            }
        });
        console.log('Tokens index created');

        // Index for lastLogin date
        await userDb.createIndex({
            index: {
                fields: ['lastLogin'],
                name: 'lastLogin-index'
            }
        });
        console.log('LastLogin index created');

        // Index for saved recipes
        await userDb.createIndex({
            index: {
                fields: ['savedRecipes'],
                name: 'savedRecipes-index'
            }
        });
        console.log('SavedRecipes index created');

    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

// Add this after your database initialization
async function testConnection() {
    try {
        // Test nano connection
        const dbInfo = await nano.db.list();
        console.log('Available databases:', dbInfo);

        // Test users database connection
        const userDbInfo = await userDb.info();
        console.log('Users database info:', userDbInfo);

        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}

// Modify your initialization to include the test
async function startServer() {
    try {
        await initializeDatabase();
        const connectionSuccessful = await testConnection();
        
        if (!connectionSuccessful) {
            throw new Error('Failed to connect to CouchDB');
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
}

startServer();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Middleware for authentication
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user in CouchDB
        try {
            const user = await userDb.get(decoded._id);
            if (!user) {
                throw new Error();
            }
            req.token = token;
            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Please authenticate' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

// Add this before your routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Routes
app.get('/api/user/:id', auth, async (req, res) => {
    try {
        const user = await userDb.get(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Remove sensitive information
        delete user.password;
        delete user.tokens;
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/user/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'email', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates' });
    }

    try {
        const user = await userDb.get(req.params.id);
        
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        
        const updatedUser = { ...user, ...req.body };
        const response = await userDb.insert(updatedUser);
        
        if (response.ok) {
            delete updatedUser.password;
            delete updatedUser.tokens;
            res.json(updatedUser);
        } else {
            throw new Error('Failed to update user');
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.put('/api/user/:id/profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        const user = await userDb.get(req.params.id);
        user.profilePicture = req.file.path;
        
        const response = await userDb.insert(user);
        if (response.ok) {
            delete user.password;
            delete user.tokens;
            res.json(user);
        } else {
            throw new Error('Failed to update profile picture');
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Authentication routes
app.post('/api/users/register', async (req, res) => {
    try {
        validateUserDocument(req.body);
        const { username, email, password } = req.body;
        
        // Check for existing username
        const usernameQuery = {
            selector: {
                username: username
            },
            use_index: 'username-index',
            limit: 1
        };
        
        // Check for existing email
        const emailQuery = {
            selector: {
                email: email
            },
            use_index: 'email-index',
            limit: 1
        };
        
        const [usernameResult, emailResult] = await Promise.all([
            userDb.find(usernameQuery),
            userDb.find(emailQuery)
        ]);

        if (usernameResult.docs.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        if (emailResult.docs.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const token = jwt.sign({ username }, process.env.JWT_SECRET);
        
        const user = {
            username,
            email,
            password: hashedPassword,
            profilePicture: 'default-profile.jpg',
            savedRecipes: [],
            memberSince: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            tokens: [{ token }]
        };

        const response = await userDb.insert(user);
        if (response.ok) {
            const newUser = { ...user, _id: response.id };
            delete newUser.password;
            delete newUser.tokens;
            res.status(201).json({ user: newUser, token });
        } else {
            throw new Error('Failed to create user');
        }
    } catch (error) {
        res.status(400).json({ message: error.forbidden || error.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const query = {
            selector: {
                username: username
            },
            use_index: 'username-index',
            limit: 1
        };
        
        const result = await userDb.find(query);
        const user = result.docs[0];

        if (!user) {
            throw new Error('Invalid login credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid login credentials');
        }

        user.lastLogin = new Date().toISOString();
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        user.tokens = user.tokens || [];
        user.tokens.push({ token });

        const response = await userDb.insert(user);
        if (response.ok) {
            delete user.password;
            delete user.tokens;
            res.json({ user, token });
        } else {
            throw new Error('Failed to update login information');
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/user/:id/saved-recipes', auth, async (req, res) => {
    try {
        const query = {
            selector: {
                _id: req.params.id
            },
            fields: ['savedRecipes'],
            use_index: 'savedRecipes-index'
        };

        const result = await userDb.find(query);
        const user = result.docs[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ savedRecipes: user.savedRecipes || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/users/recent-logins', auth, async (req, res) => {
    try {
        // Verify admin status (you should implement proper admin verification)
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const query = {
            selector: {
                lastLogin: {
                    $gt: null
                }
            },
            sort: [{ lastLogin: 'desc' }],
            limit: 10,
            use_index: 'lastLogin-index',
            fields: ['username', 'lastLogin', 'email']
        };

        const result = await userDb.find(query);
        res.json(result.docs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add this function to help with debugging index usage
async function explainQuery(query) {
    try {
        const explanation = await userDb.explain(query);
        console.log('Query explanation:', JSON.stringify(explanation, null, 2));
        return explanation;
    } catch (error) {
        console.error('Error explaining query:', error);
        return null;
    }
}

// You can use it like this in development:
if (process.env.NODE_ENV === 'development') {
    app.get('/api/debug/query-explanation', auth, async (req, res) => {
        const query = {
            selector: {
                username: req.query.username
            },
            use_index: 'username-index'
        };
        
        const explanation = await explainQuery(query);
        res.json(explanation);
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 

// Add this function to your server.js
async function setupDatabaseSecurity() {
    try {
        const securityDoc = {
            admins: {
                names: ['admin'],
                roles: ['admin']
            },
            members: {
                names: [],
                roles: ['user']
            }
        };

        await userDb.insert(securityDoc, '_security');
        console.log('Database security configured');
    } catch (error) {
        console.error('Error setting up database security:', error);
    }
} 

// Security middleware
app.use(helmet()); // Security headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// More specific rate limits for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // limit each IP to 5 login attempts per hour
});
app.use('/api/users/login', authLimiter); 

// Add this validation function
function validateUserDocument(doc) {
    if (!doc.username || typeof doc.username !== 'string') {
        throw { forbidden: 'Username is required and must be a string' };
    }
    if (!doc.email || !doc.email.includes('@')) {
        throw { forbidden: 'Valid email is required' };
    }
    if (!doc.password || doc.password.length < 8) {
        throw { forbidden: 'Password must be at least 8 characters long' };
    }
} 