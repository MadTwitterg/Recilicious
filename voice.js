class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.voiceButton = document.getElementById('voiceButton');
        this.searchInput = document.getElementById('searchInput');
        
        this.initializeRecognition();
        this.setupEventListeners();
    }

    initializeRecognition() {
        // Check for browser support
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.setupRecognitionOptions();
        } else {
            console.error('Speech recognition not supported');
            this.voiceButton.style.display = 'none';
        }
    }

    setupRecognitionOptions() {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        // Handle results
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.searchInput.value = transcript;
            // Trigger search
            document.getElementById('searchButton').click();
        };

        // Handle errors
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopRecording();
            
            // Show fun error message
            const searchInput = document.getElementById('searchInput');
            searchInput.placeholder = "Oops! My ears aren't working right now 🎤";
            
            setTimeout(() => {
                searchInput.placeholder = "Search recipes...";
            }, 3000);
        };

        // Handle end of recording
        this.recognition.onend = () => {
            this.stopRecording();
        };
    }

    setupEventListeners() {
        this.voiceButton.addEventListener('click', () => {
            if (!this.isRecording) {
                this.startRecording();
            } else {
                this.stopRecording();
            }
        });
    }

    startRecording() {
        try {
            this.recognition.start();
            this.isRecording = true;
            this.voiceButton.classList.add('recording');
            
            // Add spin effect when starting
            this.voiceButton.classList.add('spinning');
            setTimeout(() => {
                this.voiceButton.classList.remove('spinning');
            }, 500);
            
            this.voiceButton.querySelector('i').className = 'fas fa-stop';
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }

    stopRecording() {
        try {
            this.recognition.stop();
            this.isRecording = false;
            this.voiceButton.classList.remove('recording');
            
            // Add spin effect when stopping
            this.voiceButton.classList.add('spinning');
            setTimeout(() => {
                this.voiceButton.classList.remove('spinning');
            }, 500);
            
            this.voiceButton.querySelector('i').className = 'fas fa-microphone';
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    }
}

// Initialize voice recognition when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceRecognition();
});

export default VoiceRecognition; 