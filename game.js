/**
 * NEON VIBE CLICKER - CORE GAME ENGINE V2
 * Expanded with:
 * 1. Enlarged click zone (clicking anywhere in the stage registers clicks)
 * 2. Confined Lucky Crystal (flies strictly within the left clicker column)
 * 3. Orbiting badges for purchased AI & upgrades near the core
 * 4. Multi-level Rebirth System with AI Eras: DeepSeek, Qwen, Gemini, ChatGPT, Claude + Custom Themes + Neuro-Shards Shop
 * 5. Epic Meme Achievement Popups with fanfare!
 */

// Format numbers into human-readable notation (e.g. 1.25M, 450.2K)
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num < 10) {
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  }
  if (num < 1000) return Math.floor(num).toLocaleString('ru-RU');

  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  const i = Math.floor(Math.log10(Math.max(1, num)) / 3);
  const formattedIndex = Math.min(i, suffixes.length - 1);
  const scaled = num / Math.pow(10, formattedIndex * 3);

  return scaled.toFixed(scaled >= 100 ? 1 : 2) + suffixes[formattedIndex];
}

class NeonVibeGame {
  constructor() {
    this.saveKey = 'vibe_clicker_save_v3';

    // Game State
    this.score = 0;
    this.totalScoreEarned = 0;
    this.totalClicks = 0;
    this.totalBonuses = 0;
    this.startTime = Date.now();
    this.lastSaveTime = Date.now();
    this.lastTickTime = Date.now();

    // Rebirth / Prestige System
    this.rebirthLevel = 0;
    this.rebirthClicks = 0; // clicks in current rebirth
    this.neuroShards = 0;
    this.totalShardsEarned = 0;

    // AI Eras
    this.eras = [
      {
        level: 0,
        name: 'Базовая Матрица',
        icon: '⚡',
        clicksNeeded: 150,
        themeClass: 'theme-era-0',
        quote: '«Эра чистого железа и базовых скриптов на коленке»'
      },
      {
        level: 1,
        name: 'DeepSeek (Дипсик)',
        icon: '🐳',
        clicksNeeded: 450,
        themeClass: 'theme-era-deepseek',
        quote: '«Китайский мемный гений, обрушивший акции техногигантов!»'
      },
      {
        level: 2,
        name: 'Qwen Chat (Квен)',
        icon: '🐉',
        clicksNeeded: 1200,
        themeClass: 'theme-era-qwen',
        quote: '«Восточный дракон логики, рассуждений и бесконечного дзена»'
      },
      {
        level: 3,
        name: 'Gemini (Гемини)',
        icon: '♊',
        clicksNeeded: 3000,
        themeClass: 'theme-era-gemini',
        quote: '«Мультимодальный супермозг от Google, читающий гигабайты мыслей»'
      },
      {
        level: 4,
        name: 'ChatGPT (Чат ГПТ)',
        icon: '🤖',
        clicksNeeded: 7500,
        themeClass: 'theme-era-chatgpt',
        quote: '«Легенда Сэма Альтмана, пишущая стихи и привлекающая миллиарды»'
      },
      {
        level: 5,
        name: 'Claude (Клод)',
        icon: '🧠',
        clicksNeeded: 18000,
        themeClass: 'theme-era-claude',
        quote: '«Божественный философ и абсолютный архитектор чистого кода»'
      },
      {
        level: 6,
        name: 'Сингулярность AI',
        icon: '🌌',
        clicksNeeded: 40000,
        themeClass: 'theme-era-claude',
        quote: '«Точка невозврата. Разум и вайб стали единым целым»'
      }
    ];

    // Rebirth Upgrades (Purchased with 💠 Neuro-Shards)
    this.rebirthUpgrades = [
      {
        id: 'quantum_mult',
        name: 'Квантовый Множитель',
        desc: '+50% ко всему вайбу за уровень перка',
        icon: '🧬',
        level: 0,
        baseCost: 5,
        costMult: 1.8,
        effect: (lvl) => 1 + lvl * 0.5
      },
      {
        id: 'fast_start',
        name: 'Кофейный Рестарт',
        desc: 'Начинайте перерождение сразу с запасом Кофе и Энергетиков (+5 и +2 за ур.)',
        icon: '☕',
        level: 0,
        baseCost: 10,
        costMult: 2.0,
        maxLevel: 5
      },
      {
        id: 'hyper_crit',
        name: 'Гипер-Криты',
        desc: 'Криты наносят x10 вместо x5, и +3% к шансу крита за ур.',
        icon: '🎯',
        level: 0,
        baseCost: 15,
        costMult: 2.2,
        maxLevel: 5
      },
      {
        id: 'auto_tapper',
        name: 'Авто-Таппер Матрицы',
        desc: 'Ядро само автоматически кликает 2 раза в секунду!',
        icon: '⚡',
        level: 0,
        baseCost: 20,
        costMult: 2.5,
        maxLevel: 5
      },
      {
        id: 'crystal_magnet',
        name: 'Магнит Кристаллов',
        desc: 'Летающие глитч-кристаллы появляются на 30% чаще',
        icon: '💎',
        level: 0,
        baseCost: 18,
        costMult: 2.2,
        maxLevel: 3
      }
    ];

    // Auto-clickers (Producers)
    this.producers = [
      {
        id: 'coffee',
        name: 'Кофе «Espresso Neon»',
        desc: 'Бодрящий глоток темной обжарки для ночного кодинга',
        icon: '☕',
        count: 0,
        baseCost: 15,
        costMult: 1.15,
        baseVps: 0.5
      },
      {
        id: 'energy',
        name: 'Энергетик «Cyber Rush»',
        desc: 'Ударная доза таурина, кофеина и чистой энергии',
        icon: '⚡',
        count: 0,
        baseCost: 100,
        costMult: 1.15,
        baseVps: 4
      },
      {
        id: 'gpu',
        name: 'Видеокарта «RTX 5090 Ti»',
        desc: 'Аппаратный майнинг лучей вайба на ультра-настройках',
        icon: '🎮',
        count: 0,
        baseCost: 1100,
        costMult: 1.15,
        baseVps: 32
      },
      {
        id: 'deepseek',
        name: 'Нейросеть «DeepSeek V3»',
        desc: 'Дешевый, дерзкий и умный китайский ИИ. Ломает бенчмарки!',
        icon: '🐳',
        count: 0,
        baseCost: 12000,
        costMult: 1.15,
        baseVps: 320
      },
      {
        id: 'qwen',
        name: 'Нейросеть «Qwen 2.5 Max»',
        desc: 'Восточный дракон логики от Alibaba. Решает сложнейшие задачи',
        icon: '🐉',
        count: 0,
        baseCost: 85000,
        costMult: 1.15,
        baseVps: 2200
      },
      {
        id: 'gemini',
        name: 'Нейросеть «Gemini 2.5 Pro»',
        desc: 'Мультимодальный титан от Google. Понимает видео, аудио и код',
        icon: '♊',
        count: 0,
        baseCost: 650000,
        costMult: 1.15,
        baseVps: 15000
      },
      {
        id: 'chatgpt',
        name: 'Нейросеть «ChatGPT 4o»',
        desc: 'Легенда OpenAI. Общается голосом, шутит и делает презентации',
        icon: '🤖',
        count: 0,
        baseCost: 4500000,
        costMult: 1.15,
        baseVps: 95000
      },
      {
        id: 'claude',
        name: 'Нейросеть «Claude 3.7 Sonnet»',
        desc: 'Бог программирования и архитектуры от Anthropic. Пишет код идеально',
        icon: '🧠',
        count: 0,
        baseCost: 32000000,
        costMult: 1.15,
        baseVps: 750000
      }
    ];

    // Manual Click Boosters & Upgrades
    this.boosters = [
      {
        id: 'click_cursor',
        name: 'Неоновый Курсор',
        desc: '+1 к базовой силе каждого клика',
        icon: '👆',
        count: 0,
        maxCount: 25,
        baseCost: 25,
        costMult: 1.5,
        bonusVpc: 1
      },
      {
        id: 'click_mechanical',
        name: 'Тактильная Механика',
        desc: '+5 к силе каждого клика (синие свитчи)',
        icon: '⌨️',
        count: 0,
        maxCount: 25,
        baseCost: 220,
        costMult: 1.55,
        bonusVpc: 5
      },
      {
        id: 'click_overclock',
        name: 'Разгон Частоты Клика',
        desc: '+35 к силе каждого клика',
        icon: '🔥',
        count: 0,
        maxCount: 25,
        baseCost: 2500,
        costMult: 1.6,
        bonusVpc: 35
      },
      {
        id: 'resonance',
        name: 'Вайб-Резонанс',
        desc: 'Каждый клик дополнительно дает +1.5% от вашего дохода/сек',
        icon: '🔮',
        count: 0,
        maxCount: 15,
        baseCost: 15000,
        costMult: 2.2,
        resonancePercent: 0.015
      },
      {
        id: 'crit_luck',
        name: 'Критический Импульс',
        desc: '12% шанс нанести СУПЕР-КЛИК с умножением x5 (или x10+ с перком)',
        icon: '🎯',
        count: 0,
        maxCount: 5,
        baseCost: 45000,
        costMult: 2.5,
        critChance: 0.12
      }
    ];

    // Combo & Fever
    this.combo = 0;
    this.maxCombo = 100;
    this.comboDecayRate = 22;
    this.feverActive = false;
    this.feverTimer = 0;
    this.activeBuffs = [];

    // Meme Achievements List
    this.achievements = [
      {
        id: 'first_click',
        title: 'Первый импульс',
        desc: 'Сделайте свой самый первый клик',
        memeTag: 'БАЗА ДНЯ 🗿',
        memeQuote: '«Ты кликнул так уверенно, что сервер слегка вздрогнул»',
        icon: '✨',
        unlocked: false,
        check: () => this.totalClicks >= 1
      },
      {
        id: 'click_100',
        title: 'Быстрые пальцы',
        desc: 'Совершите 100 кликов',
        memeTag: 'СИГМА-ГРИНДСЕТ 🐺',
        memeQuote: '«Клавиатура начинает плавиться, но ты не останавливаешься»',
        icon: '⚡',
        unlocked: false,
        check: () => this.totalClicks >= 100
      },
      {
        id: 'click_1000',
        title: 'Кликер-машина',
        desc: 'Преодолейте отметку в 1,000 кликов',
        memeTag: 'ГИГАЧАД ОБНАРУЖЕН 🦾',
        memeQuote: '«Твои пальцы теперь занесены в реестр высокоточного оружия»',
        icon: '🦾',
        unlocked: false,
        check: () => this.totalClicks >= 1000
      },
      {
        id: 'first_coffee',
        title: 'Утренний прогрев',
        desc: 'Купите первую чашку кофе',
        memeTag: 'ПРОГРЕВ ГОЕВ ☕',
        memeQuote: '«Кофе за 15 вайбов — и ты уже готов переписать ядро Linux»',
        icon: '☕',
        unlocked: false,
        check: () => this.getProducerCount('coffee') >= 1
      },
      {
        id: 'energy_rush',
        title: 'Не спать, кодить!',
        desc: 'Запаситесь 5 банками энергетика',
        memeTag: 'ТАУРИНОВЫЙ БОГ ⚡',
        memeQuote: '«Сердце бьется со скоростью 240 FPS в 4K разрешении»',
        icon: '🔋',
        unlocked: false,
        check: () => this.getProducerCount('energy') >= 5
      },
      {
        id: 'gpu_mining',
        title: 'Ферма настроения',
        desc: 'Установите хотя бы 1 видеокарту RTX 5090',
        memeTag: 'ВЕНТИЛЯТОРЫ В АСТРАЛЕ 🚀',
        memeQuote: '«Соседи жалуются на гул, но майнинг чистого кайфа продолжается»',
        icon: '🎮',
        unlocked: false,
        check: () => this.getProducerCount('gpu') >= 1
      },
      {
        id: 'deepseek_unlock',
        title: 'Китайский прорыв',
        desc: 'Наймите первую нейросеть DeepSeek',
        memeTag: 'КИТАЙСКИЙ ФЛЕКС 🐳',
        memeQuote: '«DeepSeek посчитал твой вайб за 3 копейки и уронил рынок Nasdaq»',
        icon: '🐳',
        unlocked: false,
        check: () => this.getProducerCount('deepseek') >= 1
      },
      {
        id: 'claude_unlock',
        title: 'Святой Клод',
        desc: 'Разблокируйте и наймите Claude 3.7',
        memeTag: 'БОЖЕСТВЕННЫЙ КОДЕР 🧠',
        memeQuote: '«Клод молча переписал твою жизнь без багов и с чистой архитектурой»',
        icon: '🧠',
        unlocked: false,
        check: () => this.getProducerCount('claude') >= 1
      },
      {
        id: 'first_rebirth',
        title: 'Квантовый Скачок',
        desc: 'Совершите первое перерождение эры',
        memeTag: 'ПЕРЕРОЖДЕНИЕ В БОЖЕСТВО 🌌',
        memeQuote: '«Предыдущая реальность стерта. Ты переродился на новом уровне матрицы!»',
        icon: '🌌',
        unlocked: false,
        check: () => this.rebirthLevel >= 1
      },
      {
        id: 'fever_activate',
        title: 'Максимальный овердрайв',
        desc: 'Разгоните комбо-полосу до режима ГИПЕР-ВАЙБ',
        memeTag: 'ПОЛНЫЙ РАЗНОС 🔥',
        memeQuote: '«Множитель x3.5! Музыка орет, ядро пульсирует, глаза горят!»',
        icon: '🔥',
        unlocked: false,
        check: () => this.feverActive
      },
      {
        id: 'catch_bonus',
        title: 'Охотник за удачей',
        desc: 'Поймайте летающий неоновый кристалл',
        memeTag: 'АХАХАХ ХВАТАЙ ЕГО 💎',
        memeQuote: '«Реакция мангуста. Джекпот мгновенно упал на баланс»',
        icon: '💎',
        unlocked: false,
        check: () => this.totalBonuses >= 1
      },
      {
        id: 'score_100k',
        title: 'Вайб-миллионер',
        desc: 'Накопите суммарно 100,000 очков вайба',
        memeTag: 'КАПИТАЛИЗМ ВЫШЕЛ НА СВЯЗЬ 💰',
        memeQuote: '«Уолл-стрит завидует твоему пассивному доходу в матрице»',
        icon: '💰',
        unlocked: false,
        check: () => this.totalScoreEarned >= 100000
      },
      {
        id: 'score_10m',
        title: 'Вайб-олигарх',
        desc: 'Накопите суммарно 10,000,000 очков вайба',
        memeTag: 'МАТРИЦА СХЛОПНУЛАСЬ 👑',
        memeQuote: '«Денег столько, что сервер переходит на квантовые числа»',
        icon: '👑',
        unlocked: false,
        check: () => this.totalScoreEarned >= 10000000
      },
      {
        id: 'vps_10k',
        title: 'Полный автопилот',
        desc: 'Достигните пассивного дохода более 10,000 вайба/сек',
        icon: '🚀',
        memeTag: 'СКАЙНЕТ ПЛАЧЕТ В УГЛУ 🤖',
        memeQuote: '«Ты просто пьешь кофе, пока нейросети фармят реальность за тебя»',
        unlocked: false,
        check: () => this.calculateVps() >= 10000
      },
      {
        id: 'shards_50',
        title: 'Нейро-магнат',
        desc: 'Заработайте 50 Нейро-Осколков',
        icon: '💠',
        memeTag: 'КВАНТОВЫЙ ВЛАДЫКА 💠',
        memeQuote: '«Осколки вселенной сверкают на твоем мета-счету»',
        unlocked: false,
        check: () => this.totalShardsEarned >= 50
      }
    ];

    // DOM Bindings
    this.dom = {
      score: document.getElementById('score-display'),
      vps: document.getElementById('vps-display'),
      vpc: document.getElementById('vpc-display'),
      comboBar: document.getElementById('combo-bar'),
      comboMult: document.getElementById('combo-multiplier'),
      comboStatus: document.getElementById('combo-status'),

      // Click Area
      clickerSection: document.getElementById('clicker-section'),
      coreStage: document.getElementById('core-stage'),
      vibeCore: document.getElementById('vibe-core'),
      coreSymbolIcon: document.getElementById('core-symbol-icon'),
      floatContainer: document.getElementById('float-container'),
      luckyCrystal: document.getElementById('lucky-crystal'),
      orbitBadgesContainer: document.getElementById('orbit-badges-container'),
      activeBuffs: document.getElementById('active-buffs'),

      // Header Elements
      headerLogoIcon: document.getElementById('header-logo-icon'),
      currentEraBadge: document.getElementById('current-era-badge'),
      btnRebirth: document.getElementById('btn-rebirth'),
      rebirthBtnText: document.getElementById('rebirth-btn-text'),
      rebirthPill: document.getElementById('rebirth-pill'),
      btnRebirthShop: document.getElementById('btn-rebirth-shop'),
      shardsDisplay: document.getElementById('shards-display'),

      // Shop lists
      producersList: document.getElementById('producers-list'),
      boostersList: document.getElementById('boosters-list'),
      achievementsList: document.getElementById('achievements-list'),
      achievementsCount: document.getElementById('achievements-count'),
      saveIndicator: document.getElementById('save-indicator'),
      toastContainer: document.getElementById('toast-container'),

      // Modals
      modalStats: document.getElementById('modal-stats'),
      modalSettings: document.getElementById('modal-settings'),
      modalOffline: document.getElementById('modal-offline'),
      modalRebirth: document.getElementById('modal-rebirth'),
      modalRebirthShop: document.getElementById('modal-rebirth-shop'),

      // Rebirth Modal Elements
      rebirthCurAvatar: document.getElementById('rebirth-cur-avatar'),
      rebirthCurName: document.getElementById('rebirth-cur-name'),
      rebirthNextAvatar: document.getElementById('rebirth-next-avatar'),
      rebirthNextName: document.getElementById('rebirth-next-name'),
      rebirthEraQuote: document.getElementById('rebirth-era-quote'),
      rebirthClicksNum: document.getElementById('rebirth-clicks-num'),
      rebirthBarFill: document.getElementById('rebirth-bar-fill'),
      rebirthShardsReward: document.getElementById('rebirth-shards-reward'),
      btnDoRebirth: document.getElementById('btn-do-rebirth'),
      modalShardsCount: document.getElementById('modal-shards-count'),
      rebirthUpgradesList: document.getElementById('rebirth-upgrades-list'),
      rebirthWarpOverlay: document.getElementById('rebirth-warp-overlay'),
      warpEraTitle: document.getElementById('warp-era-title'),

      // Audio buttons
      btnAudio: document.getElementById('btn-audio'),
      btnMusic: document.getElementById('btn-music')
    };

    this.autoTapTimer = 0;
    this.init();
  }

  getProducerCount(id) {
    const prod = this.producers.find(p => p.id === id);
    return prod ? prod.count : 0;
  }

  getBoosterCount(id) {
    const b = this.boosters.find(x => x.id === id);
    return b ? b.count : 0;
  }

  getRebirthUpgradeLvl(id) {
    const u = this.rebirthUpgrades.find(x => x.id === id);
    return u ? u.level : 0;
  }

  getCurrentEra() {
    return this.eras[Math.min(this.rebirthLevel, this.eras.length - 1)];
  }

  getNextEra() {
    const nextIdx = Math.min(this.rebirthLevel + 1, this.eras.length - 1);
    return this.eras[nextIdx];
  }

  getClicksNeededForRebirth() {
    const cur = this.getCurrentEra();
    return cur.clicksNeeded;
  }

  init() {
    this.loadGame();
    this.applyEraTheme();
    this.setupEventListeners();
    this.renderShop();
    this.renderAchievements();
    this.renderRebirthShop();
    this.renderOrbitBadges();
    this.updateUI();

    // Start Main Game Loop
    requestAnimationFrame((t) => this.gameLoop(t));

    // Auto-save interval (every 4 seconds)
    setInterval(() => this.saveGame(), 4000);

    // Schedule lucky crystal in left clicker area
    this.scheduleLuckyCrystal();
  }

  /**
   * Apply Theme for Current Rebirth Era
   */
  applyEraTheme() {
    const era = this.getCurrentEra();

    // Remove all old era classes
    document.body.className = '';
    document.body.classList.add(era.themeClass);

    // Update symbols & badges
    this.dom.currentEraBadge.textContent = `Эра: ${era.name}`;
    this.dom.headerLogoIcon.textContent = era.icon;
    this.dom.coreSymbolIcon.textContent = era.icon;

    if (this.dom.rebirthCurAvatar) {
      this.dom.rebirthCurAvatar.textContent = era.icon;
      this.dom.rebirthCurName.textContent = era.name;
    }
  }

  /**
   * Calculate current Passive Vibe Per Second (VPS)
   */
  calculateVps() {
    let base = 0;
    for (const prod of this.producers) {
      base += prod.count * prod.baseVps;
    }

    // Multiply by active temporary buffs
    let multiplier = 1;
    for (const buff of this.activeBuffs) {
      multiplier *= buff.multiplier;
    }

    if (this.feverActive) {
      multiplier *= 2; // Extra x2 during Fever for passive income
    }

    // Rebirth Quantum Multiplier (+50% per level)
    const quantumLvl = this.getRebirthUpgradeLvl('quantum_mult');
    if (quantumLvl > 0) {
      multiplier *= (1 + quantumLvl * 0.5);
    }

    return base * multiplier;
  }

  /**
   * Calculate current Click Power (VPC)
   */
  calculateVpc() {
    let base = 1;

    for (const booster of this.boosters) {
      if (booster.bonusVpc) {
        base += booster.count * booster.bonusVpc;
      }
    }

    // Resonance booster: adds percentage of passive income
    const resonanceCount = this.getBoosterCount('resonance');
    if (resonanceCount > 0) {
      const vps = this.calculateVps();
      base += vps * (resonanceCount * 0.015);
    }

    // Combo multiplier: 1.0x to 3.0x
    let comboMult = 1 + (this.combo / this.maxCombo) * 2;
    if (this.feverActive) {
      comboMult = 3.5;
    }

    // Buffs
    let buffMult = 1;
    for (const buff of this.activeBuffs) {
      buffMult *= buff.multiplier;
    }

    // Rebirth Quantum Multiplier
    const quantumLvl = this.getRebirthUpgradeLvl('quantum_mult');
    if (quantumLvl > 0) {
      buffMult *= (1 + quantumLvl * 0.5);
    }

    return Math.max(1, base * comboMult * buffMult);
  }

  /**
   * Handle Click in the Large Click Zone
   */
  handleClick(e) {
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX || window.innerWidth / 3;
      clientY = e.clientY || window.innerHeight / 2;
    }

    // Critical click calculation
    const critLevel = this.getBoosterCount('crit_luck');
    const hyperCritLvl = this.getRebirthUpgradeLvl('hyper_crit');
    const critChance = (critLevel * 0.12) + (hyperCritLvl * 0.03);
    const isCrit = critChance > 0 && Math.random() < critChance;

    let earned = this.calculateVpc();
    const critMult = hyperCritLvl > 0 ? (5 + hyperCritLvl * 2) : 5;
    if (isCrit) {
      earned *= critMult;
    }

    this.score += earned;
    this.totalScoreEarned += earned;
    this.totalClicks++;

    // Rebirth progress clicks (dynamic: Fever x2, Crit x3)
    let rebirthIncrement = 1;
    if (this.feverActive) rebirthIncrement = 2;
    if (isCrit) rebirthIncrement = Math.max(rebirthIncrement, 3);
    this.rebirthClicks += rebirthIncrement;

    // Increment combo
    this.combo = Math.min(this.maxCombo, this.combo + 9);
    if (this.combo >= this.maxCombo && !this.feverActive) {
      this.triggerFever();
    }

    // Visual feedback on the core
    this.dom.vibeCore.classList.remove('clicked');
    void this.dom.vibeCore.offsetWidth;
    this.dom.vibeCore.classList.add('clicked');

    // Spawn floating numbers at click location
    this.spawnFloatingNumber(clientX, clientY, earned, isCrit);

    // Spawn canvas particles & shockwave
    if (window.neonParticles) {
      window.neonParticles.spawnClickBurst(clientX, clientY, isCrit);
    }

    // Play click synth audio
    if (window.neonAudio) {
      const comboStep = (this.combo / this.maxCombo) * 10;
      window.neonAudio.playClick(comboStep, isCrit);
    }

    this.checkAchievements();
  }

  /**
   * Spawn Floating Text (+1, +25, CRIT!)
   */
  spawnFloatingNumber(x, y, value, isCrit) {
    const el = document.createElement('div');
    el.className = 'floating-num' + (isCrit ? ' crit' : '');

    const formatted = formatNumber(value);
    el.innerHTML = isCrit ? `🔥 КРИТ! +${formatted}` : `+${formatted}`;

    const rot = (Math.random() - 0.5) * 30;
    el.style.setProperty('--rot', `${rot}deg`);

    const rect = this.dom.floatContainer.getBoundingClientRect();
    const posX = x - rect.left;
    const posY = y - rect.top;

    el.style.left = `${posX}px`;
    el.style.top = `${posY}px`;

    this.dom.floatContainer.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 900);
  }

  /**
   * Trigger Fever Mode
   */
  triggerFever() {
    this.feverActive = true;
    this.feverTimer = 10;
    this.dom.vibeCore.classList.add('fever-mode');
    this.dom.comboBar.classList.add('fever');

    if (window.neonAudio) {
      window.neonAudio.playFever();
    }

    this.showToast('🔥 ГИПЕР-ВАЙБ АКТИВИРОВАН!', 'x3.5 множитель клика и x2 скорость набивания перерождения!', 'fever-toast', 'ОХУЖЕТОТВАЙБ 🔥');
    this.checkAchievements();
  }

  endFever() {
    this.feverActive = false;
    this.combo = 0;
    this.dom.vibeCore.classList.remove('fever-mode');
    this.dom.comboBar.classList.remove('fever');
  }

  /**
   * Lucky Glitch Crystal (Strictly confined to Left Clicker Zone)
   */
  scheduleLuckyCrystal() {
    const magnetLvl = this.getRebirthUpgradeLvl('crystal_magnet');
    const delayBase = magnetLvl > 0 ? 25000 : 40000;
    const delay = delayBase + Math.random() * 25000;

    setTimeout(() => {
      this.spawnLuckyCrystal();
    }, delay);
  }

  spawnLuckyCrystal() {
    const el = this.dom.luckyCrystal;
    const section = this.dom.clickerSection;
    if (!el || !section) return;

    el.classList.remove('hidden');

    const secRect = section.getBoundingClientRect();
    const maxX = Math.max(100, secRect.width - 80);
    const maxY = Math.max(180, secRect.height - 100);

    let posX = Math.random() > 0.5 ? 20 : maxX - 20;
    let posY = 100 + Math.random() * (maxY - 140);
    let speedX = (posX < maxX / 2 ? 1 : -1) * (1.8 + Math.random() * 1.2);
    let speedY = (Math.random() - 0.5) * 1.5;

    el.style.left = `${posX}px`;
    el.style.top = `${posY}px`;

    let lifeTime = 0;
    const maxLife = 14000; // 14 seconds to catch

    const moveInterval = setInterval(() => {
      posX += speedX;
      posY += speedY;
      lifeTime += 25;

      // Bounce inside clicker section edges
      if (posX <= 10 || posX >= maxX) speedX = -speedX;
      if (posY <= 70 || posY >= maxY) speedY = -speedY;

      el.style.left = `${posX}px`;
      el.style.top = `${posY}px`;

      if (lifeTime >= maxLife) {
        clearInterval(moveInterval);
        el.classList.add('hidden');
        this.scheduleLuckyCrystal();
      }
    }, 25);

    const clickHandler = (e) => {
      e.stopPropagation();
      clearInterval(moveInterval);
      el.classList.add('hidden');
      el.removeEventListener('click', clickHandler);

      this.claimLuckyCrystal(posX, posY);
      this.scheduleLuckyCrystal();
    };

    el.addEventListener('click', clickHandler, { once: true });
  }

  claimLuckyCrystal(x, y) {
    this.totalBonuses++;

    // Random reward: Either huge instant vibe, bonus clicks to rebirth, or a 20s x3 Frenzy buff!
    const roll = Math.random();
    const vps = this.calculateVps();

    if (roll < 0.35) {
      // Rebirth clicks jump
      const bonusClicks = 25 + (this.rebirthLevel * 10);
      this.rebirthClicks += bonusClicks;
      this.showToast('💎 КВАНТОВЫЙ БОНУС!', `+${bonusClicks} кликов мгновенно добавлено к прогрессу перерождения!`, 'meme-toast', 'СКОРОСТНОЙ СКАЧОК 🚀');
    } else if (roll < 0.65 && vps > 0) {
      // 20s Frenzy buff
      this.activeBuffs.push({
        id: 'frenzy_' + Date.now(),
        name: 'Неоновый Раш',
        icon: '⚡',
        multiplier: 3,
        duration: 20
      });
      this.showToast('💎 ГЛИТЧ-КРИСТАЛЛ!', 'Активирован x3 Неоновый Раш на 20 секунд!', 'meme-toast', 'МАКСИМАЛЬНЫЙ ФАРМ ⚡');
    } else {
      // Instant vibe chunk
      const reward = Math.max(120, Math.floor(vps * 45) + (this.calculateVpc() * 30));
      this.score += reward;
      this.totalScoreEarned += reward;
      this.showToast('💎 ГЛИТЧ-КРИСТАЛЛ!', `Получено +${formatNumber(reward)} очков вайба моментально!`, 'meme-toast', 'ДЖЕКПОТ УДАЧИ 💰');
    }

    if (window.neonAudio) {
      window.neonAudio.playBonus();
    }
    if (window.neonParticles) {
      const rect = this.dom.clickerSection.getBoundingClientRect();
      window.neonParticles.spawnClickBurst(rect.left + x, rect.top + y, true);
    }

    this.checkAchievements();
  }

  /**
   * Orbiting Badges of Owned AI & Upgrades (Near the Core)
   */
  renderOrbitBadges() {
    const container = this.dom.orbitBadgesContainer;
    if (!container) return;

    // Collect all owned items
    const owned = [];
    for (const prod of this.producers) {
      if (prod.count > 0) {
        owned.push({ icon: prod.icon, count: prod.count, name: prod.name });
      }
    }

    let html = '';
    const total = owned.length;
    if (total > 0) {
      const radius = total > 5 ? 135 : 120;
      owned.forEach((item, idx) => {
        const angle = (idx / total) * 360;
        const orbitDur = 14 + (idx % 3) * 4;
        html += `
          <div class="orbit-badge" style="--angle: ${angle}deg; --radius: ${radius}px; --orbit-dur: ${orbitDur}s;" title="${item.name} ×${item.count}">
            <span>${item.icon}</span>
            <span class="badge-count">${item.count}</span>
          </div>
        `;
      });
    }

    container.innerHTML = html;
  }

  /**
   * Main Game Loop
   */
  gameLoop(timestamp) {
    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    if (dt > 0 && dt < 5) {
      // Passive income
      const vps = this.calculateVps();
      const earned = vps * dt;
      this.score += earned;
      this.totalScoreEarned += earned;

      // Auto-tapper perk from rebirth shop
      const autoTapLvl = this.getRebirthUpgradeLvl('auto_tapper');
      if (autoTapLvl > 0) {
        this.autoTapTimer += dt;
        const tapInterval = 1 / (autoTapLvl * 2);
        if (this.autoTapTimer >= tapInterval) {
          this.autoTapTimer = 0;
          const rect = this.dom.vibeCore.getBoundingClientRect();
          this.handleClick({
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
          });
        }
      }

      // Combo decay
      if (!this.feverActive && this.combo > 0) {
        this.combo = Math.max(0, this.combo - this.comboDecayRate * dt);
      }

      // Fever countdown
      if (this.feverActive) {
        this.feverTimer -= dt;
        if (this.feverTimer <= 0) {
          this.endFever();
        }
      }

      // Active buffs countdown
      for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
        this.activeBuffs[i].duration -= dt;
        if (this.activeBuffs[i].duration <= 0) {
          this.activeBuffs.splice(i, 1);
        }
      }
    }

    this.updateUI();
    this.checkAchievements();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Update UI Displays
   */
  updateUI() {
    this.dom.score.textContent = formatNumber(this.score);
    this.dom.vps.textContent = formatNumber(this.calculateVps());
    this.dom.vpc.textContent = formatNumber(this.calculateVpc());
    this.dom.shardsDisplay.textContent = formatNumber(this.neuroShards);
    if (this.dom.modalShardsCount) {
      this.dom.modalShardsCount.textContent = formatNumber(this.neuroShards);
    }

    // Combo bar
    const comboPercent = this.feverActive
      ? (this.feverTimer / 10) * 100
      : (this.combo / this.maxCombo) * 100;

    this.dom.comboBar.style.width = `${Math.min(100, Math.max(0, comboPercent))}%`;

    if (this.feverActive) {
      this.dom.comboMult.textContent = 'x3.5 FEVER!';
      this.dom.comboStatus.textContent = `Осталось ${Math.ceil(this.feverTimer)}с 🔥`;
    } else {
      const mult = (1 + (this.combo / this.maxCombo) * 2).toFixed(1);
      this.dom.comboMult.textContent = `x${mult}`;
      this.dom.comboStatus.textContent = this.combo > 20 ? 'Держи темп!' : 'Кликай быстрее!';
    }

    // Rebirth progress pill & button
    const clicksNeeded = this.getClicksNeededForRebirth();
    const canRebirth = this.rebirthClicks >= clicksNeeded;
    this.dom.rebirthPill.textContent = `${this.rebirthClicks}/${clicksNeeded} 👆`;

    if (canRebirth) {
      this.dom.btnRebirth.classList.add('ready-pulse');
      this.dom.rebirthPill.style.color = '#00ff88';
      this.dom.rebirthPill.textContent = 'ГОТОВО! 🌌';
    } else {
      this.dom.btnRebirth.classList.remove('ready-pulse');
      this.dom.rebirthPill.style.color = 'var(--neon-yellow)';
    }

    // Active buffs pill
    this.renderBuffPills();

    // Fast affordability check
    this.updateShopAffordability();
  }

  renderBuffPills() {
    let html = '';
    for (const buff of this.activeBuffs) {
      html += `
        <div class="buff-pill">
          <span>${buff.icon}</span>
          <span>${buff.name} (x${buff.multiplier})</span>
          <span>${Math.ceil(buff.duration)}с</span>
        </div>
      `;
    }
    this.dom.activeBuffs.innerHTML = html;
  }

  /**
   * Shop Methods
   */
  getProducerCost(prod) {
    return Math.floor(prod.baseCost * Math.pow(prod.costMult, prod.count));
  }

  getBoosterCost(booster) {
    return Math.floor(booster.baseCost * Math.pow(booster.costMult, booster.count));
  }

  buyProducer(id) {
    const prod = this.producers.find(p => p.id === id);
    if (!prod) return;

    const cost = this.getProducerCost(prod);
    if (this.score >= cost) {
      this.score -= cost;
      prod.count++;

      if (window.neonAudio) {
        window.neonAudio.playBuy();
      }

      this.renderShop();
      this.renderOrbitBadges();
      this.checkAchievements();
    }
  }

  buyBooster(id) {
    const booster = this.boosters.find(b => b.id === id);
    if (!booster) return;

    if (booster.maxCount && booster.count >= booster.maxCount) return;

    const cost = this.getBoosterCost(booster);
    if (this.score >= cost) {
      this.score -= cost;
      booster.count++;

      if (window.neonAudio) {
        window.neonAudio.playBuy();
      }

      this.renderShop();
      this.checkAchievements();
    }
  }

  renderShop() {
    // 1. Producers (AI and hardware generators)
    let prodHtml = '';
    for (const prod of this.producers) {
      const cost = this.getProducerCost(prod);
      const canAfford = this.score >= cost;
      const totalIncome = prod.count * prod.baseVps;

      prodHtml += `
        <div class="shop-item-card ${canAfford ? '' : 'cant-afford'}" data-buy-prod="${prod.id}">
          <div class="item-icon-box">${prod.icon}</div>
          <div class="item-details">
            <div class="item-top-row">
              <span class="item-title">${prod.name}</span>
              <span class="item-owned">×${prod.count}</span>
            </div>
            <p class="item-desc">${prod.desc}</p>
            <div class="item-stats-row">
              <span class="item-production">+${formatNumber(prod.baseVps)}/сек ${prod.count > 0 ? `(всего +${formatNumber(totalIncome)})` : ''}</span>
              <div class="item-cost-btn">
                <span>✨</span>
                <span>${formatNumber(cost)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    this.dom.producersList.innerHTML = prodHtml;

    // 2. Click Boosters
    let boostHtml = '';
    for (const b of this.boosters) {
      const isMaxed = b.maxCount && b.count >= b.maxCount;
      const cost = this.getBoosterCost(b);
      const canAfford = this.score >= cost && !isMaxed;

      boostHtml += `
        <div class="shop-item-card ${canAfford ? '' : 'cant-afford'} ${isMaxed ? 'disabled' : ''}" data-buy-boost="${b.id}">
          <div class="item-icon-box">${b.icon}</div>
          <div class="item-details">
            <div class="item-top-row">
              <span class="item-title">${b.name}</span>
              <span class="item-owned">${isMaxed ? 'MAX' : `ур. ${b.count}`}</span>
            </div>
            <p class="item-desc">${b.desc}</p>
            <div class="item-stats-row">
              <span class="item-production">${b.bonusVpc ? `+${b.bonusVpc} к клику` : ''}</span>
              <div class="item-cost-btn">
                ${isMaxed ? '<span>МАКСИМУМ</span>' : `<span>✨</span><span>${formatNumber(cost)}</span>`}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    this.dom.boostersList.innerHTML = boostHtml;

    // Click bindings
    this.dom.producersList.querySelectorAll('[data-buy-prod]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-buy-prod');
        this.buyProducer(id);
      });
    });

    this.dom.boostersList.querySelectorAll('[data-buy-boost]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-buy-boost');
        this.buyBooster(id);
      });
    });
  }

  updateShopAffordability() {
    this.dom.producersList.querySelectorAll('[data-buy-prod]').forEach(card => {
      const id = card.getAttribute('data-buy-prod');
      const prod = this.producers.find(p => p.id === id);
      if (prod) {
        const cost = this.getProducerCost(prod);
        if (this.score >= cost) {
          card.classList.remove('cant-afford');
        } else {
          card.classList.add('cant-afford');
        }
      }
    });

    this.dom.boostersList.querySelectorAll('[data-buy-boost]').forEach(card => {
      const id = card.getAttribute('data-buy-boost');
      const b = this.boosters.find(x => x.id === id);
      if (b) {
        const isMax = b.maxCount && b.count >= b.maxCount;
        if (!isMax) {
          const cost = this.getBoosterCost(b);
          if (this.score >= cost) {
            card.classList.remove('cant-afford');
          } else {
            card.classList.add('cant-afford');
          }
        }
      }
    });
  }

  /**
   * Rebirth / Prestige Logic
   */
  calculateRebirthReward() {
    const baseReward = 10;
    const scoreBonus = Math.floor(Math.sqrt(this.totalScoreEarned / 800));
    return (baseReward + scoreBonus) * (this.rebirthLevel + 1);
  }

  openRebirthModal() {
    const cur = this.getCurrentEra();
    const next = this.getNextEra();
    const needed = this.getClicksNeededForRebirth();
    const canRebirth = this.rebirthClicks >= needed;
    const shards = this.calculateRebirthReward();

    this.dom.rebirthCurAvatar.textContent = cur.icon;
    this.dom.rebirthCurName.textContent = cur.name;

    this.dom.rebirthNextAvatar.textContent = next.icon;
    this.dom.rebirthNextName.textContent = next.name;
    this.dom.rebirthEraQuote.textContent = next.quote;

    this.dom.rebirthClicksNum.textContent = `${this.rebirthClicks} / ${needed}`;
    const fillPercent = Math.min(100, (this.rebirthClicks / needed) * 100);
    this.dom.rebirthBarFill.style.width = `${fillPercent}%`;
    this.dom.rebirthShardsReward.textContent = formatNumber(shards);

    if (canRebirth) {
      this.dom.btnDoRebirth.classList.remove('disabled');
      this.dom.btnDoRebirth.disabled = false;
    } else {
      this.dom.btnDoRebirth.classList.add('disabled');
      this.dom.btnDoRebirth.disabled = true;
    }

    this.dom.modalRebirth.classList.remove('hidden');
  }

  doRebirth() {
    const needed = this.getClicksNeededForRebirth();
    if (this.rebirthClicks < needed) return;

    const shardsEarned = this.calculateRebirthReward();
    this.neuroShards += shardsEarned;
    this.totalShardsEarned += shardsEarned;
    this.rebirthLevel++;
    this.rebirthClicks = 0;

    // Close rebirth modal
    this.dom.modalRebirth.classList.add('hidden');

    // Trigger Fullscreen Cyber Warp Grid Overlay Animation
    const overlay = this.dom.rebirthWarpOverlay;
    const nextEra = this.getCurrentEra();
    this.dom.warpEraTitle.textContent = `ЭРА: ${nextEra.name} ${nextEra.icon}`;

    overlay.classList.remove('hidden');
    if (window.neonAudio) {
      window.neonAudio.playRebirth();
    }

    // Reset standard stats
    this.score = 0;
    this.combo = 0;
    this.feverActive = false;

    // Apply fast start perk
    const fastStartLvl = this.getRebirthUpgradeLvl('fast_start');
    for (const prod of this.producers) {
      if (prod.id === 'coffee') {
        prod.count = fastStartLvl * 5;
      } else if (prod.id === 'energy') {
        prod.count = fastStartLvl * 2;
      } else {
        prod.count = 0;
      }
    }

    // Reset boosters
    for (const b of this.boosters) {
      b.count = 0;
    }

    // Update theme and UI
    this.applyEraTheme();
    this.renderShop();
    this.renderOrbitBadges();
    this.renderRebirthShop();
    this.saveGame();

    setTimeout(() => {
      overlay.classList.add('hidden');
      this.showToast('🌌 КВАНТОВОЕ ПЕРЕРОЖДЕНИЕ!', `Добро пожаловать в эру ${nextEra.name}! +${formatNumber(shardsEarned)} осколков получено!`, 'meme-toast', 'СМЕНА МАТРИЦЫ 🌌');
    }, 3400);

    this.checkAchievements();
  }

  /**
   * Rebirth Shop Logic
   */
  renderRebirthShop() {
    let html = '';
    for (const u of this.rebirthUpgrades) {
      const cost = Math.floor(u.baseCost * Math.pow(u.costMult, u.level));
      const isMax = u.maxLevel && u.level >= u.maxLevel;
      const canAfford = this.neuroShards >= cost && !isMax;

      html += `
        <div class="shop-item-card ${canAfford ? '' : 'cant-afford'} ${isMax ? 'disabled' : ''}" data-buy-rebirth-up="${u.id}">
          <div class="item-icon-box">${u.icon}</div>
          <div class="item-details">
            <div class="item-top-row">
              <span class="item-title">${u.name}</span>
              <span class="item-owned">${isMax ? 'MAX' : `ур. ${u.level}`}</span>
            </div>
            <p class="item-desc">${u.desc}</p>
            <div class="item-stats-row">
              <span class="item-production">Постоянный перк</span>
              <div class="item-cost-btn">
                ${isMax ? '<span>МАКС</span>' : `<span>💠</span><span>${formatNumber(cost)}</span>`}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    this.dom.rebirthUpgradesList.innerHTML = html;

    this.dom.rebirthUpgradesList.querySelectorAll('[data-buy-rebirth-up]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-buy-rebirth-up');
        this.buyRebirthUpgrade(id);
      });
    });
  }

  buyRebirthUpgrade(id) {
    const u = this.rebirthUpgrades.find(x => x.id === id);
    if (!u) return;

    if (u.maxLevel && u.level >= u.maxLevel) return;

    const cost = Math.floor(u.baseCost * Math.pow(u.costMult, u.level));
    if (this.neuroShards >= cost) {
      this.neuroShards -= cost;
      u.level++;

      if (window.neonAudio) {
        window.neonAudio.playBuy();
      }

      this.renderRebirthShop();
      this.updateUI();
      this.saveGame();
    }
  }

  /**
   * Meme Achievements System
   */
  checkAchievements() {
    let unlockedAny = false;
    let unlockedTotal = 0;

    for (const ach of this.achievements) {
      if (!ach.unlocked && ach.check()) {
        ach.unlocked = true;
        unlockedAny = true;
        this.showToast(ach.title, ach.memeQuote || ach.desc, 'meme-toast', ach.memeTag || '🏆 ДОСТИЖЕНИЕ!');
        if (window.neonAudio) {
          window.neonAudio.playAchievement();
        }
      }
      if (ach.unlocked) unlockedTotal++;
    }

    if (unlockedAny) {
      this.renderAchievements();
    }

    this.dom.achievementsCount.textContent = `${unlockedTotal}/${this.achievements.length}`;
  }

  renderAchievements() {
    let html = '';
    for (const ach of this.achievements) {
      html += `
        <div class="achievement-card ${ach.unlocked ? 'unlocked' : ''}">
          <div class="ach-icon">${ach.icon}</div>
          <div class="ach-info">
            <h4 class="ach-title">${ach.title}</h4>
            <p class="ach-desc">${ach.desc}</p>
          </div>
        </div>
      `;
    }
    this.dom.achievementsList.innerHTML = html;
  }

  /**
   * Meme Toast Notification with custom Meme Tag
   */
  showToast(title, desc, type = '', tag = '⚡ ВАЙБ-СИСТЕМА') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">⚡</div>
      <div class="toast-content">
        <span class="toast-meme-tag">${tag}</span>
        <span class="toast-title">${title}</span>
        <span class="toast-desc">${desc}</span>
      </div>
    `;

    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4500);
  }

  /**
   * Save & Load Engine
   */
  saveGame() {
    try {
      const data = {
        score: this.score,
        totalScoreEarned: this.totalScoreEarned,
        totalClicks: this.totalClicks,
        totalBonuses: this.totalBonuses,
        rebirthLevel: this.rebirthLevel,
        rebirthClicks: this.rebirthClicks,
        neuroShards: this.neuroShards,
        totalShardsEarned: this.totalShardsEarned,
        startTime: this.startTime,
        lastSaveTime: Date.now(),
        producers: this.producers.map(p => ({ id: p.id, count: p.count })),
        boosters: this.boosters.map(b => ({ id: b.id, count: b.count })),
        rebirthUpgrades: this.rebirthUpgrades.map(u => ({ id: u.id, level: u.level })),
        achievements: this.achievements.filter(a => a.unlocked).map(a => a.id)
      };

      localStorage.setItem(this.saveKey, JSON.stringify(data));

      if (this.dom.saveIndicator) {
        this.dom.saveIndicator.style.opacity = '1';
        setTimeout(() => {
          if (this.dom.saveIndicator) this.dom.saveIndicator.style.opacity = '0.5';
        }, 800);
      }
    } catch (e) {
      console.warn('Game save failed', e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return;

      const data = JSON.parse(raw);
      this.score = data.score || 0;
      this.totalScoreEarned = data.totalScoreEarned || this.score;
      this.totalClicks = data.totalClicks || 0;
      this.totalBonuses = data.totalBonuses || 0;
      this.rebirthLevel = data.rebirthLevel || 0;
      this.rebirthClicks = data.rebirthClicks || 0;
      this.neuroShards = data.neuroShards || 0;
      this.totalShardsEarned = data.totalShardsEarned || 0;
      this.startTime = data.startTime || Date.now();

      // Producers
      if (data.producers) {
        for (const saved of data.producers) {
          const prod = this.producers.find(p => p.id === saved.id);
          if (prod) prod.count = saved.count;
        }
      }

      // Boosters
      if (data.boosters) {
        for (const saved of data.boosters) {
          const b = this.boosters.find(x => x.id === saved.id);
          if (b) b.count = saved.count;
        }
      }

      // Rebirth Upgrades
      if (data.rebirthUpgrades) {
        for (const saved of data.rebirthUpgrades) {
          const u = this.rebirthUpgrades.find(x => x.id === saved.id);
          if (u) u.level = saved.level;
        }
      }

      // Achievements
      if (data.achievements) {
        for (const achId of data.achievements) {
          const a = this.achievements.find(x => x.id === achId);
          if (a) a.unlocked = true;
        }
      }

      // Offline Progress Calculation
      if (data.lastSaveTime) {
        const elapsedSec = (Date.now() - data.lastSaveTime) / 1000;
        if (elapsedSec > 10) {
          this.processOfflineProgress(elapsedSec);
        }
      }
    } catch (e) {
      console.warn('Game load failed', e);
    }
  }

  processOfflineProgress(elapsedSec) {
    const cappedSec = Math.min(elapsedSec, 12 * 3600);
    const vps = this.calculateVps();

    if (vps > 0 && cappedSec >= 15) {
      const earned = Math.floor(vps * cappedSec * 0.7);

      if (earned > 0) {
        this.offlinePendingReward = earned;

        const min = Math.floor(cappedSec / 60);
        const timeStr = min > 60 ? `${Math.floor(min / 60)}ч ${min % 60}мин` : `${min}мин`;

        document.getElementById('offline-time').textContent = timeStr;
        document.getElementById('offline-earned').textContent = `+${formatNumber(earned)}`;
        this.dom.modalOffline.classList.remove('hidden');
      }
    }
  }

  resetGame() {
    if (confirm('Вы уверены, что хотите полностью сбросить весь неоновый прогресс? Это действие необратимо!')) {
      localStorage.removeItem(this.saveKey);
      window.location.reload();
    }
  }

  exportSave() {
    try {
      this.saveGame();
      const raw = localStorage.getItem(this.saveKey);
      const b64 = btoa(unescape(encodeURIComponent(raw)));
      navigator.clipboard.writeText(b64).then(() => {
        alert('Код сохранения скопирован в буфер обмена!');
      }).catch(() => {
        prompt('Скопируйте этот код сохранения:', b64);
      });
    } catch (e) {
      alert('Ошибка при экспорте: ' + e.message);
    }
  }

  importSave() {
    const input = prompt('Вставьте код сохранения:');
    if (!input) return;
    try {
      const jsonStr = decodeURIComponent(escape(atob(input.trim())));
      JSON.parse(jsonStr);
      localStorage.setItem(this.saveKey, jsonStr);
      alert('Сохранение успешно загружено!');
      window.location.reload();
    } catch (e) {
      alert('Неверный код сохранения!');
    }
  }

  /**
   * Event Listeners
   */
  setupEventListeners() {
    // Large Click Area: clicks anywhere inside #core-stage register as clicks
    this.dom.coreStage.addEventListener('mousedown', (e) => this.handleClick(e));
    this.dom.coreStage.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleClick(e);
    }, { passive: false });

    // Shop tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.shop-tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetId = `tab-${tab.getAttribute('data-tab')}`;
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
      });
    });

    // Rebirth Modals Triggers
    this.dom.btnRebirth.addEventListener('click', () => this.openRebirthModal());
    this.dom.btnDoRebirth.addEventListener('click', () => this.doRebirth());

    this.dom.btnRebirthShop.addEventListener('click', () => {
      this.renderRebirthShop();
      this.dom.modalRebirthShop.classList.remove('hidden');
    });

    // Audio & Music Toggles
    this.dom.btnAudio.addEventListener('click', () => {
      if (window.neonAudio) {
        const state = window.neonAudio.toggleSfx();
        this.dom.btnAudio.classList.toggle('active', state);
        this.dom.btnAudio.querySelector('.btn-icon').textContent = state ? '🔊' : '🔇';
      }
    });

    this.dom.btnMusic.addEventListener('click', () => {
      if (window.neonAudio) {
        const state = window.neonAudio.toggleMusic();
        this.dom.btnMusic.classList.toggle('active', state);
      }
    });

    // Stats Modal
    const openModal = (m) => m.classList.remove('hidden');
    const closeModal = (m) => m.classList.add('hidden');

    document.getElementById('btn-stats').addEventListener('click', () => {
      document.getElementById('st-total-vibe').textContent = formatNumber(this.totalScoreEarned);
      document.getElementById('st-total-clicks').textContent = formatNumber(this.totalClicks);
      document.getElementById('st-rebirth-level').textContent = `${this.rebirthLevel} (${this.getCurrentEra().name})`;
      document.getElementById('st-total-shards').textContent = formatNumber(this.totalShardsEarned);
      openModal(this.dom.modalStats);
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      openModal(this.dom.modalSettings);
    });

    // Modal Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        const modal = document.getElementById(modalId);
        if (modal) closeModal(modal);
      });
    });

    // Modal Overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });

    // Claim offline button
    document.getElementById('btn-claim-offline').addEventListener('click', () => {
      if (this.offlinePendingReward) {
        this.score += this.offlinePendingReward;
        this.totalScoreEarned += this.offlinePendingReward;
        this.offlinePendingReward = 0;
      }
      closeModal(this.dom.modalOffline);
      if (window.neonAudio) window.neonAudio.playBuy();
    });

    // Settings actions
    document.getElementById('btn-force-save').addEventListener('click', () => {
      this.saveGame();
      this.showToast('💾 Сохранено', 'Прогресс успешно сохранен в памяти браузера!');
    });

    document.getElementById('btn-reset-game').addEventListener('click', () => this.resetGame());
    document.getElementById('btn-export-save').addEventListener('click', () => this.exportSave());
    document.getElementById('btn-import-save').addEventListener('click', () => this.importSave());

    // Settings controls: Quality & Volume
    const qualitySelect = document.getElementById('setting-fx-quality');
    qualitySelect.addEventListener('change', (e) => {
      if (window.neonParticles) {
        window.neonParticles.setQuality(e.target.value);
      }
    });

    const volSlider = document.getElementById('setting-sfx-volume');
    volSlider.addEventListener('input', (e) => {
      const vol = e.target.value / 100;
      if (window.neonAudio) {
        window.neonAudio.setVolume(vol);
      }
    });

    // Save on tab close
    window.addEventListener('beforeunload', () => {
      this.saveGame();
    });
  }
}

// Launch Game on Window Load
window.addEventListener('DOMContentLoaded', () => {
  window.vibeGame = new NeonVibeGame();
});
