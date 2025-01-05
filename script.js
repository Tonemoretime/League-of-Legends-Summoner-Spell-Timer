class Timer {
    constructor() {
        this.settings = {
            positionFormat: localStorage.getItem('positionFormat') || 'full',
            spellFormat: localStorage.getItem('spellFormat') || 'full',
            timeFormat: localStorage.getItem('timeFormat') || 'remaining'
        };
        this.savedSpells = JSON.parse(localStorage.getItem('savedSpells')) || {
            0: { spell1: null, spell2: null }, // 上路
            1: { spell1: null, spell2: null }, // 打野
            2: { spell1: null, spell2: null }, // 中路
            3: { spell1: null, spell2: null }, // 射手
            4: { spell1: null, spell2: null }  // 辅助
        };
        this.data = {
            positions: positionsData,
            spells: summonerSpellsData,
            runesItems: runesItemsData
        };
        this.activeTimers = new Map();
        this.gameStartTime = Date.now();
        this.timerInterval = null;
        this.gameTimeOffset = 0;
        this.isEditing = false;
        this.autoCopy = null;
        this.voiceManager = null;
        this.tpManager = new TPManager();
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.startGameTimer();
        this.loadSavedSpells();
        this.updatePositionDisplays();
        this.autoCopy = new AutoCopy(() => this.copyTimers());
        this.voiceManager = new VoiceManager();
    }

    setupEventListeners() {
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAddButton(e));
        });

        document.querySelectorAll('.clear-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleClearButton(e));
        });

        document.querySelectorAll('.trigger-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTriggerButton(e));
        });

        document.querySelectorAll('.modifier-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleModifier(e));
        });

        document.getElementById('copy-timers').addEventListener('click', () => this.copyTimers());

        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTimeAdjust(e));
        });

        document.querySelector('.confirm-time-btn').addEventListener('click', () => this.confirmTimeAdjust());

        document.querySelectorAll('.timer-adjust-btns .adjust-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTimerAdjustment(e));
        });

        // 设置下拉框的初始值
        document.getElementById('position-format').value = this.settings.positionFormat;
        document.getElementById('spell-format').value = this.settings.spellFormat;
        document.getElementById('time-format').value = this.settings.timeFormat;

        document.getElementById('position-format').addEventListener('change', (e) => {
            this.settings.positionFormat = e.target.value;
            localStorage.setItem('positionFormat', e.target.value);
            this.updatePositionDisplays();
        });

        document.getElementById('spell-format').addEventListener('change', (e) => {
            this.settings.spellFormat = e.target.value;
            localStorage.setItem('spellFormat', e.target.value);
        });

        document.getElementById('time-format').addEventListener('change', (e) => {
            this.settings.timeFormat = e.target.value;
            localStorage.setItem('timeFormat', e.target.value);
        });

        // 添加固定时间点按钮的事件监听
        document.querySelectorAll('.game-time-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTimePreset(e));
        });
    }

    handleAddButton(event) {
        const button = event.target;
        const parent = button.parentElement;
        const isPosition = parent.classList.contains('lane-display');
        const modal = document.querySelector('.modal');
        
        this.showModal(isPosition ? this.data.positions : this.data.spells, (selected) => {
            const img = parent.querySelector('img');
            img.src = `data/images/${selected.image}`;
            img.alt = selected.name;
            img.classList.remove('hidden');
            button.classList.add('hidden');
            parent.querySelector('.clear-btn').classList.remove('hidden');
            
            if (!isPosition) {
                const row = parent.closest('.champion-row');
                const spellIndex = Array.from(row.querySelectorAll('.spell-select')).indexOf(parent);
                const triggerBtn = row.querySelector(`.trigger-btn.spell${spellIndex + 1}`);
                triggerBtn.querySelector('.trigger-icon').src = `data/images/${selected.image}`;
                triggerBtn.disabled = false;
                triggerBtn.dataset.cooldown = selected.cooldown;
                
                // 保存选择的召唤师技能
                const rowIndex = row.dataset.row;
                this.savedSpells[rowIndex] = this.savedSpells[rowIndex] || {};
                this.savedSpells[rowIndex][`spell${spellIndex + 1}`] = selected;
                localStorage.setItem('savedSpells', JSON.stringify(this.savedSpells));

                // 如果选择的是传送，显示等级控制
                if (selected.name === '传送') {
                    this.tpManager.showLevelControls(rowIndex, spellIndex);
                } else {
                    this.tpManager.hideLevelControls(rowIndex, spellIndex);
                }
            }
            modal.classList.add('hidden');
        });
    }

    handleClearButton(event) {
        const button = event.target;
        const parent = button.parentElement;
        const img = parent.querySelector('img');
        const addBtn = parent.querySelector('.add-btn');
        
        img.src = '';
        img.classList.add('hidden');
        addBtn.classList.remove('hidden');
        button.classList.add('hidden');
        
        if (parent.classList.contains('spell-select')) {
            const row = parent.closest('.champion-row');
            const spellIndex = Array.from(row.querySelectorAll('.spell-select')).indexOf(parent);
            const timerDisplay = row.querySelector(`.timer${spellIndex + 1}`);
            timerDisplay.textContent = '';
            timerDisplay.style.backgroundImage = '';
            timerDisplay.classList.remove('active');
            
            // 清除计时器
            const timerKey = `${row.dataset.row}-${spellIndex}`;
            if (this.activeTimers.has(timerKey)) {
                clearInterval(this.activeTimers.get(timerKey));
                this.activeTimers.delete(timerKey);
            }

            // 清除开始和结束时间显示
            row.querySelector(`.start-time${spellIndex + 1}`).textContent = '';
            row.querySelector(`.finish-time${spellIndex + 1}`).textContent = '';
            
            // 隐藏调整按钮
            const adjustBtns = row.querySelectorAll('.timer-adjust-btns')[spellIndex];
            adjustBtns.classList.remove('active');

            // 清除保存的召唤师技能
            const rowIndex = row.dataset.row;
            if (this.savedSpells[rowIndex]) {
                this.savedSpells[rowIndex][`spell${spellIndex + 1}`] = null;
                localStorage.setItem('savedSpells', JSON.stringify(this.savedSpells));
            }

            this.tpManager.hideLevelControls(rowIndex, spellIndex);
        }
    }

    showModal(items, callback) {
        const modal = document.querySelector('.modal');
        const grid = modal.querySelector('.selection-grid');
        const searchInput = modal.querySelector('input');
        
        // 清空并重新填充选择网格
        grid.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.innerHTML = `<img src="data/images/${item.image}" alt="${item.name}">`;
            div.title = item.name;
            div.addEventListener('click', () => {
                callback(item);
                modal.classList.add('hidden');  // 确保模态框隐藏
                searchInput.value = '';
                Array.from(grid.children).forEach(div => div.style.display = 'block');
            });
            grid.appendChild(div);
        });

        // 显示模态框
        modal.classList.remove('hidden');
        searchInput.value = '';
        searchInput.focus();

        // 添加点击事件监听器来关闭模态框
        const handleModalClick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                searchInput.value = '';
                Array.from(grid.children).forEach(div => div.style.display = 'block');
            }
        };
        
        modal.addEventListener('click', handleModalClick);
    }

    startTimer(row, spellIndex, cooldown) {
        const timerKey = `${row}-${spellIndex}`;
        const championRow = document.querySelector(`[data-row="${row}"]`);
        const timerDisplay = championRow.querySelector(`.timer${spellIndex + 1}`);
        
        if (this.activeTimers.has(timerKey)) {
            clearInterval(this.activeTimers.get(timerKey));
            timerDisplay.textContent = '';
            timerDisplay.style.backgroundImage = '';
            timerDisplay.classList.remove('active');
        }

        const startTimeDisplay = championRow.querySelector(`.start-time${spellIndex + 1}`);
        const finishTimeDisplay = championRow.querySelector(`.finish-time${spellIndex + 1}`);
        const adjustBtns = championRow.querySelectorAll('.timer-adjust-btns')[spellIndex];
        
        // 获取当前游戏时间
        const currentMinutes = parseInt(document.getElementById('minutes').textContent);
        const currentSeconds = parseInt(document.getElementById('seconds').textContent);
        const startTime = Date.now();  // 添加这行，记录开始时间
        
        // 使用游戏时间作为开始时间
        startTimeDisplay.textContent = `开始 ${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')}`;
        
        // 获取技能图片并设置背景
        const spellSelect = championRow.querySelectorAll('.spell-select')[spellIndex];
        const spellImg = spellSelect.querySelector('img');
        const spellImgSrc = spellImg.src;
        timerDisplay.style.backgroundImage = `url(${spellImgSrc})`;
        timerDisplay.classList.add('active');
        
        // 显示调整按钮
        adjustBtns.classList.add('active');
        
        // 计算结束时间
        const totalSeconds = currentMinutes * 60 + currentSeconds + cooldown;
        const finishMinutes = Math.floor(totalSeconds / 60);
        const finishSeconds = totalSeconds % 60;
        finishTimeDisplay.textContent = `结束 ${finishMinutes.toString().padStart(2, '0')}:${finishSeconds.toString().padStart(2, '0')}`;

        // 获取位置和技能信息用于语音提示
        const positionSpan = championRow.querySelector('.lane-display span');
        const positionData = this.data.positions.find(p => p.name === positionSpan.dataset.fullName);
        const spellData = this.data.spells.find(s => {
            const imagePath = spellImg.src.split('/');
            return s.image === imagePath[imagePath.length - 1];
        });
        
        // 设置计时器
        const interval = setInterval(() => {
            const currentTime = Math.floor((Date.now() - startTime) / 1000);
            const remainingTime = cooldown - currentTime;
            
            if (remainingTime <= 0) {
                // 播放就绪提示音
                if (this.voiceManager && positionData && spellData) {
                    const position = this.getPositionName(positionData);
                    const spell = this.getSpellName(spellData);
                    this.voiceManager.playVoiceSequence(position, spell, 'ready');
                }
                clearInterval(interval);
                timerDisplay.textContent = '';
                timerDisplay.style.backgroundImage = '';
                timerDisplay.classList.remove('active');
                finishTimeDisplay.textContent = '';
                startTimeDisplay.textContent = '';
                adjustBtns.classList.remove('active');
                this.activeTimers.delete(timerKey);
            } else {
                timerDisplay.textContent = `${remainingTime}s`;
                // 30秒提醒
                if (remainingTime === 30 && this.voiceManager && positionData && spellData) {
                    const position = this.getPositionName(positionData);
                    const spell = this.getSpellName(spellData);
                    this.voiceManager.playVoiceSequence(position, spell, '30s');
                }
            }
        }, 1000);
        
        this.activeTimers.set(timerKey, interval);
    }

    calculateTotalHaste(row) {
        let totalHaste = 0;
        const modifiers = row.querySelectorAll('.modifier-btn[data-active="true"]');
        modifiers.forEach(modifier => {
            const type = modifier.classList.contains('rune') ? 'rune' : 'item';
            const item = this.data.runesItems.find(i => i.type === type);
            if (item) {
                totalHaste += item.haste;
            }
        });
        return totalHaste;
    }

    async copyTimers() {
        if (!this.autoCopy) {
            console.error('AutoCopy not initialized');
            return;
        }

        const timers = [];
        const format = document.getElementById('copy-format').value;
        const copyBtn = document.getElementById('copy-timers');
        const originalText = copyBtn.textContent;
        
        document.querySelectorAll('.champion-row').forEach(row => {
            const positionSpan = row.querySelector('.lane-display span');
            const position = this.data.positions.find(p => 
                p.name === positionSpan.dataset.fullName
            );
            
            if (position) {
                const positionName = this.getPositionName(position);
                
                // 简单模式只处理闪现
                if (format === 'only_flash') {
                    const flashSpell = Array.from(row.querySelectorAll('.spell-select')).find(spellSelect => {
                        const img = spellSelect.querySelector('img');
                        if (img && !img.classList.contains('hidden')) {
                            const imagePath = img.src.split('/');
                            return imagePath[imagePath.length - 1] === 'flash.png';
                        }
                        return false;
                    });

                    if (flashSpell) {
                        const index = Array.from(row.querySelectorAll('.spell-select')).indexOf(flashSpell);
                        const finishTime = row.querySelector(`.finish-time${index + 1}`);
                        if (finishTime && finishTime.textContent) {
                            const time = finishTime.textContent.split(' ')[1].replace(':', '');
                            timers.push(`${positionName} ${time}`);
                        }
                    }
                    return;
                }
                
                // 其他模式处理所有技能
                const spells = Array.from(row.querySelectorAll('.spell-select')).map(spellSelect => {
                    const img = spellSelect.querySelector('img');
                    if (img && !img.classList.contains('hidden')) {
                        const spell = this.data.spells.find(s => {
                            const imagePath = img.src.split('/');
                            return s.image === imagePath[imagePath.length - 1];
                        });
                        const timer = row.querySelector(`.timer${Array.from(row.querySelectorAll('.spell-select')).indexOf(spellSelect) + 1}`);
                        const finishTime = row.querySelector(`.finish-time${Array.from(row.querySelectorAll('.spell-select')).indexOf(spellSelect) + 1}`);
                        if (spell && timer && timer.textContent && finishTime && finishTime.textContent) {
                            return `${this.getSpellName(spell)} ${this.getTimeDisplay(
                                parseInt(timer.textContent.replace('s', '')),
                                finishTime.textContent
                            )}`;
                        }
                    }
                    return null;
                }).filter(Boolean);

                if (spells.length > 0) {
                    timers.push(`${positionName} ${spells.join(' ')}`);
                }
            }
        });

        // 根据不同格式处理输出
        let outputText = '';
        switch (format) {
            case 'single-line':
                outputText = timers.join(' ');
                break;
            case 'compact':
                outputText = this.formatCompactText(timers);
                break;
            case 'only_flash':
                outputText = timers.join(' ');
                break;
            default: // normal
                outputText = timers.join('\n');
        }

        if (timers.length > 0) {
            try {
                const copyArea = document.getElementById('copy-area');
                copyArea.value = outputText;
                copyArea.select();
                document.execCommand('copy');
                
                copyBtn.classList.remove('error');
                this.autoCopy.updateCopyButtonText(copyBtn, originalText);
            } catch (err) {
                console.error('复制失败:', err);
                copyBtn.classList.add('error');
                copyBtn.textContent = '复制失败';
                setTimeout(() => {
                    copyBtn.classList.remove('error');
                    copyBtn.textContent = originalText;
                }, 2000);
                
                if (this.autoCopy.checkbox.checked) {
                    this.autoCopy.stop();
                    this.autoCopy.checkbox.checked = false;
                    this.autoCopy.select.disabled = true;
                    this.autoCopy.modeSelect.disabled = true;  // 添加这行
                    this.autoCopy.saveSettings();
                }
            }
        } else {
            if (this.autoCopy.checkbox.checked) {
                this.autoCopy.stop();
                this.autoCopy.checkbox.checked = false;
                this.autoCopy.select.disabled = true;
                this.autoCopy.modeSelect.disabled = true;  // 添加这行
                this.autoCopy.saveSettings();
            }
            
            copyBtn.classList.add('error');
            copyBtn.textContent = '没有可复制的计时信息';
            setTimeout(() => {
                copyBtn.classList.remove('error');
                copyBtn.textContent = originalText;
            }, 2000);
        }
    }

    // 添加新方法处理整合模式的文本格式化
    formatCompactText(timers) {
        const maxLength = 50;
        const lines = [];
        let currentLine = '';

        for (const timer of timers) {
            if (currentLine && (currentLine.length + timer.length + 1) > maxLength) {
                lines.push(currentLine);
                currentLine = timer;
            } else {
                currentLine = currentLine ? `${currentLine} ${timer}` : timer;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.join('\n');
    }

    handleTriggerButton(event) {
        const button = event.target.closest('.trigger-btn');
        const row = button.closest('.champion-row');
        const spellIndex = button.classList.contains('spell1') ? 0 : 1;
        
        // 获取技能信息
        const spellSelect = row.querySelectorAll('.spell-select')[spellIndex];
        const spellImg = spellSelect.querySelector('img');
        const spell = this.data.spells.find(s => {
            const imagePath = spellImg.src.split('/');
            return s.image === imagePath[imagePath.length - 1];
        });

        // 计算冷却时间
        let baseCooldown;
        if (spell && spell.name === '传送') {
            // 如果是传送技能，使用 TPManager 获取冷却时间
            baseCooldown = this.tpManager.getTPCooldown(row.dataset.row);
        } else {
            // 其他技能使用原有的冷却时间
            baseCooldown = parseInt(button.dataset.cooldown);
        }

        const totalHaste = this.calculateTotalHaste(row);
        const totalReduction = 1 - (totalHaste / (100 + totalHaste));
        const cooldown = Math.round(baseCooldown * totalReduction);
        
        this.startTimer(row.dataset.row, spellIndex, cooldown);
    }

    toggleModifier(event) {
        const button = event.currentTarget;
        const isActive = button.dataset.active === "true";
        button.dataset.active = (!isActive).toString();
    }

    startGameTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        if (!this.isEditing) {
            this.timerInterval = setInterval(() => {
                const elapsed = Date.now() - this.gameStartTime + this.gameTimeOffset;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                
                const minutesElement = document.getElementById('minutes');
                const secondsElement = document.getElementById('seconds');
                
                if (minutesElement && secondsElement) {
                    const oldMinutes = parseInt(minutesElement.textContent);
                    minutesElement.textContent = minutes.toString().padStart(2, '0');
                    secondsElement.textContent = seconds.toString().padStart(2, '0');

                    // 如果分钟数发生变化且经过了10分钟，更新所有传送冷却时间
                    if (oldMinutes !== minutes && minutes >= 10) {
                        this.updateAllTPCooldowns();
                    }
                }
            }, 1000);
        }
    }

    handleTimeAdjust(event) {
        // 这个方法专门处理游戏时间的调整
        const button = event.target;
        const type = button.dataset.type;
        const value = parseInt(button.dataset.value);
        
        // 第一次点击时停止计时器
        if (!this.isEditing) {
            this.isEditing = true;
            document.querySelector('.confirm-time-btn').classList.remove('hidden');
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        }
        
        // 获取当前显示的时间
        const currentMinutes = parseInt(document.getElementById('minutes').textContent);
        const currentSeconds = parseInt(document.getElementById('seconds').textContent);
        let totalSeconds = currentMinutes * 60 + currentSeconds;
        
        // 根据按钮类型调整时间
        if (type === 'minutes') {
            totalSeconds += value * 60;
        } else if (type === 'seconds') {
            totalSeconds += value;
        }
        
        // 确保时间不为负
        totalSeconds = Math.max(0, totalSeconds);
        
        // 更新显示
        const newMinutes = Math.floor(totalSeconds / 60);
        const newSeconds = totalSeconds % 60;
        document.getElementById('minutes').textContent = newMinutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = newSeconds.toString().padStart(2, '0');
    }

    confirmTimeAdjust() {
        const minutes = parseInt(document.getElementById('minutes').textContent);
        const seconds = parseInt(document.getElementById('seconds').textContent);
        const totalMilliseconds = (minutes * 60 + seconds) * 1000;
        
        // 重置开始时间和偏移量
        this.gameStartTime = Date.now();
        this.gameTimeOffset = totalMilliseconds;
        
        this.isEditing = false;
        document.querySelector('.confirm-time-btn').classList.add('hidden');
        
        // 从新时间开始计时
        this.startGameTimer();
        this.updateAllFinishTimes();
    }

    // 更新所有计时器的结束时间
    updateAllFinishTimes() {
        document.querySelectorAll('.champion-row').forEach(row => {
            const spellSelects = row.querySelectorAll('.spell-select');
            spellSelects.forEach((spellSelect, index) => {
                const timerKey = `${row.dataset.row}-${index}`;
                if (this.activeTimers.has(timerKey)) {
                    const timer = row.querySelector(`.timer${index + 1}`);
                    const finishTime = row.querySelector(`.finish-time${index + 1}`);
                    if (timer && timer.textContent && finishTime) {
                        const remainingSeconds = parseInt(timer.textContent.replace('s', ''));
                        const currentGameTime = Math.floor((Date.now() - this.gameStartTime + this.gameTimeOffset) / 1000);
                        const finishGameTime = currentGameTime + remainingSeconds;
                        const finishMinutes = Math.floor(finishGameTime / 60);
                        const finishSeconds = finishGameTime % 60;
                        finishTime.textContent = `结束 ${finishMinutes.toString().padStart(2, '0')}:${finishSeconds.toString().padStart(2, '0')}`;
                    }
                }
            });
        });
    }

    handleTimerAdjustment(event) {
        const button = event.target;
        const adjustValue = parseInt(button.dataset.value);
        const row = button.closest('.champion-row');
        const spellIndex = button.closest('.timer-adjust-btns').previousElementSibling.querySelector('.timer1') ? 0 : 1;
        const timerKey = `${row.dataset.row}-${spellIndex}`;
        
        if (this.activeTimers.has(timerKey)) {
            const targetTimerInfo = button.closest('.timer-adjust-btns').previousElementSibling;
            const timerDisplay = targetTimerInfo.querySelector(`.timer${spellIndex + 1}`);
            const startTimeDisplay = targetTimerInfo.querySelector(`.start-time${spellIndex + 1}`);
            const finishTimeDisplay = targetTimerInfo.querySelector(`.finish-time${spellIndex + 1}`);
            
            // 获取开始时间
            const [startMinutes, startSeconds] = startTimeDisplay.textContent.split(' ')[1].split(':').map(Number);
            let totalStartSeconds = startMinutes * 60 + startSeconds + adjustValue;
            
            // 确保总秒数不为负
            totalStartSeconds = Math.max(0, totalStartSeconds);
            
            // 更新开始时间显示
            const newStartMinutes = Math.floor(totalStartSeconds / 60);
            const newStartSeconds = totalStartSeconds % 60;
            startTimeDisplay.textContent = `开始 ${newStartMinutes.toString().padStart(2, '0')}:${newStartSeconds.toString().padStart(2, '0')}`;
            
            // 获取技能信息和位置
            const position = row.querySelector('.lane-display span').textContent;
            const spellSelect = row.querySelectorAll('.spell-select')[spellIndex];
            const spellImg = spellSelect.querySelector('img');
            const spell = this.data.spells.find(s => {
                const imagePath = spellImg.src.split('/');
                return s.image === imagePath[imagePath.length - 1];
            });
            
            if (!spell) {
                console.error('无法找到技能信息');
                return;
            }
            
            // 计算实际冷却时间
            let actualCooldown;
            if (spell.name === '传送' || spell.name === '解封的传送') {
                // 如果是传送技能，使用 TPManager 获取当前应该的冷却时间
                actualCooldown = this.tpManager.getTPCooldown(row.dataset.row);
            } else {
                // 其他技能使用原有的冷却时间计算方式
                const totalHaste = this.calculateTotalHaste(row);
                const totalReduction = 1 - (totalHaste / (100 + totalHaste));
                actualCooldown = Math.round(spell.cooldown * totalReduction);
            }
            
            // 更新结束时间
            const finishSeconds = totalStartSeconds + actualCooldown;
            const finishMinutes = Math.floor(finishSeconds / 60);
            const finishRemainingSeconds = finishSeconds % 60;
            finishTimeDisplay.textContent = `结束 ${finishMinutes.toString().padStart(2, '0')}:${finishRemainingSeconds.toString().padStart(2, '0')}`;
            
            // 更新计时器
            clearInterval(this.activeTimers.get(timerKey));
            const interval = setInterval(() => {
                const gameMinutes = parseInt(document.getElementById('minutes').textContent);
                const gameSeconds = parseInt(document.getElementById('seconds').textContent);
                const currentGameTime = gameMinutes * 60 + gameSeconds;
                const remainingTime = Math.max(0, finishSeconds - currentGameTime);
                
                if (remainingTime <= 0) {
                    clearInterval(interval);
                    timerDisplay.textContent = '';
                    timerDisplay.style.backgroundImage = '';
                    timerDisplay.classList.remove('active');
                    finishTimeDisplay.textContent = '';
                    startTimeDisplay.textContent = '';
                    button.closest('.timer-adjust-btns').classList.remove('active');
                    this.activeTimers.delete(timerKey);
                } else {
                    timerDisplay.textContent = `${remainingTime}s`;
                    
                    // 语音提示检查
                    if (remainingTime === 31) {
                        console.log('调整后触发30秒提示:', {
                            position,
                            spell: spell.name
                        });
                        if (this.voiceManager && this.voiceManager.enabled) {
                            this.voiceManager.checkAndPlayThirtySeconds(position, spell.name, 30);
                        }
                    } else if (remainingTime === 1) {
                        console.log('调整后触发就绪提示:', {
                            position,
                            spell: spell.name
                        });
                        if (this.voiceManager && this.voiceManager.enabled) {
                            this.voiceManager.playReadyNotification(position, spell.name);
                        }
                    }
                }
            }, 1000);
            
            this.activeTimers.set(timerKey, interval);
        }
    }

    // 新增方法：根据开始时间和冷却时间计算结束时间
    getFinishTimeFromStart(startTime, cooldown) {
        const finishTime = startTime + cooldown;
        const minutes = Math.floor(finishTime / 60);
        const seconds = finishTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getPositionName(position) {
        switch(this.settings.positionFormat) {
            case 'simple': return position.simpleName;  // TOP, JUG, MID 等
            case 'mini': return position.miniName;      // 上, 野, 中 等
            default: return position.name;              // 上路, 打野, 中路 等
        }
    }

    getSpellName(spell) {
        switch(this.settings.spellFormat) {
            case 'simple': return spell.simpleName;     // F, TP, 火 等
            case 'mini': return spell.miniName;         // F, TP, 火 等
            default: return spell.name;                 // 闪现, 传送, 点燃 等
        }
    }

    getTimeDisplay(seconds, finishTime) {
        switch(this.settings.timeFormat) {
            case 'finish':
                return finishTime.split(' ')[1];
            case 'finish-rounded':
                const [min, sec] = finishTime.split(' ')[1].split(':').map(Number);
                // 对秒的个位进行四舍五入
                const roundedSec = Math.round(sec / 10) * 10;
                // 如果四舍五入后是60，需要进位
                if (roundedSec === 60) {
                    return `${min + 1}:00`;
                }
                return `${min}:${roundedSec.toString().padStart(2, '0')}`;
            default:
                // 移除数字和's'之间的空格
                return `${seconds}s`;
        }
    }

    // 加载保存的召唤师技能
    loadSavedSpells() {
        document.querySelectorAll('.champion-row').forEach(row => {
            const rowIndex = row.dataset.row;
            const savedRow = this.savedSpells[rowIndex];
            if (savedRow) {
                const spellSelects = row.querySelectorAll('.spell-select');
                ['spell1', 'spell2'].forEach((spellKey, index) => {
                    const savedSpell = savedRow[spellKey];
                    if (savedSpell) {
                        const spellSelect = spellSelects[index];
                        const img = spellSelect.querySelector('img');
                        const addBtn = spellSelect.querySelector('.add-btn');
                        const clearBtn = spellSelect.querySelector('.clear-btn');
                        const triggerBtn = row.querySelector(`.trigger-btn.spell${index + 1}`);
                        
                        img.src = `data/images/${savedSpell.image}`;
                        img.alt = savedSpell.name;  // 确保设置 alt 属性
                        img.classList.remove('hidden');
                        addBtn.classList.add('hidden');
                        clearBtn.classList.remove('hidden');
                        triggerBtn.querySelector('.trigger-icon').src = `data/images/${savedSpell.image}`;
                        triggerBtn.disabled = false;
                        triggerBtn.dataset.cooldown = savedSpell.cooldown;

                        // 如果是传送技能，显示等级控制器
                        if (savedSpell.name === '传送') {
                            this.tpManager.showLevelControls(rowIndex, index);
                        }
                    }
                });
            }
        });
    }

    // 添加新方法：更新所有位置显示
    updatePositionDisplays() {
        document.querySelectorAll('.champion-row').forEach(row => {
            const positionSpan = row.querySelector('.lane-display span');
            const currentPosition = this.data.positions.find(p => 
                p.name === positionSpan.dataset.fullName || 
                p.simpleName === positionSpan.dataset.fullName ||
                p.miniName === positionSpan.dataset.fullName
            );
            if (currentPosition) {
                positionSpan.textContent = this.getPositionName(currentPosition);
            }
        });
    }

    // 在 Timer 类中添加新方法
    updateAllTPCooldowns() {
        document.querySelectorAll('.champion-row').forEach(row => {
            const rowIndex = row.dataset.row;
            this.tpManager.updateTPCooldown(rowIndex);
        });
    }

    // 添加新方法处理固定时间点
    handleTimePreset(event) {
        const button = event.target;
        const preset = button.dataset.preset;
        let targetSeconds = 0;

        switch(preset) {
            case 'welcome':
                targetSeconds = 26;  // 欢迎来到英雄联盟 - 00:26
                break;
            case 'minions':
                targetSeconds = 36;  // 敌军30秒到达战场 - 00:36
                break;
            case 'battle':
                targetSeconds = 65;  // 全军出击 - 01:05
                break;
            default:
                return;
        }

        // 如果正在编辑时间，先退出编辑模式
        if (this.isEditing) {
            this.isEditing = false;
            document.querySelector('.confirm-time-btn').classList.add('hidden');
        }

        // 清除现有的计时器
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // 设置新的游戏时间
        const minutes = Math.floor(targetSeconds / 60);
        const seconds = targetSeconds % 60;
        
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');

        // 重置游戏时间并开始计时
        this.gameStartTime = Date.now();
        this.gameTimeOffset = targetSeconds * 1000;
        
        // 更新所有计时器的结束时间
        this.updateAllFinishTimes();
        
        // 重新开始计时器
        this.startGameTimer();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new Timer();
}); 