/**
 * Cat Species Definition (Comnyang)
 */
const path = require('path');
const fs = require('fs');

const PRESETS = [
  { id: 'calico-cat', name: 'Calico (Tricolore)', file: 'calico-cat.json' },
  { id: 'mackerel-tabby', name: 'Mackerel Tabby (Tigré)', file: 'mackerel-tabby.json' },
  { id: 'siamese-cat', name: 'Siamese (Siamois)', file: 'siamese-cat.json' },
  { id: 'cheese-cat', name: 'Cheese (Roux)', file: 'cheese-cat.json' },
  { id: 'black-cat', name: 'Black (Noir)', file: 'black-cat.json' },
  { id: 'rusian-blue', name: 'Russian Blue (Gris bleu)', file: 'rusian-blue.json' },
  { id: 'white-cat', name: 'White (Blanc)', file: 'white-cat.json' }
];

module.exports = {
  id: 'cat',
  name: 'Cat',
  displayName: 'Chat (Comnyang)',
  icon: '🐱',
  defaultPreset: 'calico-cat',
  sounds: {
    meow: 'assets/sound/meow.m4a',
    alert: 'assets/sound/meow-alert.m4a',
    purr: 'assets/sound/purring.m4a'
  },
  sprites: {
    idle: 'assets/svg/cat-idle-follow-v2.svg',
    pressLeft: 'assets/svg/press-left.svg',
    pressRight: 'assets/svg/press-right.svg',
    scrollUnroll: 'assets/svg/scroll-unroll.svg',
    jumpStart: 'assets/svg/jump-start.svg',
    jumpIng: 'assets/svg/jump-ing.svg',
    stretchDefault: 'assets/svg/stretch-pose-default.svg',
    stretchIng: 'assets/svg/stretch-pose-ing.svg',
    stretchEnd: 'assets/svg/stretch-end.svg'
  },
  presets: PRESETS,
  vocab: {
    suffix: {
      en: ' meow!',
      fr: ' miaou !',
      ko: ' 냥!',
      ja: ' にゃ!'
    },
    drinkPrompt: {
      en: 'Time to drink some water, meow!',
      fr: "C'est l'heure de boire un verre d'eau, miaou !",
      ko: '물 마실 시간이다냥!',
      ja: 'お水を飲む時間にゃ！'
    },
    stretchPrompt: {
      en: 'Time to stretch with me, meow!',
      fr: "C'est l'heure de faire des étirements, miaou !",
      ko: '스트레칭할 시간이다냥!',
      ja: 'ストレッチする時間にゃ！'
    },
    agentComplete: {
      en: 'Task complete, meow!',
      fr: 'Tâche terminée, miaou !',
      ko: '작업 완료냥!',
      ja: 'タスク完了にゃ！'
    }
  },

  getPresetData(presetId, baseDir) {
    const found = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    const filePath = path.join(baseDir, 'assets', 'presets', found.file);
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e) {
      console.error('[CatSpecies] Error reading preset:', e);
    }
    return null;
  }
};
