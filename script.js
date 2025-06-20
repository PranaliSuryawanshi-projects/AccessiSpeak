class AccessibilityTextToSpeech {
    constructor() {
        this.speech = new SpeechSynthesisUtterance();
        this.voices = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.currentText = '';
        this.startTime = 0;
        this.totalDuration = 0;
        this.stats = this.loadStats();
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadVoices();
        this.setupSpeechEvents();
        this.setupAccessibilityFeatures();
        this.updateStatsDisplay();
    }

    initializeElements() {
        // Text input elements
        this.textInput = document.getElementById('textInput');
        this.charCount = document.getElementById('charCount');
        this.wordCount = document.getElementById('wordCount');
        this.readingTime = document.getElementById('readingTime');
        
        // Control elements
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speedRange = document.getElementById('speedRange');
        this.pitchRange = document.getElementById('pitchRange');
        this.volumeRange = document.getElementById('volumeRange');
        this.speedValue = document.getElementById('speedValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.volumeValue = document.getElementById('volumeValue');
        
        // Button elements
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.fileInput = document.getElementById('fileInput');
        
        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.timeRemaining = document.getElementById('timeRemaining');
        
        // Modal elements
        this.shortcutsModal = document.getElementById('shortcutsModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.keyboardShortcuts = document.getElementById('keyboardShortcuts');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeModal = document.getElementById('closeModal');
        this.closeSettingsModal = document.getElementById('closeSettingsModal');
        
        // Stats elements
        this.totalReads = document.getElementById('totalReads');
        this.totalTime = document.getElementById('totalTime');
        this.totalWords = document.getElementById('totalWords');
        this.favoriteVoice = document.getElementById('favoriteVoice');
        
        // Settings elements
        this.autoPlay = document.getElementById('autoPlay');
        this.highlightText = document.getElementById('highlightText');
        this.saveStats = document.getElementById('saveStats');
        this.darkMode = document.getElementById('darkMode');
        this.resetStats = document.getElementById('resetStats');
        
        // Notification container
        this.notificationContainer = document.getElementById('notificationContainer');
    }

    setupEventListeners() {
        // Text input events
        this.textInput.addEventListener('input', () => this.updateTextStats());
        this.textInput.addEventListener('paste', () => {
            setTimeout(() => {
                this.updateTextStats();
                if (this.autoPlay.checked) {
                    setTimeout(() => this.toggleSpeech(), 500);
                }
            }, 10);
        });

        // Voice and control events
        this.voiceSelect.addEventListener('change', () => this.changeVoice());
        this.speedRange.addEventListener('input', () => this.updateSpeed());
        this.pitchRange.addEventListener('input', () => this.updatePitch());
        this.volumeRange.addEventListener('input', () => this.updateVolume());

        // Button events
        this.playBtn.addEventListener('click', () => this.toggleSpeech());
        this.pauseBtn.addEventListener('click', () => this.pauseSpeech());
        this.stopBtn.addEventListener('click', () => this.stopSpeech());
        this.clearBtn.addEventListener('click', () => this.clearText());
        this.pasteBtn.addEventListener('click', () => this.pasteText());
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.saveBtn.addEventListener('click', () => this.saveTextToFile());
        this.downloadBtn.addEventListener('click', () => this.showNotification('Audio download feature coming soon!', 'info'));
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Quick action buttons
        document.querySelectorAll('.quick-btn[data-text]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.currentTarget.getAttribute('data-text');
                this.textInput.value = text;
                this.updateTextStats();
                this.showNotification('Sample text loaded', 'success');
            });
        });

        // Modal events
        this.keyboardShortcuts.addEventListener('click', () => this.showShortcutsModal());
        this.settingsBtn.addEventListener('click', () => this.showSettingsModal());
        this.closeModal.addEventListener('click', () => this.hideShortcutsModal());
        this.closeSettingsModal.addEventListener('click', () => this.hideSettingsModal());
        
        // Modal backdrop clicks
        this.shortcutsModal.addEventListener('click', (e) => {
            if (e.target === this.shortcutsModal) this.hideShortcutsModal();
        });
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.hideSettingsModal();
        });

        // Settings events
        this.resetStats.addEventListener('click', () => this.resetStatistics());
        this.saveStats.addEventListener('change', () => this.saveSettings());
        this.autoPlay.addEventListener('change', () => this.saveSettings());
        this.highlightText.addEventListener('change', () => this.saveSettings());

        // Social buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const title = e.currentTarget.getAttribute('title');
                this.showNotification(`${title} feature coming soon!`, 'info');
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    loadVoices() {
        const loadVoicesHandler = () => {
            this.voices = window.speechSynthesis.getVoices();
            if (this.voices.length > 0) {
                this.populateVoiceList();
                // Set default voice (prefer English voices)
                const englishVoice = this.voices.find(voice => 
                    voice.lang.startsWith('en') && voice.default
                ) || this.voices.find(voice => voice.lang.startsWith('en')) || this.voices[0];
                
                if (englishVoice) {
                    const index = this.voices.indexOf(englishVoice);
                    this.voiceSelect.value = index;
                    this.speech.voice = englishVoice;
                }
            } else {
                setTimeout(loadVoicesHandler, 100);
            }
        };

        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoicesHandler;
        }
        loadVoicesHandler();
    }

    populateVoiceList() {
        this.voiceSelect.innerHTML = '';
        
        // Group voices by language
        const voicesByLang = {};
        this.voices.forEach((voice, index) => {
            const lang = voice.lang.split('-')[0];
            if (!voicesByLang[lang]) {
                voicesByLang[lang] = [];
            }
            voicesByLang[lang].push({ voice, index });
        });

        // Add voices to select, prioritizing English
        const sortedLangs = Object.keys(voicesByLang).sort((a, b) => {
            if (a === 'en') return -1;
            if (b === 'en') return 1;
            return a.localeCompare(b);
        });

        sortedLangs.forEach(lang => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = this.getLanguageName(lang);
            
            voicesByLang[lang].forEach(({ voice, index }) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name}${voice.default ? ' (Default)' : ''}`;
                optgroup.appendChild(option);
            });
            
            this.voiceSelect.appendChild(optgroup);
        });
    }

    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi'
        };
        return languages[code] || code.toUpperCase();
    }

    setupSpeechEvents() {
        this.speech.onstart = () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.updateUI();
            this.showProgress();
            this.updateProgressText('Reading...');
            this.showNotification('Started reading', 'info');
        };

        this.speech.onend = () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.updateUI();
            this.hideProgress();
            this.updateProgressText('Finished reading');
            this.showNotification('Finished reading', 'success');
            this.updateStats();
        };

        this.speech.onerror = (event) => {
            console.error('Speech error:', event.error);
            this.isPlaying = false;
            this.isPaused = false;
            this.updateUI();
            this.hideProgress();
            this.showNotification(`Error: ${event.error}`, 'error');
        };

        this.speech.onpause = () => {
            this.isPaused = true;
            this.updateUI();
            this.updateProgressText('Paused');
            this.showNotification('Reading paused', 'info');
        };

        this.speech.onresume = () => {
            this.isPaused = false;
            this.updateUI();
            this.updateProgressText('Reading...');
            this.showNotification('Reading resumed', 'info');
        };
    }

    setupAccessibilityFeatures() {
        // Add ARIA live region for screen readers
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;

        // Load settings
        this.loadSettings();
    }

    updateTextStats() {
        const text = this.textInput.value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const readingTime = Math.ceil(wordCount / 200); // Average reading speed

        this.charCount.textContent = charCount;
        this.wordCount.textContent = wordCount;
        this.readingTime.textContent = readingTime;

        // Update character count color based on length
        if (charCount > 1000) {
            this.charCount.style.color = '#ef4444';
        } else if (charCount > 500) {
            this.charCount.style.color = '#f59e0b';
        } else {
            this.charCount.style.color = '#64748b';
        }
    }

    changeVoice() {
        const selectedIndex = this.voiceSelect.value;
        if (this.voices[selectedIndex]) {
            this.speech.voice = this.voices[selectedIndex];
            this.showNotification(`Voice changed to ${this.voices[selectedIndex].name}`, 'info');
            
            // Update favorite voice in stats
            if (this.saveStats.checked) {
                this.stats.voiceUsage[this.voices[selectedIndex].name] = 
                    (this.stats.voiceUsage[this.voices[selectedIndex].name] || 0) + 1;
                this.updateFavoriteVoice();
                this.saveStatsToStorage();
            }
        }
    }

    updateSpeed() {
        const speed = parseFloat(this.speedRange.value);
        this.speech.rate = speed;
        this.speedValue.textContent = `${speed}x`;
    }

    updatePitch() {
        const pitch = parseFloat(this.pitchRange.value);
        this.speech.pitch = pitch;
        this.pitchValue.textContent = `${pitch}x`;
    }

    updateVolume() {
        const volume = parseFloat(this.volumeRange.value);
        this.speech.volume = volume;
        this.volumeValue.textContent = `${Math.round(volume * 100)}%`;
    }

    toggleSpeech() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showNotification('Please enter some text to read', 'error');
            this.textInput.focus();
            return;
        }

        if (this.isPlaying) {
            if (this.isPaused) {
                this.resumeSpeech();
            } else {
                this.pauseSpeech();
            }
        } else {
            this.startSpeech(text);
        }
    }

    startSpeech(text) {
        window.speechSynthesis.cancel();
        
        this.currentText = text;
        this.speech.text = text;
        this.speech.rate = parseFloat(this.speedRange.value);
        this.speech.pitch = parseFloat(this.pitchRange.value);
        this.speech.volume = parseFloat(this.volumeRange.value);
        
        // Estimate total duration (rough calculation)
        const wordsPerMinute = 150 * this.speech.rate;
        const wordCount = text.trim().split(/\s+/).length;
        this.totalDuration = (wordCount / wordsPerMinute) * 60 * 1000;
        
        window.speechSynthesis.speak(this.speech);
        this.announceToScreenReader('Started reading text');
    }

    pauseSpeech() {
        if (this.isPlaying && !this.isPaused) {
            window.speechSynthesis.pause();
            this.announceToScreenReader('Reading paused');
        }
    }

    resumeSpeech() {
        if (this.isPlaying && this.isPaused) {
            window.speechSynthesis.resume();
            this.announceToScreenReader('Reading resumed');
        }
    }

    stopSpeech() {
        window.speechSynthesis.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.updateUI();
        this.hideProgress();
        this.announceToScreenReader('Reading stopped');
        this.showNotification('Reading stopped', 'info');
    }

    clearText() {
        this.textInput.value = '';
        this.updateTextStats();
        this.textInput.focus();
        this.showNotification('Text cleared', 'info');
    }

    async pasteText() {
        try {
            const text = await navigator.clipboard.readText();
            this.textInput.value = text;
            this.updateTextStats();
            this.showNotification('Text pasted from clipboard', 'success');
        } catch (err) {
            this.showNotification('Unable to paste from clipboard', 'error');
        }
    }

    saveTextToFile() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.showNotification('No text to save', 'error');
            return;
        }

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessispeak-text-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Text saved to file', 'success');
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/plain') {
            this.showNotification('Please select a text file (.txt)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.textInput.value = e.target.result;
            this.updateTextStats();
            this.showNotification(`File "${file.name}" loaded successfully`, 'success');
        };
        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };
        reader.readAsText(file);
    }

    updateUI() {
        // Update play button
        const playIcon = this.playBtn.querySelector('.material-icons');
        const playText = this.playBtn.querySelector('span:last-child');
        
        if (this.isPlaying) {
            if (this.isPaused) {
                playIcon.textContent = 'play_arrow';
                playText.textContent = 'Resume';
                this.playBtn.setAttribute('aria-label', 'Resume reading');
            } else {
                playIcon.textContent = 'pause';
                playText.textContent = 'Pause';
                this.playBtn.setAttribute('aria-label', 'Pause reading');
            }
        } else {
            playIcon.textContent = 'play_arrow';
            playText.textContent = 'Start Reading';
            this.playBtn.setAttribute('aria-label', 'Start reading');
        }

        // Update button states
        this.pauseBtn.disabled = !this.isPlaying;
        this.stopBtn.disabled = !this.isPlaying;
    }

    showProgress() {
        this.progressSection.style.display = 'block';
        this.startProgressTracking();
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
        this.stopProgressTracking();
    }

    startProgressTracking() {
        this.progressInterval = setInterval(() => {
            if (this.isPlaying && !this.isPaused) {
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min((elapsed / this.totalDuration) * 100, 100);
                this.progressFill.style.width = `${progress}%`;
                
                const remaining = Math.max(0, this.totalDuration - elapsed);
                const remainingMinutes = Math.floor(remaining / 60000);
                const remainingSeconds = Math.floor((remaining % 60000) / 1000);
                this.timeRemaining.textContent = `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')} remaining`;
            }
        }, 100);
    }

    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        this.progressFill.style.width = '0%';
        this.timeRemaining.textContent = '';
    }

    updateProgressText(text) {
        this.progressText.textContent = text;
    }

    showShortcutsModal() {
        this.shortcutsModal.style.display = 'flex';
        this.closeModal.focus();
    }

    hideShortcutsModal() {
        this.shortcutsModal.style.display = 'none';
        this.keyboardShortcuts.focus();
    }

    showSettingsModal() {
        this.settingsModal.style.display = 'flex';
        this.closeSettingsModal.focus();
    }

    hideSettingsModal() {
        this.settingsModal.style.display = 'none';
        this.settingsBtn.focus();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = type === 'success' ? 'check_circle' : 
                          type === 'error' ? 'error' : 'info';
        
        const text = document.createElement('span');
        text.textContent = message;
        
        notification.appendChild(icon);
        notification.appendChild(text);
        
        this.notificationContainer.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    announceToScreenReader(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
        }
    }

    // Statistics Management
    loadStats() {
        const defaultStats = {
            totalReads: 0,
            totalTimeListened: 0,
            totalWordsRead: 0,
            voiceUsage: {},
            sessionsCount: 0
        };

        try {
            const saved = localStorage.getItem('accessispeak-stats');
            return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
        } catch {
            return defaultStats;
        }
    }

    saveStatsToStorage() {
        if (this.saveStats.checked) {
            localStorage.setItem('accessispeak-stats', JSON.stringify(this.stats));
        }
    }

    updateStats() {
        if (!this.saveStats.checked) return;

        const wordCount = this.currentText.trim().split(/\s+/).length;
        const timeListened = Math.floor((Date.now() - this.startTime) / 1000);

        this.stats.totalReads++;
        this.stats.totalTimeListened += timeListened;
        this.stats.totalWordsRead += wordCount;

        this.updateStatsDisplay();
        this.saveStatsToStorage();
    }

    updateStatsDisplay() {
        this.totalReads.textContent = this.stats.totalReads;
        this.totalWords.textContent = this.stats.totalWordsRead;
        
        const minutes = Math.floor(this.stats.totalTimeListened / 60);
        this.totalTime.textContent = `${minutes}m`;
        
        this.updateFavoriteVoice();
    }

    updateFavoriteVoice() {
        const voiceUsage = this.stats.voiceUsage;
        const mostUsed = Object.keys(voiceUsage).reduce((a, b) => 
            voiceUsage[a] > voiceUsage[b] ? a : b, Object.keys(voiceUsage)[0]);
        
        this.favoriteVoice.textContent = mostUsed || '-';
    }

    resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            this.stats = {
                totalReads: 0,
                totalTimeListened: 0,
                totalWordsRead: 0,
                voiceUsage: {},
                sessionsCount: 0
            };
            this.updateStatsDisplay();
            this.saveStatsToStorage();
            this.showNotification('Statistics reset successfully', 'success');
        }
    }

    // Settings Management
    loadSettings() {
        try {
            const settings = localStorage.getItem('accessispeak-settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.autoPlay.checked = parsed.autoPlay || false;
                this.highlightText.checked = parsed.highlightText || false;
                this.saveStats.checked = parsed.saveStats !== false; // Default true
                this.darkMode.checked = parsed.darkMode || false;
            }
        } catch {
            // Use defaults
        }
    }

    saveSettings() {
        const settings = {
            autoPlay: this.autoPlay.checked,
            highlightText: this.highlightText.checked,
            saveStats: this.saveStats.checked,
            darkMode: this.darkMode.checked
        };
        localStorage.setItem('accessispeak-settings', JSON.stringify(settings));
        this.showNotification('Settings saved', 'success');
    }

    handleKeyboardShortcuts(e) {
        // Don't trigger shortcuts when typing in textarea
        if (e.target === this.textInput && !['Escape', 'Enter'].includes(e.code)) {
            return;
        }

        switch (e.code) {
            case 'Space':
                if (e.target !== this.textInput) {
                    e.preventDefault();
                    this.toggleSpeech();
                }
                break;
            case 'Escape':
                this.stopSpeech();
                if (this.shortcutsModal.style.display === 'flex') {
                    this.hideShortcutsModal();
                }
                if (this.settingsModal.style.display === 'flex') {
                    this.hideSettingsModal();
                }
                break;
            case 'Enter':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.toggleSpeech();
                }
                break;
            case 'KeyS':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.saveTextToFile();
                }
                break;
            case 'ArrowUp':
                if (e.target !== this.textInput) {
                    e.preventDefault();
                    const newSpeed = Math.min(2, parseFloat(this.speedRange.value) + 0.1);
                    this.speedRange.value = newSpeed;
                    this.updateSpeed();
                }
                break;
            case 'ArrowDown':
                if (e.target !== this.textInput) {
                    e.preventDefault();
                    const newSpeed = Math.max(0.5, parseFloat(this.speedRange.value) - 0.1);
                    this.speedRange.value = newSpeed;
                    this.updateSpeed();
                }
                break;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AccessibilityTextToSpeech();
});

// Add service worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker would be implemented here for offline functionality
        console.log('AccessiSpeak loaded successfully');
    });
}