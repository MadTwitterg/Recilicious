class ThemeManager {
    constructor() {
        this.THEME_KEY = 'recilicious-theme';
        this.isDark = localStorage.getItem(this.THEME_KEY) === 'dark';
        this.init();
    }

    init() {
        const navLinks = document.querySelector('.nav-links');
        const themeButton = document.createElement('button');
        themeButton.className = 'theme-toggle';
        themeButton.innerHTML = this.isDark ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        
        themeButton.addEventListener('click', () => {
            themeButton.classList.add('spinning');
            
            setTimeout(() => {
                themeButton.classList.remove('spinning');
            }, 500);

            this.toggleTheme();
        });
        
        navLinks.appendChild(themeButton);
        this.applyTheme();
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        localStorage.setItem(this.THEME_KEY, this.isDark ? 'dark' : 'light');
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.classList.toggle('dark-theme', this.isDark);
        
        const themeButton = document.querySelector('.theme-toggle');
        if (themeButton) {
            themeButton.innerHTML = this.isDark ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
        }
    }
}

const themeManager = new ThemeManager();
export default themeManager; 