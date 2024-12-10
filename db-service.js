class DBService {
    constructor() {
        this.dbName = 'ReciliciousDB';
        this.dbVersion = 1;
        this.db = null;
        this.COOKBOOK_STORAGE_KEY = 'user_cookbook';
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'email' });
                    userStore.createIndex('username', 'username', { unique: true });
                }

                // Create savedRecipes store with auto-incrementing key
                if (!db.objectStoreNames.contains('savedRecipes')) {
                    const recipeStore = db.createObjectStore('savedRecipes', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    // Create indexes for faster querying
                    recipeStore.createIndex('userEmail', 'userEmail', { unique: false });
                    recipeStore.createIndex('recipeId', 'recipeId', { unique: false });
                    recipeStore.createIndex('userRecipe', ['userEmail', 'recipeId'], { unique: true });
                }
            };
        });
    }

    async registerUser(userData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const userStore = transaction.objectStore('users');

            // Add timestamp
            userData.memberSince = new Date().toISOString();
            userData.lastLogin = new Date().toISOString();
            userData.savedRecipes = [];
            userData.recipesCooked = 0;

            const request = userStore.add(userData);

            request.onsuccess = () => {
                resolve(userData);
            };

            request.onerror = () => {
                reject('Username or email already exists');
            };
        });
    }

    async loginUser(email, password) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const userStore = transaction.objectStore('users');
            const request = userStore.get(email);

            request.onsuccess = () => {
                const user = request.result;
                if (user && user.password === password) {
                    // Update last login
                    this.updateLastLogin(email);
                    resolve(user);
                } else {
                    reject('Invalid credentials');
                }
            };

            request.onerror = () => {
                reject('Error accessing database');
            };
        });
    }

    async updateLastLogin(email) {
        const transaction = this.db.transaction(['users'], 'readwrite');
        const userStore = transaction.objectStore('users');
        const request = userStore.get(email);

        request.onsuccess = () => {
            const user = request.result;
            user.lastLogin = new Date().toISOString();
            userStore.put(user);
        };
    }

    async saveRecipe(userEmail, recipe) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readwrite');
            const store = transaction.objectStore('savedRecipes');
            const index = store.index('userRecipe');

            // Check if recipe already exists for this user
            const query = index.get([userEmail, recipe.id.toString()]);

            query.onsuccess = (event) => {
                if (event.target.result) {
                    reject('Recipe already saved');
                    return;
                }

                // Save new recipe
                const recipeData = {
                    userEmail,
                    recipeId: recipe.id.toString(),
                    title: recipe.title,
                    image: recipe.image,
                    readyInMinutes: recipe.readyInMinutes,
                    servings: recipe.servings,
                    nutrition: recipe.nutrition,
                    savedDate: new Date().toISOString()
                };

                store.add(recipeData).onsuccess = () => resolve(recipeData);
            };

            query.onerror = () => reject('Error checking for existing recipe');
        });
    }

    async getUserSavedRecipes(userEmail) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readonly');
            const store = transaction.objectStore('savedRecipes');
            const index = store.index('userEmail');
            const request = index.getAll(userEmail);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error fetching saved recipes');
        });
    }

    async updateUserProfile(email, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const userStore = transaction.objectStore('users');
            const request = userStore.get(email);

            request.onsuccess = () => {
                const user = request.result;
                const updatedUser = { ...user, ...updates };
                const putRequest = userStore.put(updatedUser);

                putRequest.onsuccess = () => {
                    resolve(updatedUser);
                };

                putRequest.onerror = () => {
                    reject('Error updating profile');
                };
            };

            request.onerror = () => {
                reject('Error accessing database');
            };
        });
    }

    async getUserProfile(email) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const userStore = transaction.objectStore('users');
            const request = userStore.get(email);

            request.onsuccess = () => {
                const user = request.result;
                if (user) {
                    resolve(user);
                } else {
                    reject('User not found');
                }
            };

            request.onerror = () => reject('Error fetching user profile');
        });
    }

    async getUserStats(email) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readonly');
            const recipeStore = transaction.objectStore('savedRecipes');
            const userIndex = recipeStore.index('userEmail');
            const request = userIndex.getAll(email);

            request.onsuccess = () => {
                const savedRecipes = request.result;
                resolve({
                    savedRecipesCount: savedRecipes.length,
                    recipesShared: savedRecipes.filter(recipe => recipe.shared).length
                });
            };

            request.onerror = () => reject('Error fetching user stats');
        });
    }

    async getRecentActivity(email) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readonly');
            const recipeStore = transaction.objectStore('savedRecipes');
            const userIndex = recipeStore.index('userEmail');
            const request = userIndex.getAll(email);

            request.onsuccess = () => {
                const savedRecipes = request.result;
                // Sort by savedDate and get the most recent 5 activities
                const recentActivity = savedRecipes
                    .sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate))
                    .slice(0, 5);
                resolve(recentActivity);
            };

            request.onerror = () => reject('Error fetching recent activity');
        });
    }

    async removeRecipe(userEmail, recipeId) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readwrite');
            const store = transaction.objectStore('savedRecipes');
            const index = store.index('userRecipe');

            // First get the key for this user-recipe combination
            const getRequest = index.getKey([userEmail, recipeId.toString()]);
            
            getRequest.onsuccess = (event) => {
                const key = event.target.result;
                if (key) {
                    // Delete using the found key
                    const deleteRequest = store.delete(key);
                    deleteRequest.onsuccess = () => {
                        console.log(`Recipe ${recipeId} removed successfully`);
                        resolve();
                    };
                    deleteRequest.onerror = () => reject('Error deleting recipe');
                } else {
                    reject('Recipe not found');
                }
            };

            getRequest.onerror = () => reject('Error finding recipe to remove');
        });
    }

    async searchRecipes(query, filters = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readonly');
            const recipeStore = transaction.objectStore('savedRecipes');
            const request = recipeStore.getAll();

            request.onsuccess = () => {
                let recipes = request.result;
                
                // Apply search query
                if (query) {
                    recipes = recipes.filter(recipe => 
                        recipe.title.toLowerCase().includes(query.toLowerCase())
                    );
                }

                // Apply filters
                if (filters.cuisine) {
                    recipes = recipes.filter(recipe => 
                        recipe.cuisine === filters.cuisine
                    );
                }
                if (filters.diet) {
                    recipes = recipes.filter(recipe => 
                        recipe.diet === filters.diet
                    );
                }
                if (filters.time) {
                    recipes = recipes.filter(recipe => 
                        parseInt(recipe.cookTime) <= parseInt(filters.time)
                    );
                }

                resolve(recipes);
            };

            request.onerror = () => {
                reject('Error searching recipes');
            };
        });
    }

    async syncCookbookToStorage(userEmail) {
        const transaction = this.db.transaction(['savedRecipes'], 'readonly');
        const recipeStore = transaction.objectStore('savedRecipes');
        const userIndex = recipeStore.index('userEmail');
        const request = userIndex.getAll(userEmail);

        request.onsuccess = () => {
            const recipes = request.result;
            localStorage.setItem(`${this.COOKBOOK_STORAGE_KEY}_${userEmail}`, JSON.stringify(recipes));
            console.log('Cookbook synced to storage');
        };

        request.onerror = () => console.error('Error syncing cookbook to storage');
    }

    clearCookbookData(userEmail) {
        localStorage.removeItem(`${this.COOKBOOK_STORAGE_KEY}_${userEmail}`);
    }

    async clearCookbook(userEmail) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['savedRecipes'], 'readwrite');
            const store = transaction.objectStore('savedRecipes');
            const index = store.index('userEmail');
            
            // Get all recipes for this user
            const request = index.getAllKeys(userEmail);
            
            request.onsuccess = () => {
                const keys = request.result;
                // Delete all recipes for this user
                keys.forEach(key => store.delete(key));
                console.log('Cookbook cleared successfully');
                resolve();
            };
            
            request.onerror = () => reject('Error clearing cookbook');
        });
    }
}

export const dbService = new DBService();

if (!window.indexedDB) {
    console.log("Your browser doesn't support IndexedDB. Supported browsers include:");
    console.log("- Chrome 24+");
    console.log("- Firefox 16+");
    console.log("- Safari 10+");
    console.log("- Edge (all versions)");
    console.log("- Opera 15+");
    console.log("Please upgrade your browser to use this application.");
}