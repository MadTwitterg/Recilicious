import { dbService } from './db-service.js';
import { recipeService } from './recipe-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize stats
    updateStats(currentUser.email);
    loadSavedRecipes(currentUser.email);
});

async function updateStats(userEmail) {
    try {
        const stats = await dbService.getUserStats(userEmail);
        document.getElementById('savedCount').textContent = stats.savedRecipesCount;
        document.getElementById('sharedCount').textContent = stats.recipesShared;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function showEmptyState() {
    const recipeGrid = document.getElementById('savedRecipes');
    recipeGrid.innerHTML = `
        <div class="message-container">
            <img src="https://media.giphy.com/media/3o7TKEP6YngkCKFofC/giphy.gif" alt="Empty cookbook" class="message-gif">
            <h3>Your cookbook is looking a bit hungry! 📚</h3>
            <p>Time to add some delicious recipes to your collection</p>
            <button onclick="window.location.href='home.html'" class="btn btn-primary">
                Discover Recipes
            </button>
        </div>
    `;
}

async function loadSavedRecipes(userEmail) {
    const recipeGrid = document.getElementById('savedRecipes');
    
    try {
        const savedRecipes = await dbService.getUserSavedRecipes(userEmail);

        if (savedRecipes.length === 0) {
            showEmptyState();
            return;
        }

        // Get full recipe details from recipe service
        const recipesWithDetails = savedRecipes.map(saved => {
            try {
                console.log('Getting recipe:', saved.recipeId);
                return recipeService.getRecipeById(saved.recipeId);
            } catch (error) {
                console.error(`Error getting recipe ${saved.recipeId}:`, error);
                return saved;
            }
        });
       const rd =await Promise.all(recipesWithDetails);
          // console.log(rd);
        recipeGrid.innerHTML = rd.map(recipe=> 
            `
            <div class="recipe-card" id="recipe-${recipe.id}">
                <div class="recipe-content" onclick="window.location.href='recipe.html?id=${recipe.id}'">
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image"
                      ">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span class="meta-label">Time</span>
                            <span class="meta-value">${recipe.readyInMinutes} min</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-user"></i>
                            <span class="meta-label">Servings</span>
                            <span class="meta-value">${recipe.servings}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-fire"></i>
                            <span class="meta-label">H.Score</span>
                            <span class="meta-value">${recipe.healthScore}</span>
                        </div>
                    </div>
                </div>
                <button class="remove-btn" onclick="event.stopPropagation(); removeRecipe(${recipe.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);

    } catch (error) {
        console.error('Error loading saved recipes:', error);
        recipeGrid.innerHTML = `
            <div class="message-container">
                <img src="https://media.giphy.com/media/3o7TKEP6YngkCKFofC/giphy.gif" alt="Error" class="message-gif">
                <h3>Oops! Something went wrong 🤔</h3>
                <p>We're having trouble loading your recipes</p>
                <button onclick="window.location.reload()" class="btn btn-primary">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Global functions
window.removeRecipe = async function(recipeId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    try {
        const recipeCard = document.getElementById(`recipe-${recipeId}`);
        recipeCard.classList.add('removing');

        await dbService.removeRecipe(currentUser.email, recipeId);
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove from DOM
        recipeCard.remove();

        // Update stats
        updateStats(currentUser.email);

        // Check if cookbook is empty
        const remainingRecipes = document.querySelectorAll('.recipe-card');
        if (remainingRecipes.length === 0) {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error removing recipe:', error);
    }
};

window.clearCookbook = async function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    try {
        await dbService.clearCookbook(currentUser.email);
        showEmptyState();
        updateStats(currentUser.email);
    } catch (error) {
        console.error('Error clearing cookbook:', error);
    }
};

window.shareCookbook = async function() {
    // Implement sharing functionality
    alert('Sharing functionality coming soon!');
};