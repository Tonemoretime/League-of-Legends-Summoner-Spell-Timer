// 位置数据
const positionsData = [
    { name: '上路', simpleName: 'TOP', miniName: '上', image: 'top.png', voice: 'top.mp3' },
    { name: '打野', simpleName: 'JUG', miniName: '野', image: 'jungle.png', voice: 'jug.mp3' },
    { name: '中路', simpleName: 'MID', miniName: '中', image: 'middle.png', voice: 'mid.mp3' },
    { name: '射手', simpleName: 'ADC', miniName: '射', image: 'bottom.png', voice: 'adc.mp3' },
    { name: '辅助', simpleName: 'SUP', miniName: '辅', image: 'support.png', voice: 'sup.mp3' }
];

// 召唤师技能数据
const summonerSpellsData = [
    { name: '闪现', simpleName: 'F', miniName: 'F', image: 'flash.png', cooldown: 300, voice: 'F.mp3' },
    { name: '传送', simpleName: 'TP', miniName: 'TP', image: 'teleport.png', cooldown: 360, voice: 'tp.mp3' },
    { name: '点燃', simpleName: '火', miniName: '火', image: 'ignite.png', cooldown: 180, voice: 'D.mp3' },
    { name: '治疗', simpleName: '治疗', miniName: '治疗', image: 'heal.png', cooldown: 240, voice: 'zl.mp3' },
    { name: '净化', simpleName: '净化', miniName: '净化', image: 'cleanse.png', cooldown: 210, voice: 'jh.mp3' },
    { name: '屏障', simpleName: '盾', miniName: '盾', image: 'barrier.png', cooldown: 180, voice: 'pz.mp3' },
    { name: '虚弱', simpleName: '虚弱', miniName: '虚弱', image: 'exhaust.png', cooldown: 210, voice: 'xr.mp3' },
    { name: '幽灵疾步', simpleName: '疾步', miniName: '疾跑', image: 'ghost.png', cooldown: 210, voice: 'yljb.mp3' },
    { name: '惩戒', simpleName: 'CJ', miniName: 'CJ', image: 'smite.png', cooldown: 90 }
];

// 符文和装备数据
const runesItemsData = [
    { type: 'rune', name: '宇宙洞悉', haste: 18 },
    { type: 'item', name: '明朗之靴', haste: 12 }
];

const autoCopyIntervals = [
    { value: 2, label: "2秒" },
    { value: 5, label: "5秒" },
    { value: 10, label: "10秒" }
];

const copyFormats = [
    { value: 'normal', label: "普通模式" },
    { value: 'single-line', label: "单行模式" },
    { value: 'compact', label: "整合模式" },
    { value: 'only_flash', label: "单闪模式" }
];

// 语音提示音频数据
const voiceData = {
    positions: {
        'top': 'top.mp3',
        'jug': 'jug.mp3',
        'mid': 'mid.mp3',
        'adc': 'adc.mp3',
        'sup': 'sup.mp3'
    },
    spells: {
        'F': 'F.mp3',
        'tp': 'tp.mp3',
        'D': 'D.mp3',
        'zl': 'zl.mp3',
        'jh': 'jh.mp3',
        'pz': 'pz.mp3',
        'xr': 'xr.mp3',
        'yljb': 'yljb.mp3'
    },
    status: {
        '30s': '30s.mp3',
        'ready': 'ready.mp3'
    }
}; 