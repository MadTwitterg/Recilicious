// API Configuration
const API_KEY = 'bd6c47ba6c394d139f708b3e6dd4b0be';
const BASE_URL = 'https://api.spoonacular.com/recipes';

// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-links a');
const recipeGrid = document.getElementById('recipeGrid');
const searchResults = document.getElementById('searchResults');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const saveBtn = document.getElementById('saveRecipe');

// State Management
let currentRecipe = null;
let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || {};

// Navigation
function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(`${pageId}Page`).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
}

// API Calls
async function fetchRandomRecipes() {
    try {
        const response = await fetch(
            `${BASE_URL}/random?apiKey=${API_KEY}&number=9`
        );
        const data = await response.json();
        displayRecipes(data.recipes, recipeGrid);
    } catch (error) {
        console.error('Error fetching random recipes:', error);
        recipeGrid.innerHTML = '<p class="error">Error loading recipes. Please try again later.</p>';
    }
}

async function searchRecipes(query) {
    try {
        // Show loading state
        searchResults.innerHTML = '<div class="loading">Searching recipes...</div>';
        
        // Update the API endpoint to include more parameters for better results
        const response = await fetch(
            `${BASE_URL}/complexSearch?apiKey=${API_KEY}&query=${query}&addRecipeInformation=true&number=12&instructionsRequired=true&fillIngredients=true&addRecipeNutrition=true`
        );
        const data = await response.json();
        
        if (data.results.length === 0) {
            searchResults.innerHTML = '<p class="no-results">No recipes found. Try different ingredients!</p>';
            return;
        }
        
        displayRecipes(data.results, searchResults);
        showPage('search');
    } catch (error) {
        console.error('Error searching recipes:', error);
        searchResults.innerHTML = '<p class="error">Error searching recipes. Please try again later.</p>';
    }
}

// Display Functions
function displayRecipes(recipes, container) {
    container.innerHTML = '';
    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}">
            <div class="recipe-card-content">
                <h3>${recipe.title}</h3>
                <p>
                    <i class="fas fa-clock"></i> ${recipe.readyInMinutes} mins
                    <i class="fas fa-list"></i> ${recipe.extendedIngredients?.length || 0} ingredients
                </p>
            </div>
        `;
        recipeCard.addEventListener('click', () => {
            window.location.href = `recipe.html?id=${recipe.id}`;
        });
        container.appendChild(recipeCard);
    });
}

// Cookbook Functions
function saveRecipe() {
    if (currentRecipe) {
        savedRecipes[currentRecipe.id] = currentRecipe;
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        updateSaveButton(currentRecipe.id);
    }
}

function removeRecipe(recipeId) {
    delete savedRecipes[recipeId];
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    displaySavedRecipes(); // Refresh the cookbook display
}

function updateSaveButton(recipeId) {
    const isSaved = savedRecipes[recipeId];
    saveBtn.innerHTML = isSaved 
        ? '<i class="fas fa-bookmark"></i> Saved'
        : '<i class="far fa-bookmark"></i> Save Recipe';
    saveBtn.classList.toggle('saved', isSaved);
}

function displaySavedRecipes() {
    const savedRecipesContainer = document.getElementById('savedRecipes');
    const recipes = Object.values(savedRecipes);
    
    if (recipes.length === 0) {
        savedRecipesContainer.innerHTML = '<p class="no-recipes">No saved recipes yet.</p>';
        return;
    }
    
    savedRecipesContainer.innerHTML = '';
    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.innerHTML = `
            <div class="remove-recipe">
                <i class="fas fa-times"></i>
            </div>
            <img src="${recipe.image}" alt="${recipe.title}">
            <div class="recipe-card-content">
                <h3>${recipe.title}</h3>
                <p>
                    <i class="fas fa-clock"></i> ${recipe.readyInMinutes} mins
                    <i class="fas fa-list"></i> ${recipe.extendedIngredients?.length || 0} ingredients
                </p>
            </div>
        `;

        // Add click event for recipe details
        recipeCard.addEventListener('click', (e) => {
            // If clicking the remove button, remove the recipe
            if (e.target.closest('.remove-recipe')) {
                e.stopPropagation(); // Prevent navigation to recipe details
                removeRecipe(recipe.id);
            } else {
                // Otherwise navigate to recipe details
                window.location.href = `recipe.html?id=${recipe.id}`;
            }
        });

        savedRecipesContainer.appendChild(recipeCard);
    });
}

// Event Listeners
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        showPage(page);
        if (page === 'cookbook') {
            displaySavedRecipes();
        }
    });
});

// Update search event listeners
searchBtn.addEventListener('click', () => {
    if (searchInput.value.trim()) {
        searchRecipes(searchInput.value.trim());
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (searchInput.value.trim()) {
            searchRecipes(searchInput.value.trim());
        }
    }
});

saveBtn.addEventListener('click', saveRecipe);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetchRandomRecipes();
});

// Add some CSS styles for search results
const style = document.createElement('style');
style.textContent = `
    .no-results {
        text-align: center;
        padding: 2rem;
        grid-column: 1 / -1;
        color: #666;
    }
    
    .error {
        text-align: center;
        padding: 2rem;
        grid-column: 1 / -1;
        color: #ff6b6b;
    }
    
    .loading {
        text-align: center;
        padding: 2rem;
        grid-column: 1 / -1;
        color: #666;
    }
`;
document.head.appendChild(style); 