/**
 * Internationalization (i18n)
 * Support pour le Français, Anglais, Coréen et Japonais.
 */
const I18N_DATA = {
  fr: {
    agentComplete: 'Tâche terminée !',
    agentThinking: 'En pleine réflexion...',
    drinkPrompt: (name) => `${name || 'Humain'}, c'est l'heure de boire un peu d'eau !`,
    stretchPrompt: (name) => `${name || 'Humain'}, faisons quelques étirements !`,
    pomodoroFocus: 'Concentration',
    pomodoroBreak: 'Pause détente',
    pomodoroPause: 'Pause',
    pomodoroResume: 'Reprendre',
    pomodoroReset: 'Réinitialiser',
    remindersTitle: 'Rappels Santé',
    quickWater: "💧 Boire de l'eau",
    quickStretch: '🧘 S’étirer'
  },
  en: {
    agentComplete: 'Task complete!',
    agentThinking: 'Thinking...',
    drinkPrompt: (name) => `${name || 'Human'}, time to drink some water!`,
    stretchPrompt: (name) => `${name || 'Human'}, time to stretch!`,
    pomodoroFocus: 'Focus',
    pomodoroBreak: 'Break',
    pomodoroPause: 'Pause',
    pomodoroResume: 'Resume',
    pomodoroReset: 'Reset',
    remindersTitle: 'Health Reminders',
    quickWater: '💧 Drink Water',
    quickStretch: '🧘 Stretch'
  },
  ko: {
    agentComplete: '작업 완료냥!',
    agentThinking: '생각 중...',
    drinkPrompt: (name) => `${name || '집사야'}, 물 마실 시간이다냥!`,
    stretchPrompt: (name) => `${name || '집사야'}, 스트레칭하자냥!`,
    pomodoroFocus: '집중냥',
    pomodoroBreak: '휴식냥',
    pomodoroPause: '일시정지',
    pomodoroResume: '다시 시작',
    pomodoroReset: '초기화',
    remindersTitle: '알림',
    quickWater: '💧 물 마시기',
    quickStretch: '🧘 스트레칭'
  },
  ja: {
    agentComplete: 'タスク完了にゃ！',
    agentThinking: '考え中にゃ...',
    drinkPrompt: (name) => `${name || 'ご主人'}、お水を飲む時間にゃ！`,
    stretchPrompt: (name) => `${name || 'ご主人'}、ストレッチする時間にゃ！`,
    pomodoroFocus: '集中にゃ',
    pomodoroBreak: '休憩にゃ',
    pomodoroPause: '一時停止',
    pomodoroResume: '再開',
    pomodoroReset: 'リセット',
    remindersTitle: '通知',
    quickWater: '💧 お水を飲む',
    quickStretch: '🧘 ストレッチ'
  }
};

class I18nManager {
  constructor(lang = 'fr') {
    this.lang = I18N_DATA[lang] ? lang : 'fr';
  }

  setLang(lang) {
    if (I18N_DATA[lang]) {
      this.lang = lang;
    }
  }

  t(key, ...args) {
    const table = I18N_DATA[this.lang] || I18N_DATA.fr;
    const val = table[key] || I18N_DATA.en[key] || key;
    if (typeof val === 'function') {
      return val(...args);
    }
    return val;
  }
}

window.i18n = new I18nManager('fr');
