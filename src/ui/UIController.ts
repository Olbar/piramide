import type Phaser from 'phaser';
import type { GameSession } from '../core/GameSession';
import type { DifficultyId, NoteDef, RoomDef, SecretKind } from '../core/types';
import { DIFFICULTIES, getDifficulty } from '../core/GameConfig';
import { ROOMS, CONNECTIONS } from '../rooms/rooms-data';
import { ACHIEVEMENTS } from '../achievements/AchievementsManager';
import { computeRating } from '../achievements/Rating';
import type { EndingType } from '../achievements/EndingSelector';
import { audio } from '../game/AudioManager';
import { touchInput, resetTouch } from '../game/input';

const CATEGORY_LABELS: Record<string, string> = {
  key: 'Ключи',
  'golden-key': 'Золотые ключи',
  artifact: 'Артефакты',
  inscription: 'Фрагменты древней надписи',
  magic: 'Магические предметы',
  crystal: 'Главный кристалл',
};

const CATEGORY_ICONS: Record<string, string> = {
  key: '🗝️',
  'golden-key': '🔑',
  artifact: '🏺',
  inscription: '📜',
  magic: '🔮',
  crystal: '💎',
};

const KIND_LABELS: Record<SecretKind, string> = {
  'lava-jump': 'Прыжки над лавой',
  'rope-climb': 'Подъём по канату',
  'secret-wall': 'Тайная стена',
  'lever-sequence': 'Последовательность рычагов',
  'spikes-key': 'Ключ над шипами',
  'hidden-chest': 'Скрытый сундук',
  'symbol-decode': 'Расшифровка символов',
  'light-mirror': 'Зеркала света',
  'timed-jump': 'Прыжок с таймингом',
  'moving-platform': 'Движущиеся платформы',
  'hidden-passage': 'Скрытый проход',
  'artifact-hunt': 'Охота за артефактом',
};

const DIFF_TIER_LABELS: Record<DifficultyId, string> = {
  explorer: 'Лёгкий',
  seeker: 'Средний',
  archaeologist: 'Сложный',
  pharaoh: 'Экстремальный',
};

const DIFF_DESCRIPTIONS: Record<DifficultyId, string> = {
  explorer: 'Ловушки медленнее, платформы шире, в комнатах есть дополнительные подсказки. Для первого знакомства с пирамидой.',
  seeker: 'Классический баланс скорости ловушек и размера платформ. Стандартное приключение.',
  archaeologist: 'Ловушки быстрее, платформы уже, головоломки строже. Для опытных исследователей.',
  pharaoh: 'Максимальная скорость ловушек, крошечные платформы и все 120 секретов обязательны. Проклятие фараона в полную силу.',
};

const MAP_ROWS = [[20], [18, 19], [15, 16, 17], [11, 12, 13, 14], [6, 7, 8, 9, 10], [1, 2, 3, 4, 5]];

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export class UIController {
  private root: HTMLElement;
  private hud!: HTMLElement;
  private bottomBar!: HTMLElement;
  private toasts!: HTMLElement;
  private touchControls!: HTMLElement;
  private modalHost: HTMLElement | null = null;
  private pausedByModal = false;
  private mode: 'menu' | 'game' | 'ending' = 'menu';
  private hp = 3;
  private skipBtn: HTMLElement | null = null;
  private hudTimer: number;

  constructor(
    private readonly session: GameSession,
    private readonly game: Phaser.Game,
  ) {
    this.root = document.getElementById('ui-root')!;
    this.buildHud();
    this.buildBottomBar();
    this.buildToasts();
    this.buildTouchControls();
    this.bindSessionEvents();
    this.bindKeys();
    this.hudTimer = window.setInterval(() => {
      if (this.mode === 'game') this.updateHud();
    }, 1000);
    this.showMainMenu();
  }

  destroy(): void {
    window.clearInterval(this.hudTimer);
  }

  // ---------- DOM construction ----------

  private buildHud(): void {
    this.hud = el('div', 'hud');
    this.hud.style.display = 'none';
    this.hud.innerHTML = `
      <div class="hud-room"><span class="hud-room-name"></span><span class="hud-room-sub"></span></div>
      <span class="hud-stat hud-rooms"></span>
      <span class="hud-stat hud-secrets"></span>
      <span class="hud-stat hud-keys"></span>
      <span class="hud-stat hud-hints"></span>
      <span class="hud-stat hud-hp"></span>
      <span class="hud-spacer"></span>
      <span class="hud-stat hud-time"></span>`;
    this.root.appendChild(this.hud);
  }

  private buildBottomBar(): void {
    this.bottomBar = el('div', 'bottom-bar');
    this.bottomBar.style.display = 'none';
    const buttons: [string, string, () => void][] = [
      ['🎒 Инвентарь', 'I', () => this.showInventory()],
      ['🗺️ Карта', 'M', () => this.showMap()],
      ['📖 Журнал', 'J', () => this.showJournal()],
      ['💡 Подсказка', 'H', () => this.requestHint()],
      ['⚙️ Настройки', '', () => this.showSettings()],
      ['⏸️ Пауза', 'Esc', () => this.showPause()],
    ];
    for (const [label, kbd, handler] of buttons) {
      const btn = el('button', 'bar-btn') as HTMLButtonElement;
      btn.innerHTML = label + (kbd ? `<span class="kbd">${kbd}</span>` : '');
      btn.addEventListener('click', handler);
      this.bottomBar.appendChild(btn);
    }
    this.root.appendChild(this.bottomBar);
  }

  private buildToasts(): void {
    this.toasts = el('div', 'toasts');
    this.root.appendChild(this.toasts);
  }

  private buildTouchControls(): void {
    this.touchControls = el('div', 'touch-controls');
    const left = el('div', 'touch-cluster');
    const right = el('div', 'touch-cluster');

    const hold = (btn: HTMLElement, key: 'left' | 'right' | 'up' | 'down' | 'run'): void => {
      const on = (e: Event): void => {
        e.preventDefault();
        touchInput[key] = true;
        btn.classList.add('held');
      };
      const off = (e: Event): void => {
        e.preventDefault();
        touchInput[key] = false;
        btn.classList.remove('held');
      };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('pointerleave', off);
    };

    const mk = (label: string, cls = ''): HTMLButtonElement => {
      const b = el('button', `touch-btn ${cls}`.trim(), label) as HTMLButtonElement;
      return b;
    };

    const btnLeft = mk('◀');
    const btnRight = mk('▶');
    hold(btnLeft, 'left');
    hold(btnRight, 'right');
    left.append(btnLeft, btnRight);

    const btnUp = mk('▲', 'small');
    const btnDown = mk('▼', 'small');
    hold(btnUp, 'up');
    hold(btnDown, 'down');
    const btnRun = mk('🏃', 'small');
    hold(btnRun, 'run');
    const btnE = mk('E', 'small');
    btnE.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      touchInput.interact = true;
    });
    const btnJump = mk('⤒', 'jump');
    btnJump.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      touchInput.jump = true;
    });
    right.append(btnUp, btnDown, btnRun, btnE, btnJump);

    this.touchControls.append(left, right);
    this.root.appendChild(this.touchControls);
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // ---------- Events ----------

  private bindSessionEvents(): void {
    const ev = this.session.events;
    ev.on('toast', (p) => {
      const { text, kind } = p as { text: string; kind?: string };
      this.toast(text, kind);
    });
    ev.on('room-entered-ui', (p) => {
      this.hp = 3;
      this.updateHud(p as RoomDef);
    });
    ev.on('player-hurt', (p) => {
      this.hp = p as number;
      this.updateHud();
    });
    ev.on('secret-completed', () => this.updateHud());
    ev.on('hint-used', () => this.updateHud());
    ev.on('hint-request', () => this.requestHint());
    ev.on('map-request', () => {
      if (this.mode === 'game' && !this.modalHost) this.showMap();
    });
    ev.on('pause-request', () => {
      if (this.mode === 'game' && !this.modalHost) this.showPause();
    });
    ev.on('note-open', (p) => this.showNote(p as NoteDef));
    ev.on('achievement-unlocked', (p) => {
      const def = ACHIEVEMENTS[p as string];
      if (def) this.toast(`🏆 Достижение: «${def.title}» — ${def.description}`, 'achievement', 6000);
    });
    ev.on('game-finished', (p) => this.startEnding(p as EndingType));
    ev.on('ending-complete', (p) => {
      const { texts } = p as { ending: EndingType; texts: { title: string; text: string } };
      this.showResults(texts);
    });
  }

  private bindKeys(): void {
    window.addEventListener('keydown', (e) => {
      if (this.modalHost) {
        if (e.code === 'Escape') {
          e.stopImmediatePropagation();
          this.closeModal();
        }
        return;
      }
      if (this.mode !== 'game') return;
      if (e.code === 'KeyI') this.showInventory();
      else if (e.code === 'KeyJ') this.showJournal();
      else if (e.code === 'KeyC') this.showControls();
    });
  }

  // ---------- Toasts ----------

  toast(text: string, kind = 'info', duration = 4200): void {
    const t = el('div', `toast ${kind}`, text);
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 5) this.toasts.firstChild?.remove();
    window.setTimeout(() => {
      t.classList.add('fade-out');
      window.setTimeout(() => t.remove(), 450);
    }, duration);
  }

  // ---------- Modal plumbing ----------

  private showModal(content: HTMLElement, opts: { closable?: boolean; pause?: boolean; transparent?: boolean } = {}): void {
    this.closeModal();
    const backdrop = el('div', 'modal-backdrop');
    if (opts.transparent) backdrop.style.background = 'transparent';
    const modal = el('div', 'modal');
    if (opts.closable !== false) {
      const close = el('button', 'modal-close', '✕') as HTMLButtonElement;
      close.addEventListener('click', () => this.closeModal());
      modal.appendChild(close);
    }
    modal.appendChild(content);
    backdrop.appendChild(modal);
    backdrop.addEventListener('pointerdown', (e) => {
      if (e.target === backdrop && opts.closable !== false) this.closeModal();
    });
    this.root.appendChild(backdrop);
    this.modalHost = backdrop;
    if (opts.pause !== false && this.game.scene.isActive('Game')) {
      this.game.scene.pause('Game');
      this.pausedByModal = true;
      resetTouch();
    }
  }

  private closeModal(): void {
    if (!this.modalHost) return;
    this.modalHost.remove();
    this.modalHost = null;
    if (this.pausedByModal) {
      this.pausedByModal = false;
      // Phaser keeps key events queued while the scene is paused; drop them so
      // the Escape that closed this modal doesn't fire pause-request on resume.
      const kb = this.game.input.keyboard as { queue: unknown[] } | null;
      if (kb) kb.queue.length = 0;
      if (this.game.scene.isPaused('Game')) this.game.scene.resume('Game');
    }
  }

  // ---------- HUD ----------

  private updateHud(room?: RoomDef): void {
    if (this.mode !== 'game') return;
    const def = room ?? this.session.currentRoomDef;
    const state = this.session.state;
    const diff = getDifficulty(state.difficulty);
    const set = (cls: string, html: string): void => {
      const node = this.hud.querySelector(cls);
      if (node) node.innerHTML = html;
    };
    (this.hud.querySelector('.hud-room-name') as HTMLElement).textContent = def.name;
    (this.hud.querySelector('.hud-room-sub') as HTMLElement).textContent = def.subtitle;
    set('.hud-rooms', `Комната <b>${state.currentRoom}/20</b>`);
    const reqDone = this.session.secrets.requiredCompletedCount(state.difficulty);
    set('.hud-secrets', `Секреты <b>${state.completedSecrets.length}/120</b> · нужно <b>${reqDone}/${diff.requiredSecrets}</b>`);
    const keys = this.session.inventory.byCategory();
    const keyCount = keys.key.length + keys['golden-key'].length;
    set('.hud-keys', `🗝️ <b>${keyCount}</b>`);
    set('.hud-hints', `💡 <b>${this.session.hints.remaining}/3</b>`);
    set('.hud-hp', '❤️'.repeat(Math.max(0, this.hp)) + '🖤'.repeat(Math.max(0, 3 - this.hp)));
    set('.hud-time', `⏱ ${formatTime(state.elapsedMs)}`);
  }

  private setGameChrome(visible: boolean): void {
    this.hud.style.display = visible ? 'flex' : 'none';
    this.bottomBar.style.display = visible ? 'flex' : 'none';
    this.touchControls.classList.toggle('visible', visible && this.isTouchDevice());
  }

  // ---------- Main menu ----------

  private showMainMenu(): void {
    this.mode = 'menu';
    this.setGameChrome(false);
    const wrap = el('div', 'menu-main');
    const title = el('div', 'menu-title');
    title.appendChild(el('h1', undefined, 'ПРОКЛЯТИЕ ПИРАМИДЫ'));
    title.appendChild(el('p', undefined, 'Побег из вечности'));
    wrap.appendChild(title);

    const buttons = el('div', 'menu-buttons');
    const newBtn = el('button', 'menu-btn primary', '🏺 Новая игра') as HTMLButtonElement;
    newBtn.addEventListener('click', () => this.showDifficultySelect());
    const contBtn = el('button', 'menu-btn', '⏳ Продолжить') as HTMLButtonElement;
    contBtn.disabled = true;
    void this.session.saveManager.hasSave().then((has) => {
      contBtn.disabled = !has;
    });
    contBtn.addEventListener('click', () => void this.continueGame());
    const ctrlBtn = el('button', 'menu-btn', '🎮 Управление') as HTMLButtonElement;
    ctrlBtn.addEventListener('click', () => this.showControls(true));
    const setBtn = el('button', 'menu-btn', '⚙️ Настройки') as HTMLButtonElement;
    setBtn.addEventListener('click', () => this.showSettings(true));
    const credBtn = el('button', 'menu-btn', '👥 Авторы') as HTMLButtonElement;
    credBtn.addEventListener('click', () => this.showCredits(true));
    buttons.append(newBtn, contBtn, ctrlBtn, setBtn, credBtn);
    wrap.appendChild(buttons);
    this.showModal(wrap, { closable: false, pause: false, transparent: true });
  }

  private showDifficultySelect(): void {
    const wrap = el('div');
    wrap.appendChild(el('h2', undefined, 'Выберите сложность'));
    const grid = el('div', 'diff-grid');
    let selected: DifficultyId = 'seeker';
    const cards = new Map<DifficultyId, HTMLElement>();
    for (const [id, cfg] of Object.entries(DIFFICULTIES) as [DifficultyId, (typeof DIFFICULTIES)['explorer']][]) {
      const card = el('div', 'diff-card');
      card.innerHTML = `
        <div class="diff-name">${cfg.label}</div>
        <div class="diff-label">${DIFF_TIER_LABELS[id]}</div>
        <div class="diff-secrets">${cfg.requiredSecrets} секретов</div>
        <div class="diff-desc">${DIFF_DESCRIPTIONS[id]}</div>`;
      card.addEventListener('click', () => {
        selected = id;
        for (const [cid, c] of cards) c.classList.toggle('selected', cid === id);
      });
      cards.set(id, card);
      grid.appendChild(card);
    }
    cards.get(selected)?.classList.add('selected');
    wrap.appendChild(grid);
    const row = el('div', 'results-buttons');
    const back = el('button', 'menu-btn', '← Назад') as HTMLButtonElement;
    back.addEventListener('click', () => this.showMainMenu());
    const start = el('button', 'menu-btn primary', 'Начать приключение ▸') as HTMLButtonElement;
    start.addEventListener('click', () => this.startNewGame(selected));
    row.append(back, start);
    wrap.appendChild(row);
    this.showModal(wrap, { closable: false, pause: false, transparent: true });
  }

  private startNewGame(difficulty: DifficultyId): void {
    this.session.newGame(difficulty);
    this.enterGame();
  }

  private async continueGame(): Promise<void> {
    const ok = await this.session.load();
    if (!ok) {
      this.toast('Не удалось загрузить сохранение.', 'warn');
      return;
    }
    if (this.session.state.finished) {
      this.enterGame();
      return;
    }
    this.enterGame();
  }

  private enterGame(): void {
    this.closeModal();
    this.mode = 'game';
    this.hp = 3;
    audio.setSettings(this.session.gameSettings);
    this.setGameChrome(true);
    this.game.scene.start('Game', { session: this.session });
    this.updateHud();
  }

  private async toMainMenu(): Promise<void> {
    this.closeModal();
    if (this.session.isStarted) await this.session.flush();
    resetTouch();
    this.mode = 'menu';
    this.setGameChrome(false);
    this.game.scene.start('Menu');
    this.showMainMenu();
  }

  // ---------- Controls / settings / credits ----------

  private showControls(fromMenu = false): void {
    const wrap = el('div');
    wrap.appendChild(el('h2', undefined, 'Управление'));
    const table = el('table', 'controls-table');
    const rows: [string, string][] = [
      ['Движение', '<span class="kbd-key">A</span><span class="kbd-key">D</span> или <span class="kbd-key">←</span><span class="kbd-key">→</span>'],
      ['Бег', '<span class="kbd-key">Shift</span> + движение'],
      ['Прыжок', '<span class="kbd-key">Space</span> (есть coyote time и буфер прыжка)'],
      ['Канат: вверх / вниз', '<span class="kbd-key">W</span><span class="kbd-key">S</span> или <span class="kbd-key">↑</span><span class="kbd-key">↓</span>'],
      ['Взаимодействие', '<span class="kbd-key">E</span> — сундуки, рычаги, двери, записки'],
      ['Подсказка', '<span class="kbd-key">H</span> — всего 3 за игру, этапы уточняются'],
      ['Карта пирамиды', '<span class="kbd-key">M</span>'],
      ['Инвентарь', '<span class="kbd-key">I</span>'],
      ['Журнал', '<span class="kbd-key">J</span>'],
      ['Пауза', '<span class="kbd-key">Esc</span>'],
    ];
    for (const [action, keys] of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${action}</td><td>${keys}</td>`;
      table.appendChild(tr);
    }
    wrap.appendChild(table);
    const p = el('p', 'text-block', 'На мобильных устройствах используйте экранные кнопки. Смерть возвращает к контрольной точке комнаты — ключи и секреты сохраняются. Все посещённые комнаты доступны через карту.');
    wrap.appendChild(p);
    if (fromMenu) {
      const back = el('button', 'menu-btn', '← В меню') as HTMLButtonElement;
      back.addEventListener('click', () => this.showMainMenu());
      wrap.appendChild(back);
    }
    this.showModal(wrap, { pause: !fromMenu });
  }

  private showSettings(fromMenu = false): void {
    const wrap = el('div');
    wrap.appendChild(el('h2', undefined, 'Настройки звука'));
    const settings = this.session.gameSettings;
    const mkRow = (label: string, key: 'musicVolume' | 'sfxVolume'): void => {
      const row = el('div', 'setting-row');
      row.appendChild(el('label', undefined, label));
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '100';
      input.value = String(Math.round(settings[key] * 100));
      const val = el('span', 'val', `${input.value}%`);
      input.addEventListener('input', () => {
        val.textContent = `${input.value}%`;
        const patch = { [key]: Number(input.value) / 100 };
        this.session.updateSettings(patch);
        audio.setSettings(this.session.gameSettings);
        if (key === 'sfxVolume') audio.play('lever');
      });
      row.append(input, val);
      wrap.appendChild(row);
    };
    mkRow('🎵 Музыка', 'musicVolume');
    mkRow('🔊 Эффекты', 'sfxVolume');
    if (fromMenu) {
      const back = el('button', 'menu-btn', '← В меню') as HTMLButtonElement;
      back.addEventListener('click', () => this.showMainMenu());
      wrap.appendChild(back);
    }
    this.showModal(wrap, { pause: !fromMenu });
  }

  private showCredits(fromMenu = false): void {
    const wrap = el('div');
    wrap.appendChild(el('h2', undefined, 'Авторы'));
    const block = el('div', 'text-block');
    block.innerHTML = `
      <p><b>«Проклятие пирамиды: Побег из вечности»</b></p>
      <p>Геймдизайн и реализация — по техническому заданию заказчика.</p>
      <p>Движок: Phaser 3 · TypeScript · Vite.<br>
      Графика: процедурная, без внешних ассетов.<br>
      Музыка и звуки: синтез WebAudio в реальном времени.<br>
      Тестирование: Vitest (логика) + Playwright (e2e).</p>
      <p>20 комнат · 120 секретов · 4 сложности · 3 концовки.</p>`;
    wrap.appendChild(block);
    if (fromMenu) {
      const back = el('button', 'menu-btn', '← В меню') as HTMLButtonElement;
      back.addEventListener('click', () => this.showMainMenu());
      wrap.appendChild(back);
    }
    this.showModal(wrap, { pause: !fromMenu });
  }

  // ---------- Pause ----------

  private showPause(): void {
    const wrap = el('div');
    wrap.appendChild(el('h2', undefined, 'Пауза'));
    const buttons = el('div', 'menu-buttons');
    const resume = el('button', 'menu-btn primary', '▶ Продолжить') as HTMLButtonElement;
    resume.addEventListener('click', () => this.closeModal());
    const ctrl = el('button', 'menu-btn', '🎮 Управление') as HTMLButtonElement;
    ctrl.addEventListener('click', () => this.showControls());
    const settings = el('button', 'menu-btn', '⚙️ Настройки') as HTMLButtonElement;
    settings.addEventListener('click', () => this.showSettings());
    const menu = el('button', 'menu-btn', '🏠 В главное меню') as HTMLButtonElement;
    menu.addEventListener('click', () => void this.toMainMenu());
    buttons.append(resume, ctrl, settings, menu);
    wrap.appendChild(buttons);
    this.showModal(wrap);
  }

  // ---------- Inventory ----------

  private showInventory(): void {
    const wrap = el('div');
    wrap.appendChild(el('h2', undefined, 'Инвентарь'));
    const byCat = this.session.inventory.byCategory();
    let any = false;
    for (const [cat, label] of Object.entries(CATEGORY_LABELS)) {
      const items = byCat[cat as keyof typeof byCat];
      if (!items || items.length === 0) continue;
      any = true;
      const section = el('div', 'inv-category');
      section.appendChild(el('h3', undefined, `${CATEGORY_ICONS[cat]} ${label} (${items.length})`));
      const grid = el('div', 'inv-grid');
      for (const item of items) {
        const card = el('div', 'inv-item');
        card.innerHTML = `<span class="icon">${CATEGORY_ICONS[cat]}</span><span><span class="name">${item.name}</span><br><span class="desc">${item.description}</span></span>`;
        grid.appendChild(card);
      }
      section.appendChild(grid);
      wrap.appendChild(section);
    }
    if (!any) wrap.appendChild(el('p', 'inv-empty', 'Инвентарь пуст.'));
    this.showModal(wrap);
  }

  // ---------- Map ----------

  private showMap(): void {
    const wrap = el('div', 'map-wrap');
    wrap.appendChild(el('h2', undefined, 'Карта пирамиды'));
    const state = this.session.state;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 800 640');
    svg.setAttribute('width', '760');

    const positions = new Map<number, { x: number; y: number }>();
    MAP_ROWS.forEach((row, ri) => {
      const y = 70 + ri * 100;
      row.forEach((id, i) => {
        positions.set(id, { x: 400 + (i - (row.length - 1) / 2) * 135, y });
      });
    });

    for (const conn of CONNECTIONS) {
      const a = positions.get(conn.from)!;
      const b = positions.get(conn.to)!;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', String(a.x));
      line.setAttribute('y1', String(a.y));
      line.setAttribute('x2', String(b.x));
      line.setAttribute('y2', String(b.y));
      const locked = conn.doorId ? !this.session.doors.isOpen(conn.doorId) : false;
      line.setAttribute('stroke', locked ? '#e86a5a' : '#e8c46a');
      line.setAttribute('stroke-opacity', locked ? '0.5' : '0.35');
      line.setAttribute('stroke-width', '2');
      if (locked) line.setAttribute('stroke-dasharray', '6 5');
      svg.appendChild(line);
    }

    for (const [id, pos] of positions) {
      const def = this.session.roomDef(id)!;
      const visited = state.visitedRooms.includes(id);
      const completed = state.completedRooms.includes(id);
      const current = state.currentRoom === id;
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('class', `map-node${visited ? ' visited' : ''}`);
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', String(pos.x));
      circle.setAttribute('cy', String(pos.y));
      circle.setAttribute('r', '27');
      circle.setAttribute('fill', current ? '#1c3f4a' : visited ? '#4a3d26' : '#241c3a');
      circle.setAttribute('stroke', current ? '#66ddff' : completed ? '#7ad07a' : visited ? '#e8c46a' : '#4a3d66');
      circle.setAttribute('stroke-width', current ? '3' : '2');
      const num = document.createElementNS(ns, 'text');
      num.setAttribute('x', String(pos.x));
      num.setAttribute('y', String(pos.y + 5));
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('font-size', '16');
      num.setAttribute('fill', visited ? '#ffe9b0' : '#776f8f');
      num.textContent = String(id);
      const title = document.createElementNS(ns, 'title');
      title.textContent = visited ? `${def.name} — ${def.subtitle}` : 'Не исследовано';
      g.append(circle, num, title);
      if (completed) {
        const check = document.createElementNS(ns, 'text');
        check.setAttribute('x', String(pos.x + 18));
        check.setAttribute('y', String(pos.y - 18));
        check.setAttribute('font-size', '14');
        check.setAttribute('fill', '#7ad07a');
        check.textContent = '✓';
        g.appendChild(check);
      }
      if (visited && !current) {
        g.addEventListener('click', () => {
          if (this.session.enterRoom(id)) {
            this.closeModal();
            this.game.scene.start('Game', { session: this.session });
            this.updateHud();
          }
        });
      }
      svg.appendChild(g);
    }

    wrap.appendChild(svg);
    const legend = el('div', 'map-legend');
    legend.innerHTML = '<span class="l-current">текущая</span><span class="l-visited">посещена</span><span class="l-done">пройдена</span><span class="l-locked">запертая дверь</span>';
    wrap.appendChild(legend);
    wrap.appendChild(el('p', 'map-hint', 'Нажмите на посещённую комнату, чтобы вернуться в неё. Ключи и решённые головоломки сохраняются.'));
    this.showModal(wrap);
  }

  // ---------- Journal ----------

  private showJournal(tab: 'hints' | 'notes' | 'secrets' | 'achievements' = 'hints'): void {
    const wrap = el('div');
    wrap.appendChild(el('h2', undefined, 'Журнал исследователя'));
    const tabs = el('div', 'tabs');
    const content = el('div');
    const defs: ['hints' | 'notes' | 'secrets' | 'achievements', string][] = [
      ['hints', `💡 Подсказки (${this.session.hints.remaining}/3)`],
      ['notes', '📜 Записки'],
      ['secrets', '🔍 Секреты'],
      ['achievements', '🏆 Достижения'],
    ];
    const render = (t: typeof tab): void => {
      content.innerHTML = '';
      tabs.innerHTML = '';
      for (const [id, label] of defs) {
        const btn = el('button', `tab-btn${id === t ? ' active' : ''}`, label) as HTMLButtonElement;
        btn.addEventListener('click', () => render(id));
        tabs.appendChild(btn);
      }
      if (t === 'hints') this.renderHints(content);
      else if (t === 'notes') this.renderNotes(content);
      else if (t === 'secrets') this.renderSecrets(content);
      else this.renderAchievements(content);
    };
    tabs.innerHTML = '';
    render(tab);
    wrap.append(tabs, content);
    this.showModal(wrap);
  }

  private renderHints(host: HTMLElement): void {
    const journal = this.session.hints.journal;
    if (journal.length === 0) {
      host.appendChild(el('p', 'journal-empty', 'Подсказки ещё не использованы. Нажмите H в игре — всего доступно 3 подсказки за прохождение, каждая следующая в комнате точнее предыдущей.'));
      return;
    }
    for (const record of journal) {
      const entry = el('div', 'journal-entry');
      const roomId = record.contextId.replace('room-', '');
      entry.innerHTML = `<div class="meta">Комната ${roomId} · этап ${record.stage}/3</div>${record.text}`;
      host.appendChild(entry);
    }
  }

  private renderNotes(host: HTMLElement): void {
    const found = this.session.state.notesFound;
    const allNotes: NoteDef[] = ROOMS.flatMap((r) => r.notes);
    const notes = allNotes.filter((n) => found.includes(n.id));
    if (notes.length === 0) {
      host.appendChild(el('p', 'journal-empty', 'Записки древних ещё не найдены. Ищите свитки в комнатах.'));
      return;
    }
    for (const note of notes) {
      const entry = el('div', 'journal-entry');
      entry.innerHTML = `<div class="meta">📜 ${note.title}</div>${note.text}`;
      host.appendChild(entry);
    }
  }

  private renderSecrets(host: HTMLElement): void {
    const state = this.session.state;
    const tier = getDifficulty(state.difficulty).requiredSecrets / 30;
    for (const room of ROOMS) {
      const done = room.secrets.filter((s) => state.completedSecrets.includes(s.id)).length;
      const header = el('div', 'secret-room-header');
      const visited = state.visitedRooms.includes(room.id);
      header.innerHTML = `<span>${room.id}. ${visited ? room.name : '???'}</span><span>${done}/6</span>`;
      host.appendChild(header);
      for (const secret of room.secrets) {
        const completed = state.completedSecrets.includes(secret.id);
        const discovered = state.discoveredSecrets.includes(secret.id);
        const row = el('div', `secret-row ${completed ? 'done' : discovered ? 'found' : 'unknown'}`);
        const required = secret.tier <= tier ? '<span class="req">обязательный</span>' : '';
        if (completed) row.innerHTML = `<span class="mark">✓</span><span>${secret.title}</span>${required}`;
        else if (discovered) row.innerHTML = `<span class="mark">◈</span><span>${secret.title} — раскрыт, не завершён</span>${required}`;
        else row.innerHTML = `<span class="mark">?</span><span>??? — ${KIND_LABELS[secret.kind] ?? secret.kind}</span>${required}`;
        host.appendChild(row);
      }
    }
  }

  private renderAchievements(host: HTMLElement): void {
    const unlocked = this.session.achievements.unlocked;
    const grid = el('div', 'ach-grid');
    for (const def of Object.values(ACHIEVEMENTS)) {
      const card = el('div', `ach-card${unlocked.includes(def.id) ? ' unlocked' : ''}`);
      card.innerHTML = `<div class="ach-title">${unlocked.includes(def.id) ? '🏆' : '🔒'} ${def.title}</div><div class="ach-desc">${def.description}</div>`;
      grid.appendChild(card);
    }
    host.appendChild(grid);
  }

  // ---------- Hints ----------

  private requestHint(): void {
    if (this.mode !== 'game' || this.modalHost) return;
    const room = this.session.currentRoomDef;
    const target = room.secrets.find((s) => !this.session.secrets.isCompleted(s.id));
    if (!target) {
      this.toast(`Все секреты комнаты «${room.name}» уже раскрыты!`, 'good');
      return;
    }
    const result = this.session.requestHint(`room-${room.id}`, target.hints);
    if (result.ok) {
      this.toast(`💡 Подсказка (этап ${result.stage}/3): ${result.text}`, 'info', 8000);
      audio.play('hint');
    } else {
      this.toast('Подсказки закончились — 3 из 3 использованы. Дальше только свой ум!', 'warn');
    }
    this.updateHud();
  }

  // ---------- Notes ----------

  private showNote(note: NoteDef): void {
    const wrap = el('div');
    const paper = el('div', 'note-paper');
    paper.innerHTML = `<h3>📜 ${note.title}</h3><p>${note.text}</p>`;
    wrap.appendChild(paper);
    const ok = el('button', 'menu-btn', 'Запомнить') as HTMLButtonElement;
    ok.style.marginTop = '14px';
    ok.addEventListener('click', () => this.closeModal());
    wrap.appendChild(ok);
    this.showModal(wrap);
  }

  // ---------- Ending ----------

  private startEnding(ending: EndingType): void {
    this.closeModal();
    this.mode = 'ending';
    this.setGameChrome(false);
    resetTouch();
    void this.session.flush();
    this.game.scene.start('Ending', { session: this.session, ending });
    this.skipBtn = el('button', 'skip-btn', 'Пропустить ▸') as HTMLButtonElement;
    this.skipBtn.addEventListener('click', () => this.session.events.emit('ending-skip'));
    this.root.appendChild(this.skipBtn);
  }

  private showResults(texts: { title: string; text: string }): void {
    this.skipBtn?.remove();
    this.skipBtn = null;
    const state = this.session.state;
    const rating = computeRating({
      elapsedMs: state.elapsedMs,
      secretsFound: state.completedSecrets.length,
      totalSecrets: 120,
      hintsUsed: state.hintsUsed,
      deaths: state.deaths,
    });
    const wrap = el('div', 'results');
    wrap.appendChild(el('h1', undefined, texts.title));
    wrap.appendChild(el('p', 'ending-text', texts.text));

    const badge = el('div', 'rating-badge');
    badge.innerHTML = `<span class="rank">${rating.rank}</span><span><span class="r-title">${rating.title}</span><br><span class="r-score">Рейтинг: ${rating.score}/100</span></span>`;
    wrap.appendChild(badge);

    const diff = getDifficulty(state.difficulty);
    const reqDone = this.session.secrets.requiredCompletedCount(state.difficulty);
    const stats = el('div', 'stats-grid');
    const cells: [string, string][] = [
      [`${state.completedSecrets.length}/120`, 'Секретов найдено'],
      [`${reqDone}/${diff.requiredSecrets}`, 'Обязательных секретов'],
      [`${state.completedRooms.length}/20`, 'Комнат пройдено'],
      [`${state.hintsUsed}/3`, 'Подсказок использовано'],
      [String(state.deaths), 'Смертей'],
      [formatTime(state.elapsedMs), 'Время побега'],
    ];
    for (const [v, k] of cells) {
      const cell = el('div', 'stat-cell');
      cell.innerHTML = `<div class="v">${v}</div><div class="k">${k}</div>`;
      stats.appendChild(cell);
    }
    wrap.appendChild(stats);

    const achTitle = el('h3', undefined, 'Достижения');
    wrap.appendChild(achTitle);
    const achHost = el('div');
    this.renderAchievements(achHost);
    wrap.appendChild(achHost);

    const buttons = el('div', 'results-buttons');
    const again = el('button', 'menu-btn primary', '🔄 Играть заново') as HTMLButtonElement;
    again.addEventListener('click', () => this.startNewGame(state.difficulty));
    const otherDiff = el('button', 'menu-btn', '🎚️ Выбрать другую сложность') as HTMLButtonElement;
    otherDiff.addEventListener('click', () => this.showDifficultySelect());
    const menu = el('button', 'menu-btn', '🏠 Вернуться в главное меню') as HTMLButtonElement;
    menu.addEventListener('click', () => void this.toMainMenu());
    buttons.append(again, otherDiff, menu);
    wrap.appendChild(buttons);

    this.showModal(wrap, { closable: false, pause: false });
  }
}