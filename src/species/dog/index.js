/**
 * Dog Species Definition (Pixel Dog)
 * Prêt pour l'ajout futur des sprites et sons de chiens.
 */

const PRESETS = [
  { 
    id: 'shiba-dog', 
    name: 'Shiba Inu (Roux)', 
    data: {
      baseColor: '#E2974A',
      eyeColor: '#1A1A1A',
      eyeBgColor: '#FFFFFF',
      head: [
        { x: 5, y: 10, color: '#FFFFFF' },
        { x: 6, y: 10, color: '#FFFFFF' },
        { x: 10, y: 10, color: '#FFFFFF' },
        { x: 11, y: 10, color: '#FFFFFF' },
        { x: 7, y: 12, color: '#000000' }
      ],
      body: [
        { x: 8, y: 20, color: '#FFFFFF' },
        { x: 9, y: 20, color: '#FFFFFF' },
        { x: 10, y: 20, color: '#FFFFFF' },
        { x: 11, y: 20, color: '#FFFFFF' }
      ],
      tail: [
        { x: 10, y: 2, color: '#E2974A' },
        { x: 11, y: 2, color: '#FFFFFF' }
      ]
    }
  },
  { 
    id: 'dalmatian-dog', 
    name: 'Dalmatian (Tacheté)', 
    data: {
      baseColor: '#FFFFFF',
      eyeColor: '#1A1A1A',
      eyeBgColor: '#C0D5E8',
      head: [
        { x: 3, y: 3, color: '#000000' },
        { x: 4, y: 4, color: '#000000' },
        { x: 15, y: 3, color: '#000000' },
        { x: 7, y: 12, color: '#000000' }
      ],
      body: [
        { x: 5, y: 22, color: '#000000' },
        { x: 12, y: 23, color: '#000000' },
        { x: 18, y: 22, color: '#000000' }
      ],
      tail: [
        { x: 9, y: 2, color: '#000000' }
      ]
    }
  },
  { 
    id: 'golden-dog', 
    name: 'Golden Retriever (Doré)', 
    data: {
      baseColor: '#E8B658',
      eyeColor: '#362208',
      eyeBgColor: '#FFFFFF',
      head: [
        { x: 7, y: 12, color: '#2B1A04' }
      ],
      body: [],
      tail: []
    }
  }
];

module.exports = {
  id: 'dog',
  name: 'Dog',
  displayName: 'Chien (Pixel Dog)',
  icon: '🐶',
  defaultPreset: 'shiba-dog',
  sounds: {
    meow: 'assets/sound/bark.wav',
    alert: 'assets/sound/bark-alert.wav',
    purr: 'assets/sound/pant.wav'
  },
  sprites: {
    idle: 'assets/svg/dog-idle-follow.svg',
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
      en: ' woof!',
      fr: ' wouf !',
      ko: ' 멍!',
      ja: ' ワン!'
    },
    drinkPrompt: {
      en: 'Time to drink some water, woof!',
      fr: "C'est l'heure de boire un bol d'eau, wouf !",
      ko: '물 마실 시간이다멍!',
      ja: 'お水を飲む時間ワン！'
    },
    stretchPrompt: {
      en: 'Time to stretch your paws, woof!',
      fr: "C'est l'heure de s'étirer les pattes, wouf !",
      ko: '스트레칭할 시간이다멍!',
      ja: 'ストレッチする時間ワン！'
    },
    agentComplete: {
      en: 'Task complete, woof!',
      fr: 'Tâche terminée, wouf !',
      ko: '작업 완료멍!',
      ja: 'タスク完了ワン！'
    }
  },

  getPresetData(presetId) {
    const found = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    return found.data;
  }
};
