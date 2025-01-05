class VoiceManager {
    constructor() {
        this.enabled = false;
        this.checkbox = document.getElementById('voice-toggle');
        this.audioQueue = [];
        this.isPlaying = false;
        this.audioCache = new Map();
        
        console.log('VoiceManager 初始化');
        
        // 根据实际音频文件设置映射关系
        this.voiceMap = {
            positions: {
                '上路': 'top',
                '打野': 'jug',
                '中路': 'mid',
                '射手': 'adc',
                '辅助': 'sup',
                'TOP': 'top',
                'JUG': 'jug',
                'MID': 'mid',
                'ADC': 'adc',
                'SUP': 'sup',
                '上': 'top',
                '野': 'jug',
                '中': 'mid',
                '射': 'adc',
                '辅': 'sup'
            },
            spells: {
                '闪现': 'F',
                '传送': 'tp',
                '点燃': 'D',
                '治疗': 'zl',
                '净化': 'jh',
                '屏障': 'pz',
                '虚弱': 'xr',
                '幽灵疾步': 'yljb',
                'F': 'F',
                'TP': 'tp',
                '火': 'D',
                '盾': 'pz',
                '疾步': 'yljb',
                '疾跑': 'yljb'
            },
            status: {
                '30s': '30s',
                'ready': 'ready'
            }
        };

        this.voicePath = './data/voice';
        
        this.preloadAllAudio();
        this.init();
        this.checkVoiceDirectory();
    }

    init() {
        console.log('加载语音设置');
        this.loadSettings();
        
        this.checkbox.addEventListener('change', () => {
            console.log('语音开关状态改变:', this.checkbox.checked);
            this.enabled = this.checkbox.checked;
            this.saveSettings();
        });
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('voiceSettings'));
            if (settings) {
                this.enabled = settings.enabled;
                this.checkbox.checked = settings.enabled;
            }
        } catch (error) {
            console.error('加载语音设置失败:', error);
        }
    }

    saveSettings() {
        const settings = {
            enabled: this.enabled
        };
        localStorage.setItem('voiceSettings', JSON.stringify(settings));
    }

    async preloadAudio(audioFile) {
        if (this.audioCache.has(audioFile)) {
            return this.audioCache.get(audioFile);
        }

        const audio = new Audio(audioFile);
        return new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', () => {
                this.audioCache.set(audioFile, audio);
                resolve(audio);
            }, { once: true });
            audio.addEventListener('error', (e) => reject(e), { once: true });
            audio.load();
        });
    }

    async preloadAllAudio() {
        console.log('开始预加载所有音频文件');
        try {
            const allFiles = [
                ...Object.values(this.voiceMap.positions).map(code => `${this.voicePath}/${code}.mp3`),
                ...Object.values(this.voiceMap.spells).map(code => `${this.voicePath}/${code}.mp3`),
                ...Object.values(this.voiceMap.status).map(code => `${this.voicePath}/${code}.mp3`)
            ];

            console.log('准备预加载的文件:', allFiles);

            for (const file of allFiles) {
                try {
                    const response = await fetch(file, { method: 'HEAD' });
                    if (!response.ok) {
                        throw new Error(`文件不存在: ${file}`);
                    }
                    await this.preloadAudio(file);
                    console.log('预加载成功:', file);
                } catch (error) {
                    console.error('预加载失败:', file, error);
                }
            }
            console.log('所有音频文件预加载完成');
        } catch (error) {
            console.error('音频预加载失败:', error);
        }
    }

    async playVoiceSequence(position, spell, type) {
        console.log('尝试播放语音序列:', { position, spell, type });
        
        if (!this.enabled) {
            console.log('语音提示已禁用');
            return;
        }

        // 如果是惩戒，不播放提示音
        if (spell === '惩戒') {
            console.log('惩戒不播放提示音');
            return;
        }

        const positionCode = this.voiceMap.positions[position];
        const spellCode = this.voiceMap.spells[spell];
        const statusCode = this.voiceMap.status[type];

        console.log('音频映射结果:', { positionCode, spellCode, statusCode });

        if (!positionCode || !spellCode || !statusCode) {
            console.error('找不到对应的音频映射:', { position, spell, type });
            return;
        }

        // 按顺序播放：位置 + 技能 + 状态
        const audioFiles = [
            `${this.voicePath}/${positionCode}.mp3`,
            `${this.voicePath}/${spellCode}.mp3`,
            `${this.voicePath}/${statusCode}.mp3`
        ];

        console.log('准备播放音频序列:', audioFiles);

        try {
            // 依次播放音频
            for (const audioFile of audioFiles) {
                const audio = this.audioCache.get(audioFile) || new Audio(audioFile);
                audio.currentTime = 0;

                await new Promise((resolve, reject) => {
                    audio.onended = resolve;
                    audio.onerror = reject;
                    
                    const playPromise = audio.play();
                    if (playPromise) {
                        playPromise.catch(e => {
                            console.error('播放出错:', e);
                            reject(e);
                        });
                    }
                });
                
                // 音频间隔
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('音频处理失败:', error);
        }
    }

    async playNext() {
        if (this.audioQueue.length === 0) {
            console.log('播放队列为空，结束播放');
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const audioFile = this.audioQueue.shift();
        console.log('正在播放:', audioFile);

        try {
            const audio = this.audioCache.get(audioFile) || new Audio(audioFile);
            audio.currentTime = 0;

            console.log('尝试播放音频:', audioFile);
            await new Promise((resolve, reject) => {
                audio.onended = () => {
                    console.log('音频播放完成:', audioFile);
                    resolve();
                };
                
                audio.onerror = (e) => {
                    console.error('音频播放失败:', audioFile, e);
                    reject(e);
                };
                
                const playPromise = audio.play();
                if (playPromise) {
                    playPromise.catch(e => {
                        console.error('音频播放出错:', e);
                        reject(e);
                    });
                }
            });
            
            console.log('等待1秒后播放下一个音频');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('播放音频失败:', audioFile, error);
        }

        await this.playNext();
    }

    // 检查并播放30秒提示
    checkAndPlayThirtySeconds(position, spell, remainingTime) {
        if (remainingTime === 30) {
            this.playVoiceSequence(position, spell, '30s');
        }
    }

    // 播放就绪提示
    playReadyNotification(position, spell) {
        this.playVoiceSequence(position, spell, 'ready');
    }

    async checkVoiceDirectory() {
        try {
            const testFile = `${this.voicePath}/top.mp3`;
            const audio = new Audio(testFile);
            
            await new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', resolve, { once: true });
                audio.addEventListener('error', reject, { once: true });
                audio.load();
            });
            
            this.checkbox.disabled = false;
            console.log('音频目录可访问');
            
        } catch (error) {
            console.error('音频目录检查失败:', error);
            this.checkbox.disabled = true;
            this.checkbox.checked = false;
            this.enabled = false;
            
            const tip = document.createElement('span');
            tip.textContent = '请确保 data/voice 目录下有所需的音频文件';
            tip.style.color = 'red';
            tip.style.fontSize = '12px';
            this.checkbox.parentNode.appendChild(tip);
        }
    }
} 