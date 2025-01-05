class AutoCopy {
    constructor(copyCallback) {
        this.copyCallback = copyCallback;
        this.interval = null;
        this.checkbox = document.getElementById('auto-copy-toggle');
        this.select = document.getElementById('auto-copy-interval');
        
        // 设置默认值
        this.select.value = "2";
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        this.checkbox.addEventListener('change', () => {
            this.select.disabled = !this.checkbox.checked;
            this.handleAutoCopyChange();
        });

        this.select.addEventListener('change', () => {
            if (this.checkbox.checked) {
                this.start(this.select.value);
            }
            this.saveSettings();
        });
    }

    start(seconds) {
        this.stop();
        this.copyCallback();
        this.interval = setInterval(() => {
            try {
                this.copyCallback();
            } catch (error) {
                console.error('自动复制失败:', error);
                this.handleError();
            }
        }, seconds * 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    handleError() {
        this.stop();
        this.checkbox.checked = false;
        this.select.disabled = true;
        this.saveSettings();
    }

    handleAutoCopyChange() {
        if (this.checkbox.checked) {
            this.start(this.select.value);
        } else {
            this.stop();
        }
        this.saveSettings();
    }

    saveSettings() {
        const settings = {
            enabled: this.checkbox.checked,
            interval: this.select.value
        };
        localStorage.setItem('autoCopySettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('autoCopySettings'));
            if (settings) {
                this.checkbox.checked = settings.enabled;
                this.select.value = settings.interval;
                this.select.disabled = !settings.enabled;
                if (settings.enabled) {
                    this.start(settings.interval);
                }
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            this.handleError();
        }
    }

    updateCopyButtonText(copyBtn, originalText) {
        copyBtn.textContent = '复制成功！';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }
} 