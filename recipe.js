import { recipeService } from './recipe-service.js';
import { dbService } from './db-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        document.getElementById('recipeDetails').innerHTML = '<p class="error">Recipe not found</p>';
        return;
    }

    try {
        // Check if recipe is saved
        const savedRecipes = await dbService.getUserSavedRecipes(currentUser.email);
        const isSaved = savedRecipes.some(recipe => recipe.recipeId === recipeId);

        const recipe = await recipeService.getRecipeById(recipeId);
        displayRecipeDetails(recipe, isSaved);
    } catch (error) {
        console.error('Error loading recipe:', error);
        document.getElementById('recipeDetails').innerHTML = `
            <div class="message-container">
                <h3>Failed to load recipe</h3>
                <button onclick="window.location.reload()" class="btn btn-primary">Try Again</button>
            </div>`;
    }
});

function displayRecipeDetails(recipe, isSaved) {
    const recipeDetails = document.getElementById('recipeDetails');
    
    recipeDetails.innerHTML = `
        <div class="recipe-header">
            <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image"
                 onerror="this.src='recipe_placeholder.jpg'">
            <div class="recipe-info">
                <h1>${recipe.title}</h1>
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
                        <span class="meta-label">Calories</span>
                        <span class="meta-value">${Math.round(recipe.nutrition?.nutrients?.[0]?.amount) || 'N/A'}</span>
                    </div>
                </div>
                <button class="save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveRecipe(${recipe.id}, this)">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
        </div>

        <div class="recipe-content">
            <div class="ingredients-section">
                <h2 class="section-title"><i class="fas fa-list"></i> Ingredients</h2>
                <ul class="ingredients-list">
                    ${recipe.extendedIngredients.map(ingredient => `
                        <li class="ingredient-item">
                            <span class="ingredient-name">${ingredient.original}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="instructions-section">
                <h2 class="section-title"><i class="fas fa-tasks"></i> Instructions</h2>
                <ol class="instructions-list">
                    ${recipe.analyzedInstructions[0]?.steps.map(step => `
                        <li class="instruction-step">
                            <span class="step-number">${step.number}</span>
                            <span class="step-text">${step.step}</span>
                        </li>
                    `).join('') || '<li>No instructions available.</li>'}
                </ol>
            </div>
        </div>
    `;
}

window.toggleSaveRecipe = async function(recipeId, button) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const isSaved = button.classList.contains('saved');
        
        if (isSaved) {
            await dbService.removeRecipe(currentUser.email, recipeId);
            button.classList.remove('saved');
        } else {
            const recipe = await recipeService.getRecipeById(recipeId);
            await dbService.saveRecipe(currentUser.email, recipe);
            button.classList.add('saved');
        }
    } catch (error) {
        console.error('Error toggling recipe save:', error);
    }
}; 