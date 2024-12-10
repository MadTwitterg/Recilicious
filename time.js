import { SPOONACULAR_API_KEY, SPOONACULAR_BASE_URL } from './config.js';

class RecipeTimeManager {
    constructor() {
        this.STORAGE_KEY = 'daily_recipes';
        this.LAST_UPDATE_KEY = 'last_recipe_update';
        this.IST_OFFSET = 5.5; // IST is UTC+5:30 (5.5 hours)
    }

    async checkAndUpdateRecipes() {
        const istDate = this.getISTDate();
        const lastUpdate = localStorage.getItem(this.LAST_UPDATE_KEY);
        const storedRecipes = localStorage.getItem(this.STORAGE_KEY);

        // Check if we need to update recipes (new day in IST or no stored recipes)
        if (istDate !== lastUpdate || !storedRecipes) {
            console.log('Fetching new daily recipes...');
            try {
                const recipes = await this.fetchDailyRecipes();
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
                localStorage.setItem(this.LAST_UPDATE_KEY, istDate);
                return recipes;
            } catch (error) {
                console.error('Error fetching daily recipes:', error);
                if (storedRecipes) {
                    return JSON.parse(storedRecipes);
                }
                throw error;
            }
        } else {
            console.log('Using cached daily recipes');
            return JSON.parse(storedRecipes);
        }
    }

    // Get current date in IST
    getISTDate() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istTime = new Date(utc + (3600000 * this.IST_OFFSET));
        return istTime.toISOString().split('T')[0];
    }

    // Get time until next update (midnight IST)
    getTimeUntilNextUpdate() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istTime = new Date(utc + (3600000 * this.IST_OFFSET));
        
        // Set to next midnight IST
        const tomorrow = new Date(istTime);
        tomorrow.setHours(24, 0, 0, 0);
        
        return tomorrow - istTime;
    }

    async fetchDailyRecipes() {
        try {
            console.log('Fetching recipes with nutrition data...');
            
            // Add headers to the request
            const response = await fetch(
                `${SPOONACULAR_BASE_URL}/random?apiKey=${SPOONACULAR_API_KEY}&number=10&addRecipeInformation=true&includeNutrition=true`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('API Error');
            }

            const data = await response.json();
            return data.recipes;
        } catch (error) {
            document.getElementById('recipeGrid').innerHTML = `
                <div class="message-container">
                    <img src="https://media.giphy.com/media/3o7TKEP6YngkCKFofC/giphy.gif" alt="Error" class="message-gif">
                    <h3>Our kitchen is having technical difficulties! 👨‍🔧</h3>
                    <p>Don't worry, our tech chefs are fixing it</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        Try Again
                    </button>
                </div>
            `;
            throw error;
        }
    }

    scheduleNextUpdate() {
        const timeUntilNextUpdate = this.getTimeUntilNextUpdate();
        const hours = Math.floor(timeUntilNextUpdate / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilNextUpdate % (1000 * 60 * 60)) / (1000 * 60));
        
        console.log(`Next recipe update in ${hours} hours and ${minutes} minutes (at midnight IST)`);
        
        setTimeout(() => {
            this.checkAndUpdateRecipes()
                .then(() => {
                    window.dispatchEvent(new CustomEvent('recipesUpdated'));
                    this.scheduleNextUpdate();
                })
                .catch(console.error);
        }, timeUntilNextUpdate);
    }
}

export const recipeTimeManager = new RecipeTimeManager(); 