class TPManager {
    constructor() {
        this.levelCooldowns = {
            1: 240, 2: 240, 3: 240, 4: 240, 5: 240, 6: 240,
            7: 240, 8: 240, 9: 240, 10: 240, 11: 240, 12: 240,
            13: 240, 14: 240, 15: 240, 16: 240, 17: 240, 18: 240
        };
        
        // 每次加载时重置等级为1
        this.championLevels = {
            0: 1, // 上路
            1: 1, // 打野
            2: 1, // 中路
            3: 1, // 射手
            4: 1  // 辅助
        };

        // 保存初始等级到本地存储
        localStorage.setItem('championLevels', JSON.stringify(this.championLevels));

        // 冷却时间常量
        this.BEFORE_14_MIN_COOLDOWN = 360;  // 14分钟前
        this.AFTER_14_MIN_COOLDOWN = 240;   // 14分钟后（解封的传送）

        this.init();
    }

    // 添加新方法来加载保存的等级
    loadSavedLevels() {
        const savedLevels = localStorage.getItem('championLevels');
        if (savedLevels) {
            this.championLevels = JSON.parse(savedLevels);
        }
    }

    init() {
        this.loadSavedLevels();  // 加载保存的等级
        this.addStyles();
        this.startTimeCheck();
    }

    showLevelControls(rowIndex, spellIndex) {
        const row = document.querySelector(`[data-row="${rowIndex}"]`);
        const spellSelect = row.querySelectorAll('.spell-select')[spellIndex];
        
        // 移除可能存在的旧控件
        const oldControls = spellSelect.querySelector('.level-controls');
        if (oldControls) {
            oldControls.remove();
        }

        // 创建等级控制
        const levelControls = document.createElement('div');
        levelControls.className = 'level-controls';
        levelControls.innerHTML = `
            <button class="level-btn decrease">-</button>
            <span class="level-display">${this.championLevels[rowIndex] || 1}</span>
            <button class="level-btn increase">+</button>
        `;

        // 添加到技能选择区域
        spellSelect.appendChild(levelControls);

        // 阻止事件冒泡
        levelControls.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 添加事件监听
        this.addLevelControlListeners(levelControls, rowIndex);
    }

    addLevelControlListeners(controls, rowIndex) {
        const display = controls.querySelector('.level-display');
        const decreaseBtn = controls.querySelector('.decrease');
        const increaseBtn = controls.querySelector('.increase');

        decreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.championLevels[rowIndex] > 1) {
                this.championLevels[rowIndex]--;
                display.textContent = this.championLevels[rowIndex];
                this.updateTPCooldown(rowIndex);
            }
        });

        increaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.championLevels[rowIndex] < 18) {
                this.championLevels[rowIndex]++;
                display.textContent = this.championLevels[rowIndex];
                this.updateTPCooldown(rowIndex);
            }
        });
    }

    hideLevelControls(rowIndex, spellIndex) {
        const row = document.querySelector(`[data-row="${rowIndex}"]`);
        if (!row) return;
        
        const spellSelect = row.querySelectorAll('.spell-select')[spellIndex];
        if (!spellSelect) return;
        
        const levelControls = spellSelect.querySelector('.level-controls');
        if (levelControls) {
            levelControls.remove();
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .level-controls {
                position: absolute;
                bottom: -30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                padding: 2px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 4px;
                z-index: 100;
            }
            
            .spell-select {
                position: relative;
            }
            
            .level-btn {
                width: 24px;
                height: 24px;
                border: 1px solid #ccc;
                background: #fff;
                cursor: pointer;
                border-radius: 3px;
                font-weight: bold;
                color: #333;
            }
            
            .level-btn:hover {
                background: #eee;
                border-color: #999;
            }
            
            .level-btn:active {
                background: #ddd;
            }
            
            .level-display {
                min-width: 20px;
                text-align: center;
                font-weight: bold;
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }

    getTPCooldown(rowIndex) {
        const gameMinutes = parseInt(document.getElementById('minutes').textContent);
        
        if (gameMinutes < 14) {
            // 14分钟前固定360秒
            return this.BEFORE_14_MIN_COOLDOWN;
        } else {
            // 14分钟后根据等级返回对应冷却时间
            const level = this.championLevels[rowIndex];
            return this.levelCooldowns[level];
        }
    }

    updateTPCooldown(rowIndex) {
        const row = document.querySelector(`[data-row="${rowIndex}"]`);
        const spellSelects = row.querySelectorAll('.spell-select');
        const gameMinutes = parseInt(document.getElementById('minutes').textContent);
        
        spellSelects.forEach((spellSelect, index) => {
            const img = spellSelect.querySelector('img');
            if (img && (img.alt === '传送' || img.alt === '解封的传送')) {
                const triggerBtn = row.querySelector(`.trigger-btn.spell${index + 1}`);
                const cooldown = this.getTPCooldown(rowIndex);
                triggerBtn.dataset.cooldown = cooldown;
                
                // 更新技能名称和提示
                if (gameMinutes >= 14) {
                    img.alt = '解封的传送';
                    triggerBtn.title = `解封的传送 (${cooldown}秒)`;  // 添加冷却时间提示
                } else {
                    img.alt = '传送';
                    triggerBtn.title = `传送 (${cooldown}秒)`;  // 添加冷却时间提示
                }
            }
        });
    }

    startTimeCheck() {
        setInterval(() => {
            const minutes = parseInt(document.getElementById('minutes').textContent);
            if (minutes >= 14) {
                this.updateAllTPNames();
            }
        }, 1000);
    }

    updateAllTPNames() {
        document.querySelectorAll('.champion-row').forEach(row => {
            const spellSelects = row.querySelectorAll('.spell-select');
            spellSelects.forEach((spellSelect, index) => {
                const img = spellSelect.querySelector('img');
                if (img && img.alt === '传送') {
                    img.alt = '解封的传送';
                    const triggerBtn = row.querySelector(`.trigger-btn.spell${index + 1}`);
                    if (triggerBtn) {
                        triggerBtn.title = '解封的传送';
                    }
                }
            });
        });
    }
}

// 导出 TPManager 类
window.TPManager = TPManager; 