class RecipeService {
    constructor() {
        this.baseUrl = 'https://api.spoonacular.com/recipes';
        this.apiKey = '7ce8bc690e6c4cfda09573a1ab408b61';
    }

    async getRandomRecipes(count = 12) {
        try {
            const response = await fetch(
                `${this.baseUrl}/random?apiKey=${this.apiKey}&number=${count}&addRecipeInformation=true`
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error('Failed to fetch recipes');
            }
            
            const data = await response.json();
            return data.recipes;
        } catch (error) {
            console.error('Error fetching random recipes:', error);
            throw error;
        }
    }

    async getRecipeById(id) {
        try {
            const response = await fetch(
                `${this.baseUrl}/${id}/information?apiKey=${this.apiKey}`
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error('Recipe not found');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching recipe details:', error);
            throw error;
        }
    }

    async searchRecipes(query, limit = 12) {
        try {
            const response = await fetch(
                `${this.baseUrl}/complexSearch?apiKey=${this.apiKey}&query=${encodeURIComponent(query)}&number=${limit}&addRecipeInformation=true`
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error('Failed to search recipes');
            }
            
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error('Error searching recipes:', error);
            throw error;
        }
    }
}

export const recipeService = new RecipeService(); 