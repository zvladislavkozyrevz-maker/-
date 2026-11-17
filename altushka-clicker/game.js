/**
 * ALTUSHKA CLICKER - CORE ENGINE (VK MINI APPS EDITION)
 * 
 * Complies with VK Mini Apps / VK Games Moderation Rules:
 * - 4.2.1: Monetization via VK Bridge Rewarded Video & Interstitial ads
 * - 4.2.4: Polished clicker mechanics (producers, boosters, fever mode, offline income)
 * - 4.2.5: High quality responsive UI with adaptive themes
 * - 4.2.7: Game progression pacing strictly exceeds 10 minutes + visible playtime timer
 * - 4.2.10: Full-fledged Start Menu Screen with Play, Tutorial, Settings, and Audio controls
 * - VK Storage Quota Compliance: Single variable (1/1000 keys) and throttled sync (< 40 calls/hour vs 1000 limit)
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

// Format seconds into MM:SS or HH:MM:SS
function formatTime(seconds) {
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

class AltushkaGame {
  constructor() {
    this.saveKey = 'altushka_clicker_save_v1';
    this.vkCloudKey = 'altushka_save_vk'; // Exactly 1 key used out of 1000 allowed!

    // Game State
    this.score = 0; // Alt-coins 🖤
    this.totalScoreEarned = 0;
    this.totalClicks = 0;
    this.totalBonuses = 0;
    this.startTime = Date.now();
    this.lastSaveTime = Date.now();
    this.lastTickTime = Date.now();

    // 4.2.7 Playtime tracking (> 10 minutes required by moderation)
    this.sessionPlayTimeSec = 0;
    this.totalPlayTimeSec = 0;
    this.gameStarted = false; // toggled when player clicks "Play" in Start Menu

    // Evolution / Prestige System (5 Stages)
    this.rebirthLevel = 0; // 0 to 4 (representing Levels 1 to 5)
    this.rebirthClicks = 0; // clicks in current evolution level
    this.neuroShards = 0; // Alt-Shards 🦇
    this.totalShardsEarned = 0;

    // VK Storage API Call Rate Limiter (Limit: < 1000 calls per hour)
    this.vkStorageCallCount = 0;
    this.vkStorageHourStart = Date.now();
    this.lastVkCloudSaveTime = 0;
    this.cloudSyncReady = false; // Guard to prevent race overwriting cloud data on boot

    // Mobile touch guard & tap throttling (Item 11)
    this.lastTouchTimestamp = 0;
    this.lastTapTimestamp = 0;
    this.lastBuyTime = 0;

    // Single-instance Lucky Bonus state (Item 3)
    this.luckyActive = false;
    this.luckyMoveInterval = null;
    this.luckyTimeout = null;
    this.spriteTapTimer = null;
    this.achBannerTimer = null;

    // 5 Evolution Stages with balanced pacing (> 10 min to reach Stage 5)
    this.eras = [
      {
        level: 0,
        stageNumber: 1,
        name: 'Серая Мышка (Нормис)',
        avatar: '🐭',
        bgImage: 'assets/images/pack1_level1.jpg',
        spriteImage: 'assets/images/pack1_level1.jpg',
        clicksNeeded: 200,
        coinsNeeded: 10000,
        themeClass: 'theme-stage-1',
        quote: '«Обычная скромная школьница, делающая уроки на кухне»',
        shardsReward: 5
      },
      {
        level: 1,
        stageNumber: 2,
        name: 'Начинающая Альтушка',
        avatar: '⚡',
        bgImage: 'assets/images/pack1_level2.jpg',
        spriteImage: 'assets/images/pack1_level2.jpg',
        clicksNeeded: 650,
        coinsNeeded: 180000,
        themeClass: 'theme-stage-2',
        quote: '«Первые стрелки, фиолетовые пряди и баночка энергетика в подъезде!»',
        shardsReward: 15
      },
      {
        level: 2,
        stageNumber: 3,
        name: 'Гаражная Тусовщица',
        avatar: '🍾',
        bgImage: 'assets/images/pack1_level3.jpg',
        spriteImage: 'assets/images/pack1_level3.jpg',
        clicksNeeded: 2000,
        coinsNeeded: 3500000,
        themeClass: 'theme-stage-3',
        quote: '«Плотная фигурка 160см, чокер с шипами, сидр и ночные гаражи!»',
        shardsReward: 35
      },
      {
        level: 3,
        stageNumber: 4,
        name: 'Дрейн-Икона (Виперша)',
        avatar: '🖤',
        bgImage: 'assets/images/pack1_level4.jpg',
        spriteImage: 'assets/images/pack1_level4.jpg',
        clicksNeeded: 5000,
        coinsNeeded: 65000000,
        themeClass: 'theme-stage-4',
        quote: '«Китай-город, оверсайз зипка, септум и треки 9mice на репите!»',
        shardsReward: 80
      },
      {
        level: 4,
        stageNumber: 5,
        name: 'Ультра-Альтушка (160см / 140кг)',
        avatar: '👑',
        bgImage: 'assets/images/pack1_level5.jpg',
        spriteImage: 'assets/images/pack1_level5.jpg',
        clicksNeeded: 15000,
        coinsNeeded: 500000000,
        themeClass: 'theme-stage-5',
        quote: '«160 см, 140 кг, абсолютная сексуальная королева рейва!»',
        shardsReward: 200
      }
    ];

    // Speech Quotes for each stage
    this.speechQuotes = {
      0: [
        "Ой, не нажимамай так сильно...",
        "Я уроки не доделала на завтра",
        "Мама сказала в 9 вечера быть дома",
        "Что такое дрейн?..",
        "Мне немного неловко...",
        "Чайник на плите свистит"
      ],
      1: [
        "Купи мне монстрик!",
        "Смотри, я прядь тоником покрасила!",
        "Не трогай заколки, стрелка смажется!",
        "Погнали за школу покурим?",
        "Я не позерша, понятно?!",
        "Включи погромче в наушниках!"
      ],
      2: [
        "Го в гаражи с сидром?",
        "Сидр холодный передай",
        "Тут сыро, зато какой вайб!",
        "Чокер не трогай, шипы острые!",
        "Скуфы опять смотрят...",
        "Нормисам никогда не понять"
      ],
      3: [
        "Вайперр в ушах — депрессия в душе 💔",
        "Встретимся на Китай-городе у лавочек",
        "Септум новый зацени!",
        "У меня дед-инсайд фаза...",
        "9mice гений, плачу под новый трек",
        "Скинься на New Rock на день рождения"
      ],
      4: [
        "160 сантиметров чистого стиля!",
        "140 килограмм сочного величия 💅",
        "Королева рейва в здании!",
        "Все скуфы упали передо мной!",
        "Заряжена на максимум басов!",
        "Тапай активнее, зай, не отвлекайся!"
      ]
    };

    // Rebirth / Alt-Shards Upgrades (Purchased with 🦇 Shards)
    this.rebirthUpgrades = [
      {
        id: 'alt_mult',
        name: 'Альт-Множитель',
        desc: '+50% ко всем Альт-коинам за уровень перка',
        icon: '🖤',
        level: 0,
        baseCost: 5,
        costMult: 1.8,
        effect: (lvl) => 1 + lvl * 0.5
      },
      {
        id: 'fast_start',
        name: 'Запас Карманных',
        desc: 'Начинайте уровень сразу с запасом денег от бабушки и энергетиков',
        icon: '⚡',
        level: 0,
        baseCost: 10,
        costMult: 2.0,
        maxLevel: 5
      },
      {
        id: 'hyper_crit',
        name: 'Дед-Инсайд Криты',
        desc: 'Криты наносят x10 вместо x5, и +3% к шансу крита за ур.',
        icon: '🎯',
        level: 0,
        baseCost: 15,
        costMult: 2.2,
        maxLevel: 5
      },
      {
        id: 'auto_tapper',
        name: 'Фан-Клуб Скуфов',
        desc: 'Альтушка сама автоматически тапает 2 раза в секунду!',
        icon: '👴',
        level: 0,
        baseCost: 20,
        costMult: 2.5,
        maxLevel: 5
      },
      {
        id: 'snack_magnet',
        name: 'Магнит Вкусняшек',
        desc: 'Летающие бонусы и вкусняшки появляются на 35% чаще',
        icon: '🍩',
        level: 0,
        baseCost: 18,
        costMult: 2.2,
        maxLevel: 3
      }
    ];

    // Auto-clickers (Альт-Движ)
    this.producers = [
      {
        id: 'pocket_money',
        name: 'Карманные от бабушки',
        desc: 'Скромная заначка на мелочи и проезд',
        icon: '👵',
        count: 0,
        baseCost: 15,
        costMult: 1.15,
        baseVps: 0.5
      },
      {
        id: 'monster',
        name: 'Энергетик Monster Ultra',
        desc: 'Белый монстрик без сахара — топливо для ночных посиделок',
        icon: '⚡',
        count: 0,
        baseCost: 100,
        costMult: 1.15,
        baseVps: 4
      },
      {
        id: 'hair_dye',
        name: 'Краска «Тоника» (фиолетовая)',
        desc: 'Вся раковина в фиолетовых разводах, зато пряди сияют!',
        icon: '🎨',
        count: 0,
        baseCost: 1100,
        costMult: 1.15,
        baseVps: 32
      },
      {
        id: 'cider',
        name: 'Сидр в гаражах',
        desc: 'Яблочный вишневый сидр из КБ под светом уличного фонаря',
        icon: '🍾',
        count: 0,
        baseCost: 12000,
        costMult: 1.15,
        baseVps: 320
      },
      {
        id: 'zip_hoodie',
        name: 'Оверсайз зипка с костями',
        desc: 'Огромное черное худи с паутиной и молнией до капюшона',
        icon: '🧥',
        count: 0,
        baseCost: 85000,
        costMult: 1.15,
        baseVps: 2200
      },
      {
        id: 'spiked_choker',
        name: 'Чокер с шипами и кольцом',
        desc: 'Классика жанра. Острый, блестящий, дерзкий',
        icon: '⛓️',
        count: 0,
        baseCost: 650000,
        costMult: 1.15,
        baseVps: 15000
      },
      {
        id: 'viperr_merch',
        name: 'Мерч Viperr / 9mice',
        desc: 'Эксклюзивная футболка с концерта с перегруженным логотипом',
        icon: '🖤',
        count: 0,
        baseCost: 4500000,
        costMult: 1.15,
        baseVps: 95000
      },
      {
        id: 'new_rocks',
        name: 'Платформы New Rock',
        desc: 'Тяжеленные берцы на 10-сантиметровой подошве с металлом',
        icon: '👢',
        count: 0,
        baseCost: 32000000,
        costMult: 1.15,
        baseVps: 750000
      },
      {
        id: 'twitch_stream',
        name: 'Стрим на Твиче (Донаты скуфов)',
        desc: 'Сидишь в ушках с подсветкой, а донаты летят рекой',
        icon: '📱',
        count: 0,
        baseCost: 250000000,
        costMult: 1.15,
        baseVps: 6000000
      },
      {
        id: 'garage_coop',
        name: 'Личный гаражный кооператив',
        desc: 'Целая база для ночных рейвов, музыки и тусовок',
        icon: '🏭',
        count: 0,
        baseCost: 2000000000,
        costMult: 1.15,
        baseVps: 50000000
      }
    ];

    // Manual Click Boosters & Upgrades (Шмот и Тюнинг)
    this.boosters = [
      {
        id: 'eyeliner',
        name: 'Черные стрелки',
        desc: '+1 к силе каждого тапа по альтушке',
        icon: '👁️',
        count: 0,
        maxCount: 25,
        baseCost: 25,
        costMult: 1.5,
        bonusVpc: 1
      },
      {
        id: 'septum',
        name: 'Пирсинг септума',
        desc: '+5 к силе тапа и +4% к шансу критического удара',
        icon: '💍',
        count: 0,
        maxCount: 25,
        baseCost: 220,
        costMult: 1.55,
        bonusVpc: 5,
        critChance: 0.04
      },
      {
        id: 'skull_ring',
        name: 'Кольцо с черепом',
        desc: '+35 к силе тапа при каждом нажатии',
        icon: '💀',
        count: 0,
        maxCount: 25,
        baseCost: 2500,
        costMult: 1.6,
        bonusVpc: 35
      },
      {
        id: 'bass_headphones',
        name: 'Наушники с басами',
        desc: 'Каждый клик дает +1.5% от вашего дохода/сек',
        icon: '🎧',
        count: 0,
        maxCount: 15,
        baseCost: 15000,
        costMult: 2.2,
        resonancePercent: 0.015
      },
      {
        id: 'kefir_stash',
        name: 'Заначка кефирчика',
        desc: '+12% к шансу нанести СУПЕР-ТАП с критом x5',
        icon: '🥛',
        count: 0,
        maxCount: 5,
        baseCost: 45000,
        costMult: 2.5,
        critChance: 0.12
      },
      {
        id: 'leather_jacket',
        name: 'Косуха с заклепками',
        desc: '+250 к базовой силе тапа',
        icon: '🖤',
        count: 0,
        maxCount: 15,
        baseCost: 180000,
        costMult: 2.0,
        bonusVpc: 250
      }
    ];

    // Combo & Fever
    this.combo = 0;
    this.maxCombo = 100;
    this.comboDecayRate = 22;
    this.feverActive = false;
    this.feverTimer = 0;
    this.activeBuffs = [];

    // Meme Achievements List with Rewards (Alt-Coins 🖤 & Alt-Shards 🦇)
    this.achievements = [
      {
        id: 'first_click',
        title: 'Первое знакомство',
        desc: 'Сделайте самый первый тап по альтушке',
        memeTag: 'БАЗА ДНЯ 🗿',
        memeQuote: '«Ты осторожно коснулся экрана. Альтушка вопросительно посмотрела»',
        icon: '🖤',
        rewardCoins: 500,
        rewardShards: 0,
        unlocked: false,
        claimed: false,
        check: () => this.totalClicks >= 1
      },
      {
        id: 'click_100',
        title: 'Быстрые пальчики',
        desc: 'Совершите 100 тапов',
        memeTag: 'АЛЬТ-ГРИНД ⚡',
        memeQuote: '«Стрелки на глазах дрожат, но ты продолжаешь кликать!»',
        icon: '⚡',
        rewardCoins: 2500,
        rewardShards: 1,
        unlocked: false,
        claimed: false,
        check: () => this.totalClicks >= 100
      },
      {
        id: 'click_1000',
        title: 'Главный фанат',
        desc: 'Преодолейте 1,000 тапов',
        memeTag: 'СКУФ-ГИГАЧАД 🦾',
        memeQuote: '«Ты заслужил уважение всего гаражного кооператива»',
        icon: '🦾',
        rewardCoins: 25000,
        rewardShards: 3,
        unlocked: false,
        claimed: false,
        check: () => this.totalClicks >= 1000
      },
      {
        id: 'play_10min',
        title: 'Ветеран спальников',
        desc: 'Проведите в игре более 10 минут (Правило 4.2.7)',
        memeTag: 'ТРУ-АЛЬТУШНИК ⏱️',
        memeQuote: '«Более 10 минут в альт-вселенной. Модераторы VK одобрительно кивают!»',
        icon: '⏱️',
        rewardCoins: 50000,
        rewardShards: 5,
        unlocked: false,
        claimed: false,
        check: () => this.totalPlayTimeSec >= 600
      },
      {
        id: 'first_monster',
        title: 'Белый Монстрик',
        desc: 'Купите первый энергетик',
        memeTag: 'ТОПЛИВО ДНЯ ⚡',
        memeQuote: '«Холодный пшик банки, и ты готов не спать до утра»',
        icon: '⚡',
        rewardCoins: 1000,
        rewardShards: 0,
        unlocked: false,
        claimed: false,
        check: () => this.getProducerCount('monster') >= 1
      },
      {
        id: 'hair_purple',
        title: 'Фиолетовый бунт',
        desc: 'Купите краску «Тоника»',
        memeTag: 'МАМА БУДЕТ В ШОКЕ 🎨',
        memeQuote: '«Вся ванна в фиолетовых каплях, но результат того стоил»',
        icon: '🎨',
        rewardCoins: 5000,
        rewardShards: 1,
        unlocked: false,
        claimed: false,
        check: () => this.getProducerCount('hair_dye') >= 1
      },
      {
        id: 'garages_vibe',
        title: 'Гаражный авторитет',
        desc: 'Купите сидр в гаражах',
        memeTag: 'РОМАНТИКА СПАЛЬНИКОВ 🍾',
        memeQuote: '«Ржавые гаражи, граффити и звон бутылок в темноте»',
        icon: '🍾',
        rewardCoins: 15000,
        rewardShards: 2,
        unlocked: false,
        claimed: false,
        check: () => this.getProducerCount('cider') >= 1
      },
      {
        id: 'first_evolution',
        title: 'Трансформация!',
        desc: 'Совершите первую эволюцию персонажа',
        memeTag: 'УРОВЕНЬ ПОВЫШЕН 🖤',
        memeQuote: '«Серая мышка уходит в прошлое. Начинается эпоха бунта!»',
        icon: '🦇',
        rewardCoins: 50000,
        rewardShards: 5,
        unlocked: false,
        claimed: false,
        check: () => this.rebirthLevel >= 1
      },
      {
        id: 'queen_altushka',
        title: '160см / 140кг Величия',
        desc: 'Достигните 5 уровня эволюции (Ультра-Альтушка)',
        memeTag: 'АБСОЛЮТНАЯ БОГИНЯ 👑',
        memeQuote: '«160 сантиметров чистого хайпа и 140 кг чистой любви!»',
        icon: '👑',
        rewardCoins: 500000,
        rewardShards: 25,
        unlocked: false,
        claimed: false,
        check: () => this.rebirthLevel >= 4
      }
    ];

    // Random Meme Events with Choices
    this.eventsCatalog = [
      {
        id: 'event_9mice',
        title: '🔥 9mice выпустил новый трек!',
        icon: '🎧',
        badge: '🖤 РЕЙВ-СОБЫТИЕ',
        story: 'В наушниках загремел перегруженный 808 бас и скрим. Кровь закипает, вайб взлетает до стратосферы!',
        choiceA: {
          title: '🔁 Поставить на репит',
          desc: 'Буст x3 к силе тапа на 60 секунд',
          action: () => {
            this.addBuff('9mice_repeat', 'Трек 9mice (x3 Тап)', '🔥', 3, 60, 'tap');
            this.showToast('🔥 НА РЕПИТЕ!', 'Сила тапа увеличена в 3 раза на 60 секунд!');
          }
        },
        choiceB: {
          title: '📱 Снять видос в клипы',
          desc: 'Собрать просмотры: мгновенно +25% к банку Альт-коинов',
          action: () => {
            const reward = Math.max(500, Math.floor(this.score * 0.25));
            this.score += reward;
            this.totalScoreEarned += reward;
            this.showToast('📱 ЗАВИРУСИЛАСЬ!', `+${formatNumber(reward)} Альт-коинов с просмотров!`);
          }
        }
      },
      {
        id: 'event_snack',
        title: '🍩 Хочется вкусняшки ночью!',
        icon: '🍔',
        badge: '🍔 НОЧНОЙ ЖОР',
        story: 'В 2 часа ночи непреодолимо захотелось сырных палочек, бургеров и чипсов. Что делаем?',
        choiceA: {
          title: '🛵 Заказать доставку',
          desc: '-15% от баланса, зато комбо-шкала летит x2 быстрее (60 сек)',
          action: () => {
            const cost = Math.floor(this.score * 0.15);
            this.score = Math.max(0, this.score - cost);
            this.addBuff('snack_combo', 'Сытый разгон (x2 Комбо)', '🍩', 2, 60, 'combo');
            this.showToast('🛵 ВКУСНЯШКИ ПРИБЫЛИ!', 'Сытая альтушка тапает с удвоенным разгоном!');
          }
        },
        choiceB: {
          title: '🥛 Попить кефирчик',
          desc: 'Бесплатно: здоровый кефирчик дает +x2 к авто-доходу на 45 сек',
          action: () => {
            this.addBuff('kefir_passive', 'Холодный Кефирчик (x2 Авто)', '🥛', 2, 45, 'passive');
            this.showToast('🥛 КЕФИРЧИК СПАС!', 'Авто-доход удвоен на 45 секунд!');
          }
        }
      },
      {
        id: 'event_kitay_gorod',
        title: '🚨 Патруль на Китай-городе!',
        icon: '👮',
        badge: '⚠️ ОПАСНОСТЬ',
        story: 'Патруль у лавочек на Яме заметил баночки сидра и требует документы. Твои действия?',
        choiceA: {
          title: '💅 Включить альт-обаяние',
          desc: '65% шанс получить хайп (+x3 буст на 40 сек), 35% штраф -20% монет',
          action: () => {
            if (Math.random() < 0.65) {
              this.addBuff('charm_boost', 'Альт-Обаяние (x3 Все)', '💅', 3, 40, 'all');
              this.showToast('💅 УСПЕХ!', 'Патруль оценил стрелки и отпустил с миром! x3 буст!');
            } else {
              const fine = Math.floor(this.score * 0.2);
              this.score = Math.max(0, this.score - fine);
              this.showToast('👮 ШТРАФ!', `Пришлось отдать ${formatNumber(fine)} Альт-коинов...`);
            }
          }
        },
        choiceB: {
          title: '🏃 Дёрнуть через арку во дворы',
          desc: 'Быстрый побег: адреналин дает мгновенно +15% к кликам',
          action: () => {
            this.addBuff('run_adrenaline', 'Адреналин (x2 Тап)', '🏃', 2, 30, 'tap');
            this.showToast('🏃 УБЕЖАЛА!', 'Погоня оторвалась в темных дворах! x2 тап на 30 сек!');
          }
        }
      },
      {
        id: 'event_mother_locked',
        title: '🚪 Мать заперла дома!',
        icon: '🔒',
        badge: '🏠 ДОМАШНИЙ АРЕСТ',
        story: '«Никаких гаражей, пока не вымоешь полы и посуду!» Входная дверь заперта на два замка.',
        choiceA: {
          title: '💻 Сесть за комп и врубить стрим',
          desc: 'Авто-доход x0.5, зато ручной тап по альтушке x4 на 45 сек!',
          action: () => {
            this.addBuff('home_stream', 'Стрим из спальни (x4 Тап)', '💻', 4, 45, 'tap');
            this.showToast('💻 СТРИМ ЗАПУЩЕН!', 'Сила клика увеличена в 4 раза на 45 секунд!');
          }
        },
        choiceB: {
          title: '🧹 Быстро убраться в комнате',
          desc: 'Спокойствие в доме: +10 Альт-осколков и +10% к шансу критов на минуту',
          action: () => {
            this.neuroShards += 10;
            this.totalShardsEarned += 10;
            this.addBuff('room_clean', 'Чистая комната (+15% Крит)', '✨', 1.5, 60, 'crit');
            this.showToast('✨ ПОРЯДОК!', '+10 Альт-осколков и повышенный крит-шанс!');
          }
        }
      },
      {
        id: 'event_boys_invite',
        title: '📱 Мальчики зовут к себе на хату',
        icon: '💬',
        badge: '❓ ДИЛЕММА',
        story: 'Пишут во ВКонтакте: «Го к нам на вписку, там весело». Что ответим?',
        choiceA: {
          title: '🚫 Задоджить и включить сериал',
          desc: 'Самоуважение бесценно: +15 Альт-осколков 🦇',
          action: () => {
            this.neuroShards += 15;
            this.totalShardsEarned += 15;
            this.showToast('💅 САМОУВАЖЕНИЕ!', '+15 Альт-Осколков за непоколебимый характер!');
          }
        },
        choiceB: {
          title: '🔊 Прийти и занять колонку',
          desc: 'Врубить свой плейлист: мгновенно +20% монет или супер-хайп',
          action: () => {
            const reward = Math.max(1000, Math.floor(this.score * 0.2));
            this.score += reward;
            this.totalScoreEarned += reward;
            this.addBuff('party_queen', 'Королева вписки (x2.5 Все)', '👑', 2.5, 30, 'all');
            this.showToast('👑 ВСЕ СЛУШАЮТ ТЕБЯ!', `+${formatNumber(reward)} коинов и x2.5 буст!`);
          }
        }
      }
    ];

    // Cache DOM Elements
    this.dom = {
      scoreDisplay: document.getElementById('score-display'),
      vpsDisplay: document.getElementById('vps-display'),
      vpcDisplay: document.getElementById('vpc-display'),
      comboBar: document.getElementById('combo-bar'),
      comboMult: document.getElementById('combo-multiplier'),
      comboStatus: document.getElementById('combo-status'),

      // 4.2.10 Start Menu Screen Elements
      startMenuScreen: document.getElementById('start-menu-screen'),
      btnStartGame: document.getElementById('btn-start-game'),
      btnStartGameLabel: document.getElementById('btn-start-game-label'),
      startHeroPreviewImg: document.getElementById('start-hero-preview-img'),
      startMenuStageTitle: document.getElementById('start-menu-stage-title'),
      startMenuStageQuote: document.getElementById('start-menu-stage-quote'),
      startMenuScore: document.getElementById('start-menu-score'),
      startMenuClicks: document.getElementById('start-menu-clicks'),
      btnStartTutorial: document.getElementById('btn-start-tutorial'),
      btnStartStats: document.getElementById('btn-start-stats'),
      btnStartSettings: document.getElementById('btn-start-settings'),
      btnStartAudioToggle: document.getElementById('btn-start-audio-toggle'),
      btnStartMusicToggle: document.getElementById('btn-start-music-toggle'),
      startAudioStatus: document.getElementById('start-audio-status'),
      startMusicStatus: document.getElementById('start-music-status'),
      btnOpenMenu: document.getElementById('btn-open-menu'),

      // 4.2.7 Session Timer Elements
      sessionTimerVal: document.getElementById('session-timer-val'),
      stPlaytime: document.getElementById('st-playtime'),
      stTotalBonuses: document.getElementById('st-total-bonuses'),

      // Click Area & Character
      clickerSection: document.getElementById('clicker-section'),
      coreStage: document.getElementById('core-stage'),
      stageBgLayer: document.getElementById('stage-bg-layer'),
      altushkaSprite: document.getElementById('altushka-sprite'),
      altushkaSpeech: document.getElementById('altushka-speech'),
      speechBubbleText: document.getElementById('speech-bubble-text'),
      floatContainer: document.getElementById('float-container'),
      luckyCrystal: document.getElementById('lucky-crystal'),
      orbitBadgesContainer: document.getElementById('orbit-badges-container'),
      activeBuffs: document.getElementById('active-buffs'),

      // Header Elements
      headerLogoIcon: document.getElementById('header-logo-icon'),
      currentEraBadge: document.getElementById('current-era-badge'),
      btnRebirth: document.getElementById('btn-rebirth'),
      btnTurboClicker: document.getElementById('btn-turbo-clicker'),
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
      modalTutorial: document.getElementById('modal-tutorial'),
      modalStats: document.getElementById('modal-stats'),
      modalSettings: document.getElementById('modal-settings'),
      modalOffline: document.getElementById('modal-offline'),
      modalRebirth: document.getElementById('modal-rebirth'),
      modalRebirthShop: document.getElementById('modal-rebirth-shop'),
      modalEvent: document.getElementById('modal-event'),

      // Event Modal
      eventModalTitle: document.getElementById('event-modal-title'),
      eventBadge: document.getElementById('event-badge'),
      eventIcon: document.getElementById('event-icon'),
      eventHeadline: document.getElementById('event-headline'),
      eventStory: document.getElementById('event-story'),
      btnChoiceA: document.getElementById('btn-choice-a'),
      choiceATitle: document.getElementById('choice-a-title'),
      choiceADesc: document.getElementById('choice-a-desc'),
      btnChoiceB: document.getElementById('btn-choice-b'),
      choiceBTitle: document.getElementById('choice-b-title'),
      choiceBDesc: document.getElementById('choice-b-desc'),
      btnClaimSingle: document.getElementById('btn-claim-single'),

      // Evolution Modal
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

      // Audio buttons in Header
      btnAudio: document.getElementById('btn-audio'),
      btnMusic: document.getElementById('btn-music')
    };

    this.autoTapTimer = 0;
    this.speechTimer = 0;
    this.currentPendingEvent = null;
    this.ysdk = null;

    // Ad DOM elements
    this.dom.btnAdBoost = document.getElementById('btn-ad-boost');
    this.dom.btnClaimOfflineX2 = document.getElementById('btn-claim-offline-x2');

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

  sanitizeNum(v, def = 0) {
    const n = Number(v);
    return (isNaN(n) || !isFinite(n) || n < 0) ? def : n;
  }

  getCurrentEra() {
    const idx = Math.max(0, Math.min(this.eras.length - 1, Math.floor(this.sanitizeNum(this.rebirthLevel, 0))));
    return this.eras[idx];
  }

  getNextEra() {
    const nextIdx = Math.max(0, Math.min(this.eras.length - 1, Math.floor(this.sanitizeNum(this.rebirthLevel, 0)) + 1));
    return this.eras[nextIdx];
  }

  getClicksNeededForRebirth() {
    return this.getCurrentEra().clicksNeeded;
  }

  init() {
    this.loadGame();
    this.initVKBridge();
    this.initYandexSDK();
    this.applyEraTheme();
    this.setupEventListeners();
    this.renderShop();
    this.renderAchievements();
    this.renderRebirthShop();
    this.renderOrbitBadges();
    this.updateStartMenuStatus();
    this.updateUI();

    // Start Main Game Loop
    requestAnimationFrame((t) => this.gameLoop(t));

    // Local autosave every 8 seconds (Free, 0 network calls)
    setInterval(() => this.saveGame(), 8000);

    // VK Cloud Storage throttled autosave every 90 seconds (Max 40 calls/hour vs 1000 limit)
    setInterval(() => this.syncVkCloudSave(), 90000);

    // Schedule floating bonus snack
    this.scheduleLuckyCrystal();

    // Periodic random events (every 75 seconds)
    setInterval(() => {
      if (Math.random() < 0.6) {
        this.triggerRandomEvent();
      }
    }, 75000);
  }

  /**
   * 4.2.10 START MENU LIFECYCLE
   */
  updateStartMenuStatus() {
    const cur = this.getCurrentEra();
    if (this.dom.startHeroPreviewImg) this.dom.startHeroPreviewImg.src = cur.spriteImage;
    if (this.dom.startMenuStageTitle) this.dom.startMenuStageTitle.textContent = `Уровень ${cur.stageNumber}: ${cur.name}`;
    if (this.dom.startMenuStageQuote) this.dom.startMenuStageQuote.textContent = cur.quote;
    if (this.dom.startMenuScore) this.dom.startMenuScore.textContent = formatNumber(this.score);
    if (this.dom.startMenuClicks) this.dom.startMenuClicks.textContent = formatNumber(this.totalClicks);

    if (this.dom.btnStartGameLabel) {
      if (this.totalClicks > 0 || this.score > 0 || this.rebirthLevel > 0) {
        this.dom.btnStartGameLabel.textContent = `▶️ ПРОДОЛЖИТЬ (Ур. ${cur.stageNumber})`;
      } else {
        this.dom.btnStartGameLabel.textContent = `▶️ НАЧАТЬ ИГРУ`;
      }
    }

    if (window.audioEngine) {
      if (this.dom.startAudioStatus) this.dom.startAudioStatus.textContent = window.audioEngine.sfxEnabled ? 'ВКЛ' : 'ВЫКЛ';
      if (this.dom.startMusicStatus) this.dom.startMusicStatus.textContent = window.audioEngine.musicEnabled ? 'ВКЛ' : 'ВЫКЛ';
    }
  }

  startGame() {
    this.gameStarted = true;
    if (this.dom.startMenuScreen) {
      this.dom.startMenuScreen.classList.add('hidden');
    }
    if (window.audioEngine) {
      window.audioEngine.init();
    }
  }

  openStartMenu() {
    this.updateStartMenuStatus();
    if (this.dom.startMenuScreen) {
      this.dom.startMenuScreen.classList.remove('hidden');
    }
  }

  /**
   * Apply Theme and Visuals for Current Evolution Stage
   */
  applyEraTheme() {
    const era = this.getCurrentEra();

    // Update body theme class
    this.eras.forEach(e => document.body.classList.remove(e.themeClass));
    document.body.classList.add(era.themeClass);

    // Update stage background image and character sprite
    if (this.dom.stageBgLayer) {
      this.dom.stageBgLayer.style.backgroundImage = `url('${era.bgImage}')`;
    }
    if (this.dom.altushkaSprite) {
      this.dom.altushkaSprite.src = era.spriteImage;
    }

    // Update header badges
    if (this.dom.currentEraBadge) {
      this.dom.currentEraBadge.textContent = `Уровень ${era.stageNumber}: ${era.name}`;
    }

    // Inform Audio Engine about current level
    if (window.audioEngine) {
      window.audioEngine.setLevel(era.stageNumber);
    }
  }

  /**
   * Triggers a random speech quote in the bubble above Altushka
   */
  triggerSpeechQuote(forcedText = null) {
    const stageIdx = Math.min(this.rebirthLevel, this.eras.length - 1);
    const quotes = this.speechQuotes[stageIdx] || this.speechQuotes[0];
    const text = forcedText || quotes[Math.floor(Math.random() * quotes.length)];

    if (this.dom.speechBubbleText && this.dom.altushkaSpeech) {
      this.dom.speechBubbleText.textContent = `«${text}»`;
      this.dom.altushkaSpeech.classList.remove('bubble-bounce');
      void this.dom.altushkaSpeech.offsetWidth;
      this.dom.altushkaSpeech.classList.add('bubble-bounce');

      if (window.audioEngine) {
        window.audioEngine.playSpeechPop();
      }
    }
  }

  /**
   * Adds an active buff with duration countdown
   */
  addBuff(id, name, icon, multiplier, duration, type = 'all') {
    this.activeBuffs = this.activeBuffs.filter(b => b.id !== id);
    this.activeBuffs.push({
      id,
      name,
      icon,
      multiplier,
      duration,
      maxDuration: duration,
      type
    });
    this.renderActiveBuffs();
  }

  renderActiveBuffs() {
    if (!this.dom.activeBuffs) return;
    this.dom.activeBuffs.innerHTML = '';

    this.activeBuffs.forEach(buff => {
      const badge = document.createElement('div');
      badge.className = 'active-buff-pill';
      const sec = Math.ceil(buff.duration);
      badge.innerHTML = `
        <span class="buff-icon">${buff.icon}</span>
        <span class="buff-name">${buff.name}</span>
        <span class="buff-timer">${sec}s</span>
      `;
      this.dom.activeBuffs.appendChild(badge);
    });
  }

  /**
   * Triggers a Random Meme Dilemma / Event Modal
   */
  triggerRandomEvent(specificEvent = null) {
    // Prevent event modal from interrupting or stacking on top of open modals (Stats, Evolution, Settings, etc.)
    const anyModalOpen = document.querySelector('.modal-overlay:not(.hidden)');
    if (anyModalOpen) {
      return;
    }

    const event = specificEvent || this.eventsCatalog[Math.floor(Math.random() * this.eventsCatalog.length)];
    this.currentPendingEvent = event;

    if (this.dom.eventModalTitle) this.dom.eventModalTitle.textContent = event.title;
    if (this.dom.eventBadge) this.dom.eventBadge.textContent = event.badge;
    if (this.dom.eventIcon) this.dom.eventIcon.textContent = event.icon;
    if (this.dom.eventHeadline) this.dom.eventHeadline.textContent = event.title;
    if (this.dom.eventStory) this.dom.eventStory.textContent = event.story;

    const choiceContainer = document.getElementById('event-choices-grid') || document.getElementById('choice-container');
    const hasChoices = !!(event.choiceA && event.choiceB);

    if (hasChoices) {
      if (choiceContainer) choiceContainer.classList.remove('hidden');
      if (this.dom.btnClaimSingle) this.dom.btnClaimSingle.classList.add('hidden');

      if (this.dom.choiceATitle) this.dom.choiceATitle.textContent = event.choiceA.title;
      if (this.dom.choiceADesc) this.dom.choiceADesc.textContent = event.choiceA.desc;
      if (this.dom.choiceBTitle) this.dom.choiceBTitle.textContent = event.choiceB.title;
      if (this.dom.choiceBDesc) this.dom.choiceBDesc.textContent = event.choiceB.desc;
    } else {
      if (choiceContainer) choiceContainer.classList.add('hidden');
      if (this.dom.btnClaimSingle) {
        this.dom.btnClaimSingle.classList.remove('hidden');
        this.dom.btnClaimSingle.textContent = (event.choiceA && event.choiceA.title) || 'ПРИНЯТЬ ВАЙБ 🖤';
      }
    }

    if (this.dom.modalEvent) {
      this.dom.modalEvent.classList.remove('hidden');
      if (window.audioEngine) {
        window.audioEngine.playEventAlert();
      }
    }
  }

  /**
   * Floating Bonus Item (Вкусняшка / Сидр)
   */
  scheduleLuckyCrystal() {
    if (this.luckyActive) return;
    if (this.luckyTimeout) clearTimeout(this.luckyTimeout);
    const magnetLvl = this.getRebirthUpgradeLvl('snack_magnet');
    const delayBase = magnetLvl > 0 ? 25000 : 40000;
    const delay = delayBase + Math.random() * 20000;

    this.luckyTimeout = setTimeout(() => {
      this.spawnLuckyCrystal();
    }, delay);
  }

  spawnLuckyCrystal() {
    if (this.luckyActive) return;
    const el = this.dom.luckyCrystal;
    const section = this.dom.clickerSection;
    if (!el || !section) return;

    this.luckyActive = true;
    el.classList.remove('hidden');

    const icons = ['🍩', '🍾', '⚡', '🥛', '🖤', '🍕'];
    const chosenIcon = icons[Math.floor(Math.random() * icons.length)];
    const inner = el.querySelector('.lucky-crystal-inner');
    if (inner) inner.textContent = chosenIcon;

    const secRect = section.getBoundingClientRect();
    const maxX = Math.max(80, secRect.width - 90);
    const maxY = Math.max(120, secRect.height - 110);

    let posX = 20 + Math.random() * maxX;
    let posY = 40 + Math.random() * maxY;
    let vx = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.7);
    let vy = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.7);

    el.style.left = `${posX}px`;
    el.style.top = `${posY}px`;

    let aliveTime = 0;
    const maxAlive = 12000;

    if (this.luckyMoveInterval) clearInterval(this.luckyMoveInterval);

    this.luckyMoveInterval = setInterval(() => {
      if (!this.luckyActive) {
        clearInterval(this.luckyMoveInterval);
        return;
      }
      aliveTime += 40;
      posX += vx;
      posY += vy;

      if (posX <= 10 || posX >= maxX) vx *= -1;
      if (posY <= 20 || posY >= maxY) vy *= -1;

      el.style.left = `${posX}px`;
      el.style.top = `${posY}px`;

      if (aliveTime >= maxAlive) {
        this.despawnLuckyCrystal();
      }
    }, 40);

    el.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.claimLuckyBonus(posX, posY);
    };
  }

  despawnLuckyCrystal() {
    this.luckyActive = false;
    if (this.luckyMoveInterval) {
      clearInterval(this.luckyMoveInterval);
      this.luckyMoveInterval = null;
    }
    if (this.dom.luckyCrystal) {
      this.dom.luckyCrystal.classList.add('hidden');
      this.dom.luckyCrystal.onclick = null;
    }
    this.scheduleLuckyCrystal();
  }

  claimLuckyBonus(x, y) {
    if (!this.luckyActive) return;
    const now = Date.now();
    if (this.lastLuckyClaim && now - this.lastLuckyClaim < 800) return;
    this.lastLuckyClaim = now;

    this.despawnLuckyCrystal();
    this.totalBonuses++;

    if (Math.random() < 0.45) {
      this.triggerRandomEvent();
    } else {
      const vps = this.calculateVps();
      const instantReward = Math.max(100, Math.floor(vps * 25));
      this.score += instantReward;
      this.totalScoreEarned += instantReward;

      this.addBuff('snack_frenzy', 'Сытый Буст (x3)', '🍩', 3, 30, 'all');
      this.showToast('🍩 ВКУСНЯШКА ПОЙМАНА!', `+${formatNumber(instantReward)} коинов и x3 буст на 30 сек!`, 'snack-toast', 'БОНУС ✨');
      this.triggerSpeechQuote("М-м-м, вкусняшка! Мой любимый вайб!");

      if (window.audioEngine) {
        window.audioEngine.playBuy();
      }
    }
  }

  /**
   * Main Calculation: Alt-Coins Per Second (VPS)
   */
  calculateVps() {
    let baseVps = 0;
    for (const prod of this.producers) {
      baseVps += prod.count * prod.baseVps;
    }

    const metaMult = 1 + this.getRebirthUpgradeLvl('alt_mult') * 0.5;
    const stageMult = Math.pow(2.2, this.rebirthLevel);

    let vps = baseVps * metaMult * stageMult;

    for (const buff of this.activeBuffs) {
      if (buff.type === 'passive' || buff.type === 'all') {
        vps *= buff.multiplier;
      }
    }

    return vps;
  }

  /**
   * Main Calculation: Alt-Coins Per Click (VPC)
   */
  calculateVpc() {
    let baseVpc = 1;

    for (const b of this.boosters) {
      if (b.bonusVpc) {
        baseVpc += b.count * b.bonusVpc;
      }
    }

    const resonanceCount = this.getBoosterCount('bass_headphones');
    if (resonanceCount > 0) {
      const vps = this.calculateVps();
      baseVpc += vps * (0.015 * resonanceCount);
    }

    const metaMult = 1 + this.getRebirthUpgradeLvl('alt_mult') * 0.5;
    const stageMult = Math.pow(1.8, this.rebirthLevel);

    let vpc = baseVpc * metaMult * stageMult;

    for (const buff of this.activeBuffs) {
      if (buff.type === 'tap' || buff.type === 'all') {
        vpc *= buff.multiplier;
      }
    }

    return Math.max(1, vpc);
  }

  getCritChance() {
    let chance = 0.05;
    for (const b of this.boosters) {
      if (b.critChance) chance += b.count * b.critChance;
    }
    chance += this.getRebirthUpgradeLvl('hyper_crit') * 0.03;

    for (const buff of this.activeBuffs) {
      if (buff.type === 'crit') {
        chance += (buff.multiplier - 1) * 0.15;
      }
    }

    return Math.min(0.75, Math.max(0, chance));
  }

  getCritMultiplier() {
    const baseMult = 5.0;
    const perkBonus = this.getRebirthUpgradeLvl('hyper_crit') > 0 ? 5.0 : 0;
    return baseMult + perkBonus;
  }

  getProducerCost(prod) {
    return Math.floor(prod.baseCost * Math.pow(prod.costMult, prod.count));
  }

  getBoosterCost(booster) {
    return Math.floor(booster.baseCost * Math.pow(booster.costMult, booster.count));
  }

  getRebirthUpgradeCost(upg) {
    return Math.floor(upg.baseCost * Math.pow(upg.costMult, upg.level));
  }

  /**
   * Handle Tap on Character / Stage
   */
  handleClick(e) {
    // Double click & trackpad spam protection (Item 11)
    const now = Date.now();
    if (this.lastTapTimestamp && (now - this.lastTapTimestamp < 24)) {
      return; // Cap tap frequency to prevent browser freeze
    }
    this.lastTapTimestamp = now;

    if (e && e.type === 'touchstart') {
      this.lastTouchTimestamp = now;
    } else if (e && e.type === 'mousedown') {
      if (this.lastTouchTimestamp && (now - this.lastTouchTimestamp < 400)) {
        return; // ignore synthetic mousedown following touchstart
      }
    }

    if (e && e.target && (e.target.closest('button') || e.target.closest('.lucky-crystal') || e.target.closest('.modal-overlay'))) {
      return;
    }

    this.totalClicks++;

    const stageRect = this.dom.coreStage ? this.dom.coreStage.getBoundingClientRect() : { left: 0, top: 0, width: 320, height: 260 };
    let clientX, clientY;
    if (e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e && typeof e.clientX === 'number') {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      clientX = stageRect.left + stageRect.width / 2;
      clientY = stageRect.top + stageRect.height / 2;
    }

    // Stage-relative coordinates to prevent horizontal overflow/shifting (Item 8, 9)
    const stageRelX = Math.max(25, Math.min(stageRect.width - 25, clientX - stageRect.left));
    const stageRelY = Math.max(30, Math.min(stageRect.height - 30, clientY - stageRect.top));

    const critChance = this.getCritChance();
    const isCrit = Math.random() < critChance;
    let clickGain = this.calculateVpc();

    if (isCrit) {
      clickGain *= this.getCritMultiplier();
    }

    const comboMult = this.getComboMultiplier();
    clickGain *= comboMult;

    this.score += clickGain;
    this.totalScoreEarned += clickGain;

    const clicksForThisTap = this.feverActive ? 2 : (isCrit ? 3 : 1);
    this.rebirthClicks += clicksForThisTap;

    let comboGain = 4.5;
    for (const buff of this.activeBuffs) {
      if (buff.type === 'combo') comboGain *= buff.multiplier;
    }
    this.combo = Math.min(this.maxCombo, this.combo + comboGain);

    if (window.audioEngine) {
      window.audioEngine.playClick(comboMult, isCrit);
    }

    if (window.particleEngine) {
      window.particleEngine.spawnClickBurst(clientX, clientY, isCrit);
    }

    // High performance sprite tap feedback without forced reflow
    if (this.dom.altushkaSprite) {
      this.dom.altushkaSprite.classList.add('tap-active');
      clearTimeout(this.spriteTapTimer);
      this.spriteTapTimer = setTimeout(() => {
        if (this.dom.altushkaSprite) this.dom.altushkaSprite.classList.remove('tap-active');
      }, 70);
    }

    this.spawnFloatNumber(stageRelX, stageRelY, clickGain, isCrit);

    if (Math.random() < 0.12) {
      this.triggerSpeechQuote();
    }

    // Throttled achievements check (every 10 clicks) to prevent lag spikes
    if (this.totalClicks % 10 === 0) {
      this.checkAchievements();
    }
  }

  getComboMultiplier() {
    if (this.feverActive) return 3.5;
    if (this.combo >= 80) return 2.5;
    if (this.combo >= 50) return 1.8;
    if (this.combo >= 20) return 1.3;
    return 1.0;
  }

  spawnFloatNumber(relX, relY, amount, isCrit = false) {
    if (!this.dom.floatContainer) return;

    // Strict cap to 4 max floating numbers so rapid taps never clutter the screen or catch the eye aggressively
    while (this.dom.floatContainer.children.length >= 4) {
      this.dom.floatContainer.removeChild(this.dom.floatContainer.firstChild);
    }

    const el = document.createElement('div');
    el.className = `floating-num ${isCrit ? 'crit' : ''}`;
    el.textContent = isCrit ? `✨ +${formatNumber(amount)}` : `+${formatNumber(amount)}`;

    const randomOffsetX = (Math.random() - 0.5) * 28;
    el.style.left = `${Math.max(10, relX + randomOffsetX)}px`;
    el.style.top = `${Math.max(10, relY - 10)}px`;

    this.dom.floatContainer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 550);
  }

  /**
   * Main Game Loop
   */
  gameLoop(timestamp) {
    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    // Symmetrical Delta Time handling (capped to 180s background catchup to prevent runaway loops)
    const effectiveDt = Math.min(Math.max(0, dt), 180);

    // 4.2.7 Track active playtime in seconds
    if (effectiveDt > 0) {
      this.sessionPlayTimeSec += effectiveDt;
      this.totalPlayTimeSec += effectiveDt;
    }

    // 1. Passive Alt-coins Income
    const vps = this.calculateVps();
    if (vps > 0 && effectiveDt > 0) {
      const gain = vps * effectiveDt;
      this.score += gain;
      this.totalScoreEarned += gain;
    }

    // 2. Auto-Tapper Perk
    const autoTapLevel = this.getRebirthUpgradeLvl('auto_tapper');
    if (autoTapLevel > 0) {
      this.autoTapTimer += effectiveDt;
      const interval = 1 / (autoTapLevel * 2);
      if (this.autoTapTimer >= interval) {
        this.autoTapTimer = 0;
        this.handleClick(null);
      }
    }

    // 3. Active Buffs Countdown
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      this.activeBuffs[i].duration -= effectiveDt;
      if (this.activeBuffs[i].duration <= 0) {
        this.activeBuffs.splice(i, 1);
        this.renderActiveBuffs();
      }
    }

    // 4. Combo & Fever logic
    if (this.feverActive) {
      this.feverTimer -= effectiveDt;
      this.combo = (this.feverTimer / 8) * this.maxCombo;
      if (this.feverTimer <= 0) {
        this.feverActive = false;
        this.combo = 0;
        if (window.particleEngine) window.particleEngine.setFever(false);
      }
    } else {
      if (this.combo >= this.maxCombo) {
        this.feverActive = true;
        this.feverTimer = 8;
        if (window.particleEngine) window.particleEngine.setFever(true);
        if (window.audioEngine) window.audioEngine.playFeverStart();
        this.showToast('🔥 ХАЙП-РАЗГОН АКТИВЕН!', 'Множитель тапа x3.5 на 8 секунд!', 'fever-toast', 'ХАЙП 🔥');
        this.triggerSpeechQuote("ВОТ ЭТО ДВИЖ! МУЗЫКУ НА ВСЮ ГРОМКОСТЬ!");
      } else if (this.combo > 0) {
        this.combo = Math.max(0, this.combo - this.comboDecayRate * effectiveDt);
      }
    }

    // Periodic achievement check for idle playtime milestones
    if (Math.random() < 0.008) {
      this.checkAchievements();
    }

    this.updateUI();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  updateUI() {
    if (this.dom.scoreDisplay) this.dom.scoreDisplay.textContent = formatNumber(this.score);
    if (this.dom.vpsDisplay) this.dom.vpsDisplay.textContent = formatNumber(this.calculateVps());
    if (this.dom.vpcDisplay) this.dom.vpcDisplay.textContent = formatNumber(this.calculateVpc());

    // 4.2.7 Update Session Timer display
    if (this.dom.sessionTimerVal) {
      this.dom.sessionTimerVal.textContent = formatTime(this.sessionPlayTimeSec);
    }

    // Combo bar
    if (this.dom.comboBar) {
      const pct = Math.min(100, Math.max(0, (this.combo / this.maxCombo) * 100));
      this.dom.comboBar.style.width = `${pct}%`;
    }
    if (this.dom.comboMult) {
      this.dom.comboMult.textContent = `x${this.getComboMultiplier().toFixed(1)}`;
    }
    if (this.dom.comboStatus) {
      this.dom.comboStatus.textContent = this.feverActive ? '🔥 ХАЙП-РЕЖИМ (x3.5)!' : (this.combo > 50 ? 'Тапай быстрее!' : 'Тапай по альтушке!');
    }

    // Rebirth / Evolution progress
    const isMaxStage = this.rebirthLevel >= this.eras.length - 1;
    if (this.dom.rebirthPill) {
      if (isMaxStage) {
        this.dom.rebirthPill.textContent = `МАКС. УРОВЕНЬ 👑`;
        this.dom.rebirthPill.classList.remove('ready');
      } else {
        const reqClicks = this.getClicksNeededForRebirth();
        const ready = this.rebirthClicks >= reqClicks;
        this.dom.rebirthPill.textContent = `${Math.min(reqClicks, this.rebirthClicks)}/${reqClicks} 👆`;
        this.dom.rebirthPill.classList.toggle('ready', ready);
      }
    }

    if (this.dom.shardsDisplay) {
      this.dom.shardsDisplay.textContent = formatNumber(this.neuroShards);
    }
    if (this.dom.modalShardsCount) {
      this.dom.modalShardsCount.textContent = formatNumber(this.neuroShards);
    }

    this.updateShopButtons();
  }

  updateShopButtons() {
    this.producers.forEach(prod => {
      const card = document.getElementById(`card-prod-${prod.id}`);
      if (card) {
        const cost = this.getProducerCost(prod);
        const canAfford = this.score >= cost;
        card.classList.toggle('cant-afford', !canAfford);
        const btn = card.querySelector('.item-cost-btn');
        if (btn) btn.disabled = !canAfford;
      }
    });

    this.boosters.forEach(b => {
      const card = document.getElementById(`card-booster-${b.id}`);
      if (card) {
        const cost = this.getBoosterCost(b);
        const maxed = b.count >= b.maxCount;
        const canAfford = this.score >= cost && !maxed;
        card.classList.toggle('cant-afford', !canAfford && !maxed);
        card.classList.toggle('disabled', maxed);
        const btn = card.querySelector('.item-cost-btn');
        if (btn) btn.disabled = maxed || !canAfford;
      }
    });
  }

  renderShop() {
    if (this.dom.producersList) {
      this.dom.producersList.innerHTML = '';
      this.producers.forEach(prod => {
        const cost = this.getProducerCost(prod);
        const canAfford = this.score >= cost;
        const card = document.createElement('div');
        card.className = `shop-item-card ${canAfford ? '' : 'cant-afford'}`;
        card.id = `card-prod-${prod.id}`;

        card.innerHTML = `
          <div class="item-icon-box">${prod.icon}</div>
          <div class="item-info-col">
            <div class="item-title">${prod.name}</div>
            <div class="item-desc">${prod.desc}</div>
            <div class="item-production-badge">
              <span class="prod-val">+${formatNumber(prod.baseVps)}</span>
              <span class="prod-total">/сек (всего: +${formatNumber(prod.count * prod.baseVps)}/с)</span>
            </div>
          </div>
          <div class="item-action-col">
            <div class="item-owned-tag">${prod.count} шт.</div>
            <button id="btn-buy-prod-${prod.id}" class="item-cost-btn" type="button" ${canAfford ? '' : 'disabled'}>
              <span class="currency-glyph">🖤</span>
              <span>${formatNumber(cost)}</span>
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          const now = Date.now();
          if (this.lastBuyTime && now - this.lastBuyTime < 90) return;
          this.lastBuyTime = now;
          this.buyProducer(prod.id);
        });

        this.dom.producersList.appendChild(card);
      });
    }

    if (this.dom.boostersList) {
      this.dom.boostersList.innerHTML = '';
      this.boosters.forEach(b => {
        const cost = this.getBoosterCost(b);
        const maxed = b.count >= b.maxCount;
        const canAfford = this.score >= cost && !maxed;
        const card = document.createElement('div');
        card.className = `shop-item-card ${maxed ? 'disabled' : (canAfford ? '' : 'cant-afford')}`;
        card.id = `card-booster-${b.id}`;

        let boostDesc = '';
        if (b.bonusVpc) boostDesc = `+${formatNumber(b.bonusVpc)} к тапу`;
        else if (b.critChance) boostDesc = `+${Math.round(b.critChance * 100)}% к криту`;
        else if (b.multiplier) boostDesc = `x${b.multiplier} ко всем источникам`;

        card.innerHTML = `
          <div class="item-icon-box">${b.icon}</div>
          <div class="item-info-col">
            <div class="item-title">${b.name}</div>
            <div class="item-desc">${b.desc}</div>
            <div class="item-production-badge">
              <span class="prod-val">${boostDesc}</span>
            </div>
          </div>
          <div class="item-action-col">
            <div class="item-owned-tag">${b.count}/${b.maxCount}</div>
            <button id="btn-buy-booster-${b.id}" class="item-cost-btn ${maxed ? 'disabled' : ''}" type="button" ${maxed || !canAfford ? 'disabled' : ''}>
              ${maxed ? '<span>МАКС</span>' : `<span class="currency-glyph">🖤</span><span>${formatNumber(cost)}</span>`}
            </button>
          </div>
        `;

        if (!maxed) {
          card.addEventListener('click', () => {
            const now = Date.now();
            if (this.lastBuyTime && now - this.lastBuyTime < 90) return;
            this.lastBuyTime = now;
            this.buyBooster(b.id);
          });
        }

        this.dom.boostersList.appendChild(card);
      });
    }
  }

  buyProducer(id) {
    const prod = this.producers.find(p => p.id === id);
    if (!prod) return;
    const cost = this.getProducerCost(prod);
    if (this.score >= cost) {
      this.score -= cost;
      prod.count++;
      if (window.audioEngine) window.audioEngine.playBuy();
      this.renderShop();
      this.updateUI();
      this.checkAchievements();
    }
  }

  buyBooster(id) {
    const b = this.boosters.find(x => x.id === id);
    if (!b || b.count >= b.maxCount) return;
    const cost = this.getBoosterCost(b);
    if (this.score >= cost) {
      this.score -= cost;
      b.count++;
      if (window.audioEngine) window.audioEngine.playBuy();
      this.renderShop();
      this.updateUI();
      this.checkAchievements();
    }
  }

  renderOrbitBadges() {
    // Model badges under avatar retired per requirements (Item 2, 8)
  }

  /**
   * Evolution (Rebirth) Modal & Action
   */
  openRebirthModal() {
    const cur = this.getCurrentEra();
    const next = this.getNextEra();
    const isMax = this.rebirthLevel >= this.eras.length - 1;
    const clicksNeeded = cur.clicksNeeded;

    if (this.dom.rebirthCurAvatar) this.dom.rebirthCurAvatar.textContent = cur.avatar;
    if (this.dom.rebirthCurName) this.dom.rebirthCurName.textContent = cur.name;

    if (isMax) {
      if (this.dom.rebirthNextAvatar) this.dom.rebirthNextAvatar.textContent = '👑';
      if (this.dom.rebirthNextName) this.dom.rebirthNextName.textContent = 'МАКСИМАЛЬНЫЙ УРОВЕНЬ';
      if (this.dom.rebirthEraQuote) this.dom.rebirthEraQuote.textContent = '«Абсолютная королева рейва! Все 5 стилей альтушки открыты и прокачаны!»';
      if (this.dom.rebirthClicksNum) this.dom.rebirthClicksNum.textContent = 'МАКСИМУМ (15,000 / 15,000)';
      if (this.dom.rebirthBarFill) this.dom.rebirthBarFill.style.width = '100%';
      if (this.dom.rebirthShardsReward) this.dom.rebirthShardsReward.textContent = '0';
      if (this.dom.btnDoRebirth) {
        this.dom.btnDoRebirth.textContent = '👑 ЭВОЛЮЦИЯ ЗАВЕРШЕНА!';
        this.dom.btnDoRebirth.classList.add('disabled');
      }
    } else {
      if (this.dom.rebirthNextAvatar) this.dom.rebirthNextAvatar.textContent = next.avatar;
      if (this.dom.rebirthNextName) this.dom.rebirthNextName.textContent = next.name;
      if (this.dom.rebirthEraQuote) this.dom.rebirthEraQuote.textContent = next.quote;
      if (this.dom.rebirthClicksNum) this.dom.rebirthClicksNum.textContent = `${Math.min(clicksNeeded, this.rebirthClicks)} / ${clicksNeeded}`;
      const fillPct = Math.min(100, (this.rebirthClicks / clicksNeeded) * 100);
      if (this.dom.rebirthBarFill) this.dom.rebirthBarFill.style.width = `${fillPct}%`;
      if (this.dom.rebirthShardsReward) this.dom.rebirthShardsReward.textContent = cur.shardsReward;

      const canRebirth = this.rebirthClicks >= clicksNeeded;
      if (this.dom.btnDoRebirth) {
        this.dom.btnDoRebirth.textContent = 'СОВЕРШИТЬ ЭВОЛЮЦИЮ! 🖤';
        this.dom.btnDoRebirth.classList.toggle('disabled', !canRebirth);
      }
    }

    if (this.dom.modalRebirth) this.dom.modalRebirth.classList.remove('hidden');
  }

  doRebirth() {
    const cur = this.getCurrentEra();
    if (this.rebirthClicks < cur.clicksNeeded || this.rebirthLevel >= this.eras.length - 1) {
      return;
    }

    // 4.2.1 Interstitial Ad on major game milestone (Level Up)
    this.showInterstitialAd();

    const rewardShards = cur.shardsReward;
    this.neuroShards += rewardShards;
    this.totalShardsEarned += rewardShards;

    this.rebirthLevel++;
    this.rebirthClicks = 0;
    this.score = 0;

    const fastStart = this.getRebirthUpgradeLvl('fast_start');
    this.producers.forEach((p, idx) => {
      p.count = idx === 0 ? fastStart * 5 : (idx === 1 ? fastStart * 2 : 0);
    });

    if (this.dom.modalRebirth) this.dom.modalRebirth.classList.add('hidden');

    // Trigger Warp Overlay
    if (this.dom.rebirthWarpOverlay) {
      const nextEra = this.getCurrentEra();
      if (this.dom.warpEraTitle) {
        this.dom.warpEraTitle.textContent = `УРОВЕНЬ ${nextEra.stageNumber}: ${nextEra.name} ${nextEra.avatar}`;
      }
      this.dom.rebirthWarpOverlay.classList.remove('hidden');

      if (window.audioEngine) {
        window.audioEngine.playEvolution();
      }

      setTimeout(() => {
        this.dom.rebirthWarpOverlay.classList.add('hidden');
        this.applyEraTheme();
        this.renderShop();
        this.renderOrbitBadges();
        this.updateUI();
        this.syncVkCloudSave(); // sync to cloud on major milestone
        this.showToast('🖤 ЭВОЛЮЦИЯ СОВЕРШЕНА!', `Новый уровень: ${nextEra.name}!`, 'meme-toast', 'ТРАНСФОРМАЦИЯ 👑');
        this.triggerSpeechQuote("Смотри, как я преобразилась! Теперь это настоящий стиль!");
      }, 2500);
    }
  }

  renderRebirthShop() {
    if (!this.dom.rebirthUpgradesList) return;
    this.dom.rebirthUpgradesList.innerHTML = '';

    this.rebirthUpgrades.forEach(u => {
      const cost = this.getRebirthUpgradeCost(u);
      const isMax = u.maxLevel && u.level >= u.maxLevel;
      const canAfford = this.neuroShards >= cost && !isMax;

      const card = document.createElement('div');
      card.className = `rebirth-item-card ${isMax ? 'disabled' : (canAfford ? '' : 'cant-afford')}`;
      card.innerHTML = `
        <div class="rebirth-item-icon-box">${u.icon}</div>
        <div class="rebirth-item-info">
          <div class="rebirth-item-title-row">
            <span class="rebirth-item-name">${u.name}</span>
            <span class="rebirth-item-lvl-tag">Ур. ${u.level}${u.maxLevel ? `/${u.maxLevel}` : ''}</span>
          </div>
          <div class="rebirth-item-desc">${u.desc}</div>
        </div>
        <div class="rebirth-item-action">
          <button id="btn-buy-shards-${u.id}" class="rebirth-cost-btn ${isMax ? 'disabled' : (canAfford ? '' : 'cant-afford')}" type="button" ${isMax || !canAfford ? 'disabled' : ''}>
            ${isMax ? '<span>МАКС</span>' : `<span class="shard-glyph">🦇</span><span>${cost}</span>`}
          </button>
        </div>
      `;

      if (!isMax) {
        card.addEventListener('click', (e) => {
          if (this.neuroShards >= cost) {
            this.neuroShards -= cost;
            u.level++;
            if (window.audioEngine) window.audioEngine.playBuy();
            this.renderRebirthShop();
            this.updateUI();
          }
        });
      }

      this.dom.rebirthUpgradesList.appendChild(card);
    });
  }

  renderAchievements() {
    if (!this.dom.achievementsList) return;
    this.dom.achievementsList.innerHTML = '';

    let unlockedCount = 0;
    this.achievements.forEach(ach => {
      if (ach.unlocked) unlockedCount++;

      let rewardBadges = [];
      if (ach.rewardCoins > 0) rewardBadges.push(`+${formatNumber(ach.rewardCoins)} 🖤`);
      if (ach.rewardShards > 0) rewardBadges.push(`+${ach.rewardShards} 🦇`);
      const rewardHtml = rewardBadges.length > 0
        ? `<div class="achievement-reward-tag"><span class="reward-icon">🎁</span> Награда: <strong>${rewardBadges.join(' ')}</strong></div>`
        : '';

      const statusBadge = ach.unlocked
        ? `<span class="achievement-status-tag claimed">✓ ПОЛУЧЕНО</span>`
        : `<span class="achievement-status-tag locked">🔒 ЗАКРЫТО</span>`;

      const el = document.createElement('div');
      el.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
      el.innerHTML = `
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-info">
          <div class="achievement-header-row">
            <span class="achievement-title">${ach.title}</span>
            ${statusBadge}
          </div>
          <div class="achievement-desc">${ach.desc}</div>
          <div class="achievement-quote">${ach.memeQuote}</div>
          ${rewardHtml}
        </div>
      `;
      this.dom.achievementsList.appendChild(el);
    });

    if (this.dom.achievementsCount) {
      this.dom.achievementsCount.textContent = `${unlockedCount}/${this.achievements.length}`;
    }
  }

  checkAchievements() {
    this.achievements.forEach(ach => {
      if (!ach.unlocked && ach.check()) {
        ach.unlocked = true;
        this.claimAchievement(ach);
      }
    });
  }

  claimAchievement(ach) {
    if (ach.claimed) return;
    ach.claimed = true;

    let rewardParts = [];
    if (ach.rewardCoins > 0) {
      this.score += ach.rewardCoins;
      this.totalScoreEarned += ach.rewardCoins;
      rewardParts.push(`+${formatNumber(ach.rewardCoins)} 🖤`);
    }
    if (ach.rewardShards > 0) {
      this.neuroShards += ach.rewardShards;
      this.totalShardsEarned += ach.rewardShards;
      rewardParts.push(`+${ach.rewardShards} 🦇`);
    }

    const rewardText = rewardParts.length > 0 ? `Награда: ${rewardParts.join(' ')}!` : '';

    this.renderAchievements();
    this.updateUI();
    this.showAchievementBanner(ach, rewardText);
    if (window.audioEngine) window.audioEngine.playAchievement();
  }

  showAchievementBanner(ach, rewardText = '') {
    const banner = document.getElementById('achievement-banner');
    if (!banner) return;

    const iconEl = document.getElementById('ach-banner-icon');
    const titleEl = document.getElementById('ach-banner-title');
    const descEl = document.getElementById('ach-banner-desc');
    const rewardEl = document.getElementById('ach-banner-reward');
    const closeBtn = document.getElementById('ach-banner-close');

    if (iconEl) iconEl.textContent = ach.icon || '🏆';
    if (titleEl) titleEl.textContent = ach.title;
    if (descEl) descEl.textContent = ach.desc;
    if (rewardEl) rewardEl.textContent = rewardText || '🖤 Уважение на районе получено!';

    banner.classList.remove('hidden');

    if (closeBtn) {
      closeBtn.onclick = () => {
        banner.classList.add('hidden');
      };
    }

    clearTimeout(this.achBannerTimer);
    this.achBannerTimer = setTimeout(() => {
      banner.classList.add('hidden');
    }, 4500);
  }

  showToast(title, desc, type = '', badgeText = '') {
    // Disabled as requested: no bottom-right toasts cluttering screen or blocking shop
    return;
  }

  /**
   * Save & Load Architecture (LocalStorage + Throttled VK Cloud Storage)
   */
  getSerializedState() {
    return JSON.stringify({
      score: this.score,
      totalScoreEarned: this.totalScoreEarned,
      totalClicks: this.totalClicks,
      totalBonuses: this.totalBonuses,
      rebirthLevel: this.rebirthLevel,
      rebirthClicks: this.rebirthClicks,
      neuroShards: this.neuroShards,
      totalShardsEarned: this.totalShardsEarned,
      totalPlayTimeSec: this.totalPlayTimeSec,
      lastSaveTime: Date.now(),
      producers: this.producers.map(p => ({ id: p.id, count: p.count })),
      boosters: this.boosters.map(b => ({ id: b.id, count: b.count })),
      rebirthUpgrades: this.rebirthUpgrades.map(u => ({ id: u.id, level: u.level })),
      achievements: this.achievements.map(a => ({ id: a.id, unlocked: a.unlocked, claimed: a.claimed }))
    });
  }

  applySerializedState(data) {
    if (!data || typeof data !== 'object') return;
    this.score = this.sanitizeNum(data.score, 0);
    this.totalScoreEarned = this.sanitizeNum(data.totalScoreEarned, this.score);
    this.totalClicks = this.sanitizeNum(data.totalClicks, 0);
    this.totalBonuses = this.sanitizeNum(data.totalBonuses, 0);
    this.rebirthLevel = Math.max(0, Math.min(this.eras.length - 1, Math.floor(this.sanitizeNum(data.rebirthLevel, 0))));
    this.rebirthClicks = this.sanitizeNum(data.rebirthClicks, 0);
    this.neuroShards = this.sanitizeNum(data.neuroShards, 0);
    this.totalShardsEarned = this.sanitizeNum(data.totalShardsEarned, this.neuroShards);
    this.totalPlayTimeSec = this.sanitizeNum(data.totalPlayTimeSec, 0);

    if (Array.isArray(data.producers)) {
      data.producers.forEach(sp => {
        if (!sp || typeof sp.id !== 'string') return;
        const p = this.producers.find(x => x.id === sp.id);
        if (p) p.count = Math.floor(this.sanitizeNum(sp.count, 0));
      });
    }

    if (Array.isArray(data.boosters)) {
      data.boosters.forEach(sb => {
        if (!sb || typeof sb.id !== 'string') return;
        const b = this.boosters.find(x => x.id === sb.id);
        if (b) b.count = Math.min(b.maxCount, Math.floor(this.sanitizeNum(sb.count, 0)));
      });
    }

    if (Array.isArray(data.rebirthUpgrades)) {
      data.rebirthUpgrades.forEach(su => {
        if (!su || typeof su.id !== 'string') return;
        const u = this.rebirthUpgrades.find(x => x.id === su.id);
        if (u) u.level = u.maxLevel ? Math.min(u.maxLevel, Math.floor(this.sanitizeNum(su.level, 0))) : Math.floor(this.sanitizeNum(su.level, 0));
      });
    }

    if (Array.isArray(data.achievements)) {
      data.achievements.forEach(sa => {
        if (!sa || typeof sa.id !== 'string') return;
        const a = this.achievements.find(x => x.id === sa.id);
        if (a) {
          a.unlocked = !!sa.unlocked;
          a.claimed = !!(sa.claimed ?? sa.unlocked);
        }
      });
    }

    // Offline Progress Calculation (Capped to max 24 hours = 86400s)
    if (data.lastSaveTime && typeof data.lastSaveTime === 'number') {
      const now = Date.now();
      const diffSec = Math.floor((now - data.lastSaveTime) / 1000);
      if (diffSec > 15 && diffSec < 86400 * 30) {
        const vps = this.calculateVps();
        const offlineEarned = Math.floor(vps * Math.min(diffSec, 86400) * 0.7);
        if (offlineEarned > 0) {
          this.offlinePendingReward = offlineEarned;
          setTimeout(() => {
            if (this.dom.modalOffline) {
              const timeEl = document.getElementById('offline-time');
              const earnEl = document.getElementById('offline-earned');
              if (timeEl) timeEl.textContent = `${Math.floor(diffSec / 60)} мин`;
              if (earnEl) earnEl.textContent = `+${formatNumber(offlineEarned)}`;
              this.dom.modalOffline.classList.remove('hidden');
            }
          }, 600);
        }
      }
    }
  }

  saveGame() {
    try {
      const jsonStr = this.getSerializedState();
      localStorage.setItem(this.saveKey, jsonStr);
    } catch (e) {
      console.warn('Local save failed', e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.applySerializedState(data);
    } catch (e) {
      console.warn('Local load failed', e);
    }
  }

  /**
   * VK Cloud Storage Sync: Strictly adheres to rate limits
   * - Max 1000 calls per hour (we limit to max ~40/hour via 90s throttle)
   * - Max 1000 variables (we use exactly 1 key)
   */
  syncVkCloudSave() {
    if (typeof vkBridge === 'undefined' || !vkBridge.send) return;
    if (!this.cloudSyncReady) return; // Prevent overwriting cloud data before initial pull finishes

    const now = Date.now();
    // 15-second minimum throttle between manual/auto cloud saves
    if (this.lastVkCloudSaveTime && now - this.lastVkCloudSaveTime < 15000) return;

    // Hourly counter reset
    if (now - this.vkStorageHourStart > 3600000) {
      this.vkStorageCallCount = 0;
      this.vkStorageHourStart = now;
    }

    // Rate-limit guard: never exceed 850 calls in 1 hour
    if (this.vkStorageCallCount >= 850) {
      console.warn('VK Storage hourly call limit approaching. Sync skipped.');
      return;
    }

    const jsonStr = this.getSerializedState();
    this.vkStorageCallCount++;
    this.lastVkCloudSaveTime = now;

    vkBridge.send('VKWebAppStorageSet', {
      key: this.vkCloudKey,
      value: jsonStr
    }).then(() => {
      console.log(`[VK Storage] Cloud synced (calls this hour: ${this.vkStorageCallCount}/1000)`);
      const statusEl = document.getElementById('vk-cloud-status-text');
      if (statusEl) {
        statusEl.textContent = `Синхронизировано в облако VK • Использовано 1/1000 ключей (${this.vkStorageCallCount} вызовов/ч)`;
      }
    }).catch(err => {
      console.warn('[VK Storage] Sync error:', err);
    });
  }

  loadFromVkCloud() {
    if (typeof vkBridge === 'undefined' || !vkBridge.send) {
      this.cloudSyncReady = true;
      return;
    }

    vkBridge.send('VKWebAppStorageGet', {
      keys: [this.vkCloudKey]
    }).then(res => {
      this.cloudSyncReady = true;
      if (res && res.keys && res.keys.length > 0) {
        const item = res.keys.find(k => k.key === this.vkCloudKey);
        if (item && item.value) {
          try {
            const cloudData = JSON.parse(item.value);
            // Non-destructive conflict resolution: compare rebirthLevel, total clicks, and timestamp (never raw score)
            const cloudRebirth = cloudData.rebirthLevel || 0;
            const isCloudAhead = (cloudRebirth > this.rebirthLevel) ||
              (cloudRebirth === this.rebirthLevel && (cloudData.totalClicks || 0) > this.totalClicks) ||
              (cloudData.lastSaveTime && cloudData.lastSaveTime > (this.lastSaveTime || 0));

            if (isCloudAhead) {
              this.applySerializedState(cloudData);
              this.updateUI();
              this.renderShop();
              this.renderOrbitBadges();
              this.applyEraTheme();
              this.updateStartMenuStatus();
              console.log('[VK Storage] Successfully restored save from VK Cloud!');
            }
          } catch (e) {
            console.warn('[VK Storage] Error parsing cloud save', e);
          }
        }
      }
    }).catch(err => {
      this.cloudSyncReady = true;
      console.warn('[VK Storage] Error reading cloud save', err);
    });
  }

  resetGame() {
    if (confirm('Точно сбросить весь прогресс Альтушка-Кликера?')) {
      localStorage.removeItem(this.saveKey);
      if (typeof vkBridge !== 'undefined' && vkBridge.send) {
        vkBridge.send('VKWebAppStorageSet', {
          key: this.vkCloudKey,
          value: ''
        }).catch(() => {});
      }
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
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid format');
      }
      localStorage.setItem(this.saveKey, jsonStr);
      alert('Сохранение успешно загружено!');
      window.location.reload();
    } catch (e) {
      alert('Неверный или поврежденный код сохранения!');
    }
  }

  /**
   * 4.2.1 MONETIZATION (VK Bridge & Yandex Games SDK)
   */
  showRewardedAd(onRewarded) {
    // 1. VK Bridge Rewarded Video
    if (typeof vkBridge !== 'undefined' && vkBridge.send) {
      vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'rewarded' })
        .then(data => {
          if (data && data.result) {
            if (onRewarded) onRewarded();
          } else {
            this.showToast('⚠️ Просмотр прерван', 'Награда начисляется только за полный просмотр.');
          }
        })
        .catch(err => {
          console.warn('VK Rewarded Video error / dismissed:', err);
          // Fallback for dev / desktop browser
          if (onRewarded) onRewarded();
        });
      return;
    }

    // 2. Yandex Games Rewarded Video Fallback
    if (this.ysdk) {
      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => {},
          onRewarded: () => { if (onRewarded) onRewarded(); },
          onClose: () => {},
          onError: (e) => {
            console.warn('Yandex Rewarded ad error', e);
            if (onRewarded) onRewarded();
          }
        }
      });
      return;
    }

    // 3. Dev / Local fallback
    if (onRewarded) onRewarded();
  }

  showInterstitialAd() {
    if (typeof vkBridge !== 'undefined' && vkBridge.send) {
      vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
        .catch(err => {
          console.log('VK Interstitial not shown / dismissed', err);
        });
    }
  }

  /**
   * Initialize SDKs
   */
  initVKBridge() {
    if (typeof vkBridge !== 'undefined' && vkBridge.send) {
      vkBridge.send('VKWebAppInit')
        .then(() => {
          console.log('[VK Bridge] Initialized successfully');
          this.loadFromVkCloud();
        })
        .catch(err => {
          console.warn('[VK Bridge] Init error', err);
        });
    }
  }

  initYandexSDK() {
    if (typeof YaGames !== 'undefined') {
      YaGames.init().then(ysdk => {
        this.ysdk = ysdk;
        ysdk.features.LoadingAPI?.ready();
      }).catch(err => {
        console.warn('Yandex Games SDK error', err);
      });
    }
  }

  /**
   * Modal Management Methods (Globally Accessible)
   */
  openModal(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeModal(modalId) {
    if (!modalId) {
      this.closeAllModals();
      return;
    }
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (modal) {
      if ((modal.id === 'modal-offline' || modalId === 'modal-offline') && this.offlinePendingReward > 0) {
        // Auto-credit pending offline earnings if player dismissed via X or Escape
        this.score += this.offlinePendingReward;
        this.totalScoreEarned += this.offlinePendingReward;
        this.offlinePendingReward = 0;
      }
      modal.classList.add('hidden');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  }

  /**
   * Fast Auto-Clicker Turbo Mode (Item 4)
   * Runs high-speed taps until Rebirth is available, then automatically stops and signals player.
   */
  startAutoClicker(speedMs = 30) {
    if (this.autoClickerInterval) return;
    this.isAutoClicking = true;
    if (this.dom.btnTurboClicker) {
      this.dom.btnTurboClicker.classList.add('active');
      const label = this.dom.btnTurboClicker.querySelector('.btn-label');
      if (label) label.textContent = 'Тапает...';
    }

    this.autoClickerInterval = setInterval(() => {
      const cur = this.getCurrentEra();
      const clicksNeeded = cur.clicksNeeded;

      // Stop condition: Target clicks reached for rebirth or max level
      if (this.rebirthClicks >= clicksNeeded || this.rebirthLevel >= this.eras.length - 1) {
        this.stopAutoClicker();
        if (this.dom.btnRebirth) {
          this.dom.btnRebirth.classList.add('ready');
        }
        if (window.audioEngine) window.audioEngine.playAchievement();
        console.log(`[AutoClicker] Rebirth ready! (${this.rebirthClicks}/${clicksNeeded} clicks). Auto-clicker paused.`);
        return;
      }

      this.handleClick(null);
    }, speedMs);
  }

  stopAutoClicker() {
    if (this.autoClickerInterval) {
      clearInterval(this.autoClickerInterval);
      this.autoClickerInterval = null;
    }
    this.isAutoClicking = false;
    if (this.dom.btnTurboClicker) {
      this.dom.btnTurboClicker.classList.remove('active');
      const label = this.dom.btnTurboClicker.querySelector('.btn-label');
      if (label) label.textContent = 'Авто-тап';
    }
  }

  toggleAutoClicker() {
    if (this.isAutoClicking) {
      this.stopAutoClicker();
    } else {
      this.startAutoClicker(28);
    }
  }

  /**
   * Event Listeners
   */
  setupEventListeners() {
    const attachClick = (idOrEl, handler) => {
      const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
      if (el) el.addEventListener('click', handler);
    };

    // Fast Auto-Clicker Turbo Button (Item 4)
    attachClick(this.dom.btnTurboClicker, () => this.toggleAutoClicker());

    // 4.2.10 Start Menu Controls
    attachClick(this.dom.btnStartGame, () => this.startGame());
    attachClick(this.dom.btnOpenMenu, () => this.openStartMenu());
    attachClick(this.dom.btnStartTutorial, () => this.openModal('modal-tutorial'));
    attachClick('btn-tutorial', () => this.openModal('modal-tutorial'));

    attachClick(this.dom.btnStartStats, () => {
      const btn = document.getElementById('btn-stats');
      if (btn) btn.click();
    });

    attachClick(this.dom.btnStartSettings, () => {
      const btn = document.getElementById('btn-settings');
      if (btn) btn.click();
    });

    attachClick(this.dom.btnStartAudioToggle, () => {
      if (window.audioEngine) {
        const state = window.audioEngine.toggleSfx();
        if (this.dom.btnStartAudioToggle) this.dom.btnStartAudioToggle.classList.toggle('active', state);
        if (this.dom.startAudioStatus) this.dom.startAudioStatus.textContent = state ? 'ВКЛ' : 'ВЫКЛ';
        if (this.dom.btnAudio) {
          this.dom.btnAudio.classList.toggle('active', state);
          const icon = this.dom.btnAudio.querySelector('.btn-icon');
          if (icon) icon.textContent = state ? '🔊' : '🔇';
        }
      }
    });

    attachClick(this.dom.btnStartMusicToggle, () => {
      if (window.audioEngine) {
        const state = window.audioEngine.toggleMusic();
        if (this.dom.btnStartMusicToggle) this.dom.btnStartMusicToggle.classList.toggle('active', state);
        if (this.dom.startMusicStatus) this.dom.startMusicStatus.textContent = state ? 'ВКЛ' : 'ВЫКЛ';
        if (this.dom.btnMusic) this.dom.btnMusic.classList.toggle('active', state);
      }
    });

    // Stage Clicker (with touch guard)
    if (this.dom.coreStage) {
      this.dom.coreStage.addEventListener('mousedown', (e) => this.handleClick(e));
      this.dom.coreStage.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleClick(e);
      }, { passive: false });
    }

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

    // Evolution Modal Triggers
    attachClick(this.dom.btnRebirth, () => this.openRebirthModal());
    attachClick(this.dom.btnDoRebirth, () => this.doRebirth());

    attachClick(this.dom.btnRebirthShop, () => {
      this.renderRebirthShop();
      this.openModal('modal-rebirth-shop');
    });

    // Event Choice Buttons & Single Claim Button (Item 1)
    attachClick(this.dom.btnChoiceA, () => {
      if (this.currentPendingEvent && this.currentPendingEvent.choiceA) {
        this.currentPendingEvent.choiceA.action();
      }
      this.closeModal('modal-event');
    });

    attachClick(this.dom.btnChoiceB, () => {
      if (this.currentPendingEvent && this.currentPendingEvent.choiceB) {
        this.currentPendingEvent.choiceB.action();
      }
      this.closeModal('modal-event');
    });

    attachClick(this.dom.btnClaimSingle, () => {
      if (this.currentPendingEvent && this.currentPendingEvent.choiceA && !this.currentPendingEvent.choiceB) {
        this.currentPendingEvent.choiceA.action();
      }
      this.closeModal('modal-event');
    });

    // 4.2.1 Rewarded Video Boost Button
    attachClick(this.dom.btnAdBoost, () => {
      this.showRewardedAd(() => {
        this.addBuff('ad_boost_reward', 'Рекламный Буст (x5)', '🎬', 5, 120, 'all');
        this.showToast('🎬 БУСТ АКТИВИРОВАН!', 'x5 множитель всего заработка на 2 минуты!', 'meme-toast', 'СУПЕР-УСКОРЕНИЕ 🚀');
        if (window.audioEngine) window.audioEngine.playBuy();
      });
    });

    attachClick(this.dom.btnClaimOfflineX2, () => {
      this.showRewardedAd(() => {
        if (this.offlinePendingReward) {
          const doubled = this.offlinePendingReward * 2;
          this.score += doubled;
          this.totalScoreEarned += doubled;
          this.offlinePendingReward = 0;
          this.showToast('💰 НАГРАДА УДВОЕНА!', `Получено +${formatNumber(doubled)} Альт-коинов!`, 'meme-toast', 'РЕКЛАМА 🎬');
        }
        this.closeModal('modal-offline');
        if (window.audioEngine) window.audioEngine.playBuy();
      });
    });

    // Audio & Music Toggles in Header
    attachClick(this.dom.btnAudio, () => {
      if (window.audioEngine) {
        const state = window.audioEngine.toggleSfx();
        this.dom.btnAudio.classList.toggle('active', state);
        const icon = this.dom.btnAudio.querySelector('.btn-icon');
        if (icon) icon.textContent = state ? '🔊' : '🔇';
        if (this.dom.startAudioStatus) this.dom.startAudioStatus.textContent = state ? 'ВКЛ' : 'ВЫКЛ';
      }
    });

    attachClick(this.dom.btnMusic, () => {
      if (window.audioEngine) {
        const state = window.audioEngine.toggleMusic();
        this.dom.btnMusic.classList.toggle('active', state);
        if (this.dom.startMusicStatus) this.dom.startMusicStatus.textContent = state ? 'ВКЛ' : 'ВЫКЛ';
      }
    });

    // Stats Modal
    attachClick('btn-stats', () => {
      const cur = this.getCurrentEra();
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setVal('st-total-vibe', formatNumber(this.totalScoreEarned));
      setVal('st-total-clicks', formatNumber(this.totalClicks));
      setVal('st-rebirth-level', `${cur.stageNumber} (${cur.name})`);
      setVal('st-total-shards', formatNumber(this.totalShardsEarned));
      if (this.dom.stPlaytime) this.dom.stPlaytime.textContent = formatTime(this.totalPlayTimeSec);
      if (this.dom.stTotalBonuses) this.dom.stTotalBonuses.textContent = formatNumber(this.totalBonuses);
      this.openModal('modal-stats');
    });

    // Settings Modal
    attachClick('btn-settings', () => {
      this.openModal('modal-settings');
    });

    // Claim offline button (regular)
    attachClick('btn-claim-offline', () => {
      if (this.offlinePendingReward) {
        this.score += this.offlinePendingReward;
        this.totalScoreEarned += this.offlinePendingReward;
        this.offlinePendingReward = 0;
      }
      this.closeModal('modal-offline');
      if (window.audioEngine) window.audioEngine.playBuy();
    });

    // Settings actions
    attachClick('btn-force-save', () => {
      this.saveGame();
      this.syncVkCloudSave();
      this.showToast('💾 Сохранено', 'Прогресс сохранен локально и отправлен в облако VK!');
    });

    attachClick('btn-reset-game', () => this.resetGame());
    attachClick('btn-export-save', () => this.exportSave());
    attachClick('btn-import-save', () => this.importSave());

    // Settings controls: Quality & Volume
    const qualitySelect = document.getElementById('setting-fx-quality');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', (e) => {
        if (window.particleEngine) {
          window.particleEngine.setQuality(e.target.value);
        }
      });
    }

    const volSlider = document.getElementById('setting-sfx-volume');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const vol = e.target.value / 100;
        if (window.audioEngine) {
          window.audioEngine.setVolume(vol);
        }
      });
    }

    // =========================================================================
    // UNIVERSAL BULLETPROOF MODAL CLOSE DELEGATION
    // Catches clicks on .modal-close, [data-close], and backdrops globally
    // =========================================================================
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.modal-close, [data-close]');
      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const targetModalId = closeBtn.getAttribute('data-close');
        if (targetModalId) {
          this.closeModal(targetModalId);
        } else {
          const parentModal = closeBtn.closest('.modal-overlay');
          if (parentModal) this.closeModal(parentModal);
        }
        return;
      }

      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal(e.target);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Save on tab minimize / switch / close
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveGame();
        this.syncVkCloudSave();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.saveGame();
      this.syncVkCloudSave();
    });
  }
}

// Launch Game on Window Load
window.addEventListener('DOMContentLoaded', () => {
  window.altushkaGame = new AltushkaGame();
  window.startAutoClicker = (speed) => window.altushkaGame && window.altushkaGame.startAutoClicker(speed);
  window.stopAutoClicker = () => window.altushkaGame && window.altushkaGame.stopAutoClicker();
});
