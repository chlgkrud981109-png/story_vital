import './style.css';
import { signInWithGoogle, logout, subscribeToAuthChanges } from './firebase/auth.js';
import {
  getDefaultProject, saveCharacter, subscribeToCharacters, updateCharacter, deleteCharacter,
  archiveCharacter, saveTimelineEvent, updateTimelineEvent, subscribeToTimelineEvents
} from './firebase/db.js';

// ─────────────────────────────────────────────
//  Module-level state
// ─────────────────────────────────────────────
let currentUser = null;
let currentProjectId = null;
let unsubscribeCharacters = null;
let unsubscribeTimeline = null;
let registeredCharacters = [];
let cachedTimelineEvents = [];  // needed for re-render after filter clear

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=200&auto=format&fit=crop',
];

// ─────────────────────────────────────────────
//  Toast notification (success / error)
// ─────────────────────────────────────────────
const showToast = (message, type = 'success') => {
  // Remove existing toasts to prevent stacking
  document.querySelectorAll('.sv-toast').forEach(t => t.remove());

  const icon = type === 'error' ? 'error' : 'check_circle';
  const borderColor = type === 'error' ? 'rgba(215,51,87,0.4)' : 'rgba(126,81,255,0.3)';
  const iconColor = type === 'error' ? 'text-error' : 'text-primary';

  const toast = document.createElement('div');
  toast.className = 'sv-toast fixed bottom-6 right-6 z-[200] bg-[#1f1f23] text-white px-5 py-3.5 rounded-xl flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 shadow-[0_10px_40px_rgba(0,0,0,0.6)]';
  toast.style.border = `1px solid ${borderColor}`;
  toast.innerHTML = `<span class="material-symbols-outlined ${iconColor}" style="font-size:18px">${icon}</span><span class="text-sm font-semibold">${message}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0'));
  });

  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
};

// ─────────────────────────────────────────────
//  Pomodoro Timer
// ─────────────────────────────────────────────
const initTimer = () => {
  const timerBtn = document.getElementById('pomodoro-timer');
  const timerDisplay = document.getElementById('timer-display');
  const timerLabel = document.getElementById('timer-label');
  const pulseOverlay = document.getElementById('pomodoro-pulse');
  const timerReset = document.getElementById('timer-reset');
  if (!timerBtn) return;

  let timeLeft = 25 * 60;
  let timerId = null;
  let blinkId = null;
  const originalTitle = document.title;

  const pad = n => String(n).padStart(2, '0');
  const updateDisplay = () => {
    timerDisplay.innerText = `${Math.floor(timeLeft / 60)}:${pad(timeLeft % 60)}`;
  };

  const stopBlink = () => {
    if (blinkId) { clearInterval(blinkId); blinkId = null; }
    document.title = originalTitle;
    pulseOverlay?.classList.add('hidden');
  };

  const startBlink = () => {
    pulseOverlay?.classList.remove('hidden');
    blinkId = setInterval(() => {
      document.title = document.title === 'TIME UP! 🖋️' ? originalTitle : 'TIME UP! 🖋️';
    }, 1000);
  };

  timerBtn.addEventListener('click', e => {
    if (e.target.closest('#timer-reset')) return;
    if (timerId) {
      clearInterval(timerId); timerId = null;
      timerLabel.innerText = 'Paused';
      timerBtn.classList.remove('timer-active');
    } else {
      stopBlink();
      if (timeLeft <= 0) timeLeft = 25 * 60;
      timerLabel.innerText = 'Focusing...';
      timerBtn.classList.add('timer-active');
      timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerId); timerId = null;
          timerLabel.innerText = 'Finished';
          timerBtn.classList.remove('timer-active');
          startBlink();
        }
      }, 1000);
    }
  });

  timerReset?.addEventListener('click', e => {
    e.stopPropagation();
    if (timerId) { clearInterval(timerId); timerId = null; }
    stopBlink();
    timeLeft = 25 * 60;
    timerLabel.innerText = 'Reset';
    timerBtn.classList.remove('timer-active');
    updateDisplay();
  });

  timerBtn.addEventListener('dblclick', e => {
    if (timerId || e.target.closest('#timer-reset')) return;
    timeLeft = timeLeft === 25 * 60 ? 50 * 60 : 25 * 60;
    timerLabel.innerText = `${timeLeft / 60}분 모드`;
    updateDisplay();
  });
};

// ─────────────────────────────────────────────
//  Main App Init
// ─────────────────────────────────────────────
const initApp = () => {

  // ── DOM references ──────────────────────────
  const authContainer      = document.getElementById('auth-container');
  const formWrapper        = document.getElementById('form-wrapper');
  const charForm           = document.getElementById('character-form');
  const modeBadge          = document.getElementById('mode-badge');

  const newCharBtn         = document.getElementById('new-char-btn');
  const saveBtn            = document.getElementById('save-char-btn');
  const saveBtnText        = document.getElementById('save-btn-text');
  const saveBtnIcon        = document.getElementById('save-btn-icon');
  const saveBtnSpinner     = document.getElementById('save-btn-spinner');
  const deleteBtn          = document.getElementById('delete-char-btn');
  const archiveBtn         = document.getElementById('archive-char-btn');

  const fullnameInput      = document.getElementById('char-fullname');
  const archetypeInput     = document.getElementById('char-archetype');
  const personalityInput   = document.getElementById('char-personality');
  const traitInput         = document.getElementById('char-trait-input');
  const traitsContainer    = document.getElementById('char-traits-container');
  const relContainer       = document.getElementById('relationships-container');
  const addRelBtn          = document.getElementById('add-relationship-btn');
  const relEmptyHint       = document.getElementById('rel-empty-hint');
  const protoToggle        = document.getElementById('char-is-protagonist');
  const relToProtoContainer= document.getElementById('rel-to-protagonist-container');
  const relToProtoInput    = document.getElementById('char-rel-to-proto');
  const avatarPreview      = document.getElementById('avatar-preview');

  const charListContainer  = document.getElementById('character-list-container');
  const charCountBadge     = document.getElementById('character-count-badge');
  const mapArea            = document.getElementById('relationship-map');
  const mapEmptyHint       = document.getElementById('map-empty-hint');
  const mapFilterLabel     = document.getElementById('map-filter-label');

  const timelineContainer  = document.getElementById('timeline-container');
  const addEventBtn        = document.getElementById('add-timeline-event-btn');
  const filterHint         = document.getElementById('filter-hint');
  const clearFilterBtn     = document.getElementById('clear-filter-btn');
  const timelineFilterBadge= document.getElementById('timeline-filter-badge');

  const eventModal         = document.getElementById('timeline-modal');
  const eventTitleInput    = document.getElementById('event-title');
  const eventSummaryInput  = document.getElementById('event-summary');
  const eventParticipants  = document.getElementById('event-participants-list');
  const saveEventBtn       = document.getElementById('save-event-btn');
  const closeEventBtn      = document.getElementById('close-event-modal');

  // ── Local state ─────────────────────────────
  let traits        = [];
  let relationships = [];
  let isEditing     = false;
  let editingId     = null;
  let editingAvatarUrl = null;
  let currentEventId = null;
  let activeParticipantIds = null;   // null = show all

  let currentAvatarIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);

  // ── Pomodoro ─────────────────────────────────
  initTimer();

  // ─────────────────────────────────────────────
  //  Save Button Micro-interaction
  // ─────────────────────────────────────────────
  const setSaveBtnState = (state) => {
    // state: 'idle' | 'loading' | 'saved' | 'update'
    saveBtn.disabled = (state === 'loading' || state === 'auth');

    saveBtnSpinner.classList.toggle('hidden', state !== 'loading');
    saveBtnIcon.classList.toggle('hidden', state !== 'saved');

    switch (state) {
      case 'idle':
        saveBtnText.innerText = 'Save Character';
        saveBtn.classList.remove('!bg-green-600');
        saveBtn.classList.add('bg-primary-dim');
        break;
      case 'update':
        saveBtnText.innerText = 'Update Character';
        saveBtn.classList.remove('!bg-green-600');
        saveBtn.classList.add('bg-primary-dim');
        break;
      case 'loading':
        saveBtnText.innerText = 'Saving...';
        break;
      case 'saved':
        saveBtnText.innerText = 'Saved!';
        saveBtn.classList.add('!bg-green-600');
        saveBtn.classList.remove('bg-primary-dim');
        break;
      case 'auth':
        saveBtnText.innerText = '인증 확인 중...';
        break;
    }
  };

  // ─────────────────────────────────────────────
  //  Mode Management
  // ─────────────────────────────────────────────
  const setMode = (mode) => {
    if (mode === 'create') {
      modeBadge.innerText = 'Create';
      modeBadge.className = 'text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-primary/15 text-primary border border-primary/20 transition-all';
      setSaveBtnState('idle');
      deleteBtn.classList.add('hidden');
    } else {
      modeBadge.innerText = 'Edit';
      modeBadge.className = 'text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-secondary/15 text-secondary border border-secondary/20 transition-all';
      setSaveBtnState('update');
      deleteBtn.classList.remove('hidden');
    }
  };

  // ─────────────────────────────────────────────
  //  Avatar Shuffle
  // ─────────────────────────────────────────────
  document.querySelector('[aria-label="Change Avatar"]')?.addEventListener('click', () => {
    if (!isEditing) {
      currentAvatarIndex = (currentAvatarIndex + 1) % DEFAULT_AVATARS.length;
      avatarPreview.src = DEFAULT_AVATARS[currentAvatarIndex];
    }
  });

  // ─────────────────────────────────────────────
  //  Protagonist toggle visibility
  // ─────────────────────────────────────────────
  protoToggle?.addEventListener('change', e => {
    relToProtoContainer.classList.toggle('hidden', e.target.checked);
  });

  // ─────────────────────────────────────────────
  //  Traits Tag System
  // ─────────────────────────────────────────────
  const renderTraits = () => {
    traitsContainer.innerHTML = '';
    traits.forEach((t, i) => {
      const span = document.createElement('span');
      span.className = 'bg-primary-dim/20 text-primary-fixed border border-primary/20 px-3 py-1 rounded-full text-xs flex items-center gap-2 group cursor-default hover:bg-primary-dim/30 transition-colors';
      span.innerHTML = `${t} <span class="material-symbols-outlined text-[14px] cursor-pointer hover:text-white" data-index="${i}">close</span>`;
      traitsContainer.appendChild(span);
    });
    traitsContainer.querySelectorAll('.material-symbols-outlined').forEach(icon => {
      icon.addEventListener('click', e => {
        traits.splice(Number(e.target.getAttribute('data-index')), 1);
        renderTraits();
      });
    });
  };

  traitInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = traitInput.value.trim();
      if (val) { traits.push(val); traitInput.value = ''; renderTraits(); }
    }
  });

  // ─────────────────────────────────────────────
  //  Related Characters Rows
  //  Each row: [character select] [relation label input] [delete]
  // ─────────────────────────────────────────────
  const renderRelationships = () => {
    relContainer.innerHTML = '';
    relEmptyHint?.classList.toggle('hidden', relationships.length > 0);

    relationships.forEach((rel, index) => {
      const div = document.createElement('div');
      div.className = 'grid grid-cols-12 gap-2 items-center animate-in fade-in slide-in-from-left-4 duration-300';

      let optionsHtml = `<option value="">인물 선택...</option>`;
      registeredCharacters.forEach(c => {
        if (editingId && c.id === editingId) return;
        optionsHtml += `<option value="${c.id}" ${rel.targetId === c.id ? 'selected' : ''}>${c.fullName}</option>`;
      });

      div.innerHTML = `
        <div class="col-span-5 relative">
          <select class="w-full h-10 recessed-input px-3 text-xs appearance-none border border-surface-bright/20" data-field="targetId" data-index="${index}">
            ${optionsHtml}
          </select>
          <span class="material-symbols-outlined absolute right-2 top-2 text-[14px] text-on-surface-variant pointer-events-none">expand_more</span>
        </div>
        <div class="col-span-6">
          <input type="text" class="w-full h-10 recessed-input px-3 text-xs text-white" 
            placeholder="주인공과의 관계 (예: 라이벌, 스승)" 
            data-field="relationLabel" data-index="${index}"
            value="${rel.relationLabel || ''}">
        </div>
        <div class="col-span-1 flex justify-center">
          <button type="button" class="text-error-dim hover:text-error transition-colors p-1 rel-delete-btn" data-index="${index}">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      `;
      relContainer.appendChild(div);
    });

    relContainer.querySelectorAll('select[data-field="targetId"]').forEach(el => {
      el.addEventListener('change', e => {
        relationships[Number(e.target.dataset.index)].targetId = e.target.value;
      });
    });

    relContainer.querySelectorAll('input[data-field="relationLabel"]').forEach(el => {
      el.addEventListener('input', e => {
        relationships[Number(e.target.dataset.index)].relationLabel = e.target.value;
      });
    });

    relContainer.querySelectorAll('.rel-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        relationships.splice(Number(e.currentTarget.dataset.index), 1);
        renderRelationships();
      });
    });
  };

  addRelBtn?.addEventListener('click', () => {
    relationships.push({ targetId: '', relationLabel: '' });
    renderRelationships();
  });

  // ─────────────────────────────────────────────
  //  Populate Edit Form
  // ─────────────────────────────────────────────
  const populateEditForm = (char) => {
    isEditing = true;
    editingId = char.id;
    editingAvatarUrl = char.avatarUrl;

    fullnameInput.value = char.fullName || '';
    archetypeInput.value = char.archetype || '';
    personalityInput.value = char.personality || '';
    relToProtoInput.value = char.relToProtagonist || '';

    protoToggle.checked = !!char.isProtagonist;
    relToProtoContainer.classList.toggle('hidden', protoToggle.checked);

    traits = [...(char.traits || [])];
    relationships = [...(char.relationships || [])];

    if (char.avatarUrl) avatarPreview.src = char.avatarUrl;

    renderTraits();
    renderRelationships();
    setMode('edit');

    charForm.closest('section').scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─────────────────────────────────────────────
  //  Reset Form → Create Mode
  // ─────────────────────────────────────────────
  const resetForm = () => {
    charForm.reset();
    traits = [];
    relationships = [];
    isEditing = false;
    editingId = null;
    editingAvatarUrl = null;

    // Random new avatar for next create
    currentAvatarIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
    avatarPreview.src = DEFAULT_AVATARS[currentAvatarIndex];

    relToProtoContainer.classList.remove('hidden');
    renderTraits();
    renderRelationships();
    setMode('create');
  };

  // ─────────────────────────────────────────────
  //  [+ New Character] Button
  // ─────────────────────────────────────────────
  newCharBtn?.addEventListener('click', resetForm);

  // ─────────────────────────────────────────────
  //  Archive & Delete
  // ─────────────────────────────────────────────
  archiveBtn?.addEventListener('click', async () => {
    if (!editingId) return;
    try {
      await archiveCharacter(editingId);
      showToast('아카이브로 이동했습니다.');
      resetForm();
    } catch (err) {
      console.error(err);
      showToast('아카이브 처리 중 오류가 발생했습니다.', 'error');
    }
  });

  deleteBtn?.addEventListener('click', async () => {
    if (!editingId) return;
    const name = fullnameInput.value || '이 캐릭터';
    if (confirm(`"${name}"을(를) 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await deleteCharacter(editingId);
        showToast('캐릭터가 삭제되었습니다.');
        resetForm();
      } catch (err) {
        console.error(err);
        showToast('삭제 중 오류가 발생했습니다.', 'error');
      }
    }
  });

  // ─────────────────────────────────────────────
  //  Form Submit — Save / Update
  // ─────────────────────────────────────────────
  charForm?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentUser || !currentProjectId) {
      showToast('세션이 아직 초기화 중입니다. 잠시 후 다시 시도하세요.', 'error');
      return;
    }

    const fullName = fullnameInput.value.trim();
    if (!fullName) {
      showToast('이름을 입력해주세요.', 'error');
      fullnameInput.focus();
      return;
    }

    const charData = {
      fullName,
      archetype: archetypeInput.value.trim() || '미정',
      personality: personalityInput.value.trim(),
      isProtagonist: !!protoToggle.checked,
      relToProtagonist: protoToggle.checked ? '' : (relToProtoInput.value.trim()),
      traits: [...traits],
      relationships: relationships.filter(r => r.targetId),
      avatarUrl: isEditing
        ? (editingAvatarUrl || DEFAULT_AVATARS[0])
        : DEFAULT_AVATARS[currentAvatarIndex],
    };

    setSaveBtnState('loading');

    try {
      if (isEditing) {
        await updateCharacter(editingId, charData);
      } else {
        await saveCharacter(charData, currentUser.uid, currentProjectId);
      }

      // ✅ Micro-interaction: green Saved! for 1.5s
      setSaveBtnState('saved');
      setTimeout(() => {
        resetForm();
        // Restore idle after reset
        if (currentProjectId) setSaveBtnState('idle');
      }, 1500);

      showToast('캐릭터가 저장되었습니다.');
      // Note: the character list auto-updates via Firestore onSnapshot — no page reload needed

    } catch (err) {
      console.error('Save error:', err);
      showToast(`저장 실패: ${err?.message || '서버 오류'}`, 'error');
      setSaveBtnState(isEditing ? 'update' : 'idle');
    }
  });

  // ─────────────────────────────────────────────
  //  Character List Renderer (DOM update, no reload)
  // ─────────────────────────────────────────────
  const renderCharacterList = (chars) => {
    charCountBadge.innerText = chars.length;
    charListContainer.innerHTML = '';

    if (!chars.length) {
      charListContainer.innerHTML = '<p class="text-xs text-on-surface-variant/40 italic py-4 text-center">원고가 아직 비어있습니다...</p>';
      return;
    }

    chars.forEach(c => {
      const card = document.createElement('div');
      const isActive = isEditing && c.id === editingId;
      card.className = [
        'p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3',
        isActive
          ? 'bg-primary/10 border border-primary/30'
          : 'bg-surface-container-low hover:bg-surface-container-highest border border-transparent',
        c.isProtagonist ? 'border-l-4 !border-l-primary' : '',
      ].join(' ');

      card.innerHTML = `
        <div class="w-9 h-9 rounded-full border ${c.isProtagonist ? 'border-primary' : 'border-surface-bright'} overflow-hidden flex-shrink-0 relative">
          <img src="${c.avatarUrl}" class="w-full h-full object-cover" alt="${c.fullName}">
          ${c.isProtagonist ? '<span class="absolute -top-0.5 -right-0.5 material-symbols-outlined text-primary text-[10px] bg-black rounded-full p-0.5" style="font-variation-settings:\'FILL\' 1;font-size:10px">stars</span>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-bold text-white truncate">${c.fullName}</h4>
          <p class="text-[9px] uppercase tracking-widest text-on-surface-variant truncate">${c.archetype || '—'}</p>
        </div>
        ${isActive ? '<span class="material-symbols-outlined text-primary text-sm flex-shrink-0">edit</span>' : ''}
      `;

      card.addEventListener('click', () => populateEditForm(c));
      charListContainer.appendChild(card);
    });
  };

  // ─────────────────────────────────────────────
  //  Relationship Map Visualization
  // ─────────────────────────────────────────────
  const updateMapVisualization = (characters) => {
    // Remove previous nodes & SVG, keep dot grid background
    mapArea.querySelectorAll('.map-node, svg, .map-empty').forEach(el => el.remove());

    const filtered = activeParticipantIds && activeParticipantIds.length > 0
      ? characters.filter(c => activeParticipantIds.includes(c.id))
      : characters;

    // Show/hide map filter label & filterHint
    const isFiltered = !!(activeParticipantIds && activeParticipantIds.length > 0);
    mapFilterLabel?.classList.toggle('hidden', !isFiltered);
    filterHint?.classList.toggle('hidden', !isFiltered);
    timelineFilterBadge?.classList.toggle('hidden', !isFiltered);

    if (filtered.length === 0) {
      const p = document.createElement('p');
      p.className = 'map-empty absolute inset-0 flex items-center justify-center text-[10px] text-on-surface-variant/40 italic text-center p-8';
      p.innerText = isFiltered
        ? '이 사건에 배정된 참여자가 없습니다.'
        : '등록된 캐릭터가 없습니다';
      mapArea.appendChild(p);
      mapEmptyHint?.classList.add('hidden');
      return;
    }
    mapEmptyHint?.classList.add('hidden');

    const W = mapArea.offsetWidth || 300;
    const H = mapArea.offsetHeight || 200;
    const cx = W / 2;
    const cy = H / 2;

    // SVG for connection lines
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'absolute inset-0 w-full h-full pointer-events-none');
    mapArea.appendChild(svg);

    const protagonists = filtered.filter(c => c.isProtagonist);
    const supporting = filtered.filter(c => !c.isProtagonist);
    const nodes = [];

    // Place protagonist(s) at center — larger (56px)
    protagonists.forEach((c, i) => {
      const angle = protagonists.length > 1 ? (i / protagonists.length) * Math.PI * 2 : 0;
      const spread = protagonists.length > 1 ? 24 : 0;
      const x = cx + Math.cos(angle) * spread;
      const y = cy + Math.sin(angle) * spread;
      nodes.push({ id: c.id, x, y });

      const div = document.createElement('div');
      div.className = 'map-node absolute w-16 h-16 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110 cursor-pointer map-node-protagonist';
      div.style.left = `${x - 32}px`;
      div.style.top  = `${y - 32}px`;
      div.innerHTML = `
        <img src="${c.avatarUrl}" class="w-full h-full object-cover rounded-full" alt="${c.fullName}">
        <span class="absolute -top-1 -right-1 material-symbols-outlined text-primary text-[12px] bg-black rounded-full p-0.5" style="font-variation-settings:'FILL' 1">stars</span>
        <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-primary font-bold">${c.fullName}</div>
      `;
      div.addEventListener('click', () => populateEditForm(c));
      mapArea.appendChild(div);
    });

    // If no protagonist, use center for layout reference
    const layoutCenter = protagonists.length > 0
      ? { x: cx, y: cy }
      : { x: cx, y: cy };

    // Place supporting characters in a circle
    const radius = Math.min(W, H) * 0.34 + supporting.length * 3;
    supporting.forEach((c, i) => {
      const angle = (i / Math.max(supporting.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const x = layoutCenter.x + Math.cos(angle) * radius;
      const y = layoutCenter.y + Math.sin(angle) * radius;
      nodes.push({ id: c.id, x, y });

      const div = document.createElement('div');
      div.className = 'map-node absolute w-10 h-10 bg-surface-bright border border-primary/20 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110 cursor-pointer';
      div.style.left = `${x - 20}px`;
      div.style.top  = `${y - 20}px`;
      div.title = c.fullName;
      div.innerHTML = `
        <img src="${c.avatarUrl}" class="w-full h-full object-cover rounded-full" alt="${c.fullName}">
        <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-on-surface-variant">${c.fullName}</div>
      `;
      div.addEventListener('click', () => populateEditForm(c));
      mapArea.appendChild(div);
    });

    // Draw connections
    filtered.forEach(source => {
      (source.relationships || []).forEach(rel => {
        const sNode = nodes.find(n => n.id === source.id);
        const tNode = nodes.find(n => n.id === rel.targetId);
        if (!sNode || !tNode) return;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sNode.x); line.setAttribute('y1', sNode.y);
        line.setAttribute('x2', tNode.x); line.setAttribute('y2', tNode.y);

        const isProtagonistEdge = source.isProtagonist
          || filtered.find(c => c.id === rel.targetId)?.isProtagonist;
        line.setAttribute('stroke', isProtagonistEdge ? '#9c7eff' : '#7e51ff44');
        line.setAttribute('stroke-width', isProtagonistEdge ? '1.5' : '0.75');
        line.setAttribute('stroke-dasharray', '4 4');
        svg.appendChild(line);

        // Relation label on edge midpoint
        if (rel.relationLabel) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', (sNode.x + tNode.x) / 2);
          text.setAttribute('y', (sNode.y + tNode.y) / 2);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-size', '8');
          text.setAttribute('fill', '#acaaae');
          text.setAttribute('dy', '-3');
          text.textContent = rel.relationLabel;
          svg.appendChild(text);
        }
      });
    });
  };

  // ─────────────────────────────────────────────
  //  Timeline Renderer + Event ↔ Map Sync
  // ─────────────────────────────────────────────
  const renderTimeline = (events) => {
    if (!timelineContainer) return;
    cachedTimelineEvents = events;

    // Keep the dashed vertical line
    timelineContainer.innerHTML = '<div class="absolute left-[7px] top-0 bottom-0 w-0.5 timeline-line opacity-20"></div>';

    if (!events.length) {
      const p = document.createElement('p');
      p.className = 'text-[10px] text-on-surface-variant/40 italic text-center pt-8 pl-4';
      p.innerText = '아직 장면이 없습니다. 아래 버튼으로 추가하세요.';
      timelineContainer.appendChild(p);
      return;
    }

    events.forEach(ev => {
      const isActive = activeParticipantIds !== null
        && (ev.participantIds || []).some(id => activeParticipantIds.includes(id));

      const div = document.createElement('div');
      div.className = [
        'relative pl-8 group cursor-pointer p-2 pr-3 rounded-xl transition-all',
        'hover:bg-surface-container-high/40',
        isActive ? 'bg-secondary/5 border border-secondary/20' : '',
      ].join(' ');

      const avatarHtml = (ev.participantIds?.length > 0)
        ? `<div class="mt-2 flex -space-x-2">
            ${ev.participantIds.map(id => {
              const c = registeredCharacters.find(ch => ch.id === id);
              return c ? `<div class="w-5 h-5 rounded-full border border-surface bg-surface-container overflow-hidden" title="${c.fullName}"><img src="${c.avatarUrl}" class="w-full h-full object-cover"></div>` : '';
            }).join('')}
           </div>` : '';

      div.innerHTML = `
        <div class="absolute left-0 top-3.5 w-4 h-4 rounded-full ${isActive ? 'bg-secondary' : 'bg-surface border-2 border-primary-dim'} z-10 group-hover:scale-125 transition-transform"></div>
        <div class="flex items-start justify-between gap-1">
          <h4 class="text-sm font-semibold text-white mb-1 group-hover:text-primary transition-colors flex-1">${ev.title}</h4>
          <button class="edit-event-btn p-0.5 hover:bg-surface-bright rounded transition-colors flex-shrink-0" title="Edit">
            <span class="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-white">edit</span>
          </button>
        </div>
        <p class="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">${ev.summary || ''}</p>
        ${avatarHtml}
      `;

      // Edit button
      div.querySelector('.edit-event-btn').addEventListener('click', e => {
        e.stopPropagation();
        openEventModal(ev);
      });

      // Click event → filter map by participants
      div.addEventListener('click', e => {
        if (e.target.closest('.edit-event-btn')) return;

        if (activeParticipantIds !== null
          && JSON.stringify(activeParticipantIds) === JSON.stringify(ev.participantIds || [])) {
          // Same event clicked again → clear filter
          clearFilter();
        } else {
          activeParticipantIds = ev.participantIds || [];
          updateMapVisualization(registeredCharacters);
          renderTimeline(cachedTimelineEvents);
        }
      });

      timelineContainer.appendChild(div);
    });
  };

  const clearFilter = () => {
    activeParticipantIds = null;
    updateMapVisualization(registeredCharacters);
    renderTimeline(cachedTimelineEvents);
  };

  clearFilterBtn?.addEventListener('click', clearFilter);

  // ─────────────────────────────────────────────
  //  Timeline Event Modal
  // ─────────────────────────────────────────────
  const openEventModal = (ev = null) => {
    document.getElementById('modal-title').innerText = ev ? 'Edit Scene' : 'New Scene';

    // Populate participants checkboxes
    eventParticipants.innerHTML = '';
    if (!registeredCharacters.length) {
      eventParticipants.innerHTML = '<p class="text-[10px] italic text-on-surface-variant/40">등록된 캐릭터가 없습니다</p>';
    } else {
      registeredCharacters.forEach(c => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 p-1.5 bg-surface-container rounded-lg border border-surface-bright/20 cursor-pointer hover:bg-surface-bright transition-all';
        div.innerHTML = `
          <input type="checkbox" id="part-${c.id}" value="${c.id}"
            ${ev?.participantIds?.includes(c.id) ? 'checked' : ''}
            class="w-3 h-3 accent-primary cursor-pointer">
          <label for="part-${c.id}" class="text-[10px] text-white cursor-pointer select-none">${c.fullName}</label>
        `;
        div.addEventListener('click', e => {
          if (e.target.tagName !== 'INPUT') {
            div.querySelector('input').click();
          }
        });
        eventParticipants.appendChild(div);
      });
    }

    currentEventId = ev?.id || null;
    eventTitleInput.value = ev?.title || '';
    eventSummaryInput.value = ev?.summary || '';
    eventModal.classList.remove('hidden');
  };

  addEventBtn?.addEventListener('click', () => openEventModal());
  closeEventBtn?.addEventListener('click', () => eventModal.classList.add('hidden'));

  // Close modal on backdrop click
  eventModal?.addEventListener('click', e => {
    if (e.target === eventModal) eventModal.classList.add('hidden');
  });

  saveEventBtn?.addEventListener('click', async () => {
    if (!currentProjectId) { showToast('세션 초기화 중입니다.', 'error'); return; }

    const title = eventTitleInput.value.trim();
    if (!title) { showToast('장면 제목을 입력해주세요.', 'error'); return; }

    const summary = eventSummaryInput.value.trim();
    const participantIds = Array.from(eventParticipants.querySelectorAll('input:checked')).map(el => el.value);

    const eventData = {
      projectId: currentProjectId,
      title, summary,
      participantIds,
      order: Date.now(),
    };

    saveEventBtn.disabled = true;
    saveEventBtn.innerText = 'Saving...';

    try {
      if (currentEventId) await updateTimelineEvent(currentEventId, eventData);
      else await saveTimelineEvent(eventData);

      eventModal.classList.add('hidden');
      showToast('타임라인이 저장되었습니다.');
    } catch (err) {
      console.error(err);
      showToast(`타임라인 저장 실패: ${err?.message || '서버 오류'}`, 'error');
    } finally {
      saveEventBtn.disabled = false;
      saveEventBtn.innerText = 'Save Event';
    }
  });

  // ─────────────────────────────────────────────
  //  Auth State → Fade-in form, enable buttons
  // ─────────────────────────────────────────────
  // Lock form initially
  formWrapper?.classList.add('opacity-0', 'pointer-events-none');
  setSaveBtnState('auth');

  subscribeToAuthChanges(async (user) => {
    currentUser = user;

    if (user) {
      // Update auth UI
      authContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="${user.photoURL}" class="w-8 h-8 rounded-full border border-primary/20" alt="avatar">
          <div class="hidden md:block">
            <p class="text-xs font-semibold text-white">${user.displayName}</p>
          </div>
          <button id="logout-btn" class="text-xs text-on-surface-variant hover:text-white transition-colors ml-1">Logout</button>
        </div>
      `;
      document.getElementById('logout-btn').addEventListener('click', logout);

      try {
        const project = await getDefaultProject(user.uid);
        if (!project?.id) throw new Error('Project ID missing');
        currentProjectId = project.id;

        // Activate form with fade-in
        formWrapper.classList.remove('opacity-0', 'pointer-events-none');
        formWrapper.classList.add('transition-opacity', 'duration-500');

        setSaveBtnState('idle');
        if (addEventBtn) addEventBtn.disabled = false;

        // Subscribe: Characters (real-time DOM update — no page reload)
        if (unsubscribeCharacters) unsubscribeCharacters();
        unsubscribeCharacters = subscribeToCharacters(user.uid, (chars) => {
          registeredCharacters = chars;
          renderCharacterList(chars);
          updateMapVisualization(chars);
          renderRelationships(); // refresh selects with updated char list
        });

        // Subscribe: Timeline
        if (unsubscribeTimeline) unsubscribeTimeline();
        unsubscribeTimeline = subscribeToTimelineEvents(currentProjectId, renderTimeline);

      } catch (err) {
        console.error('[Main] Project init failed:', err);
        showToast('세션 초기화 실패. 페이지를 새로고침 해주세요.', 'error');
        saveBtn.disabled = true;
        saveBtnText.innerText = '초기화 실패';
      }

    } else {
      // Logged out
      currentProjectId = null;
      if (unsubscribeCharacters) { unsubscribeCharacters(); unsubscribeCharacters = null; }
      if (unsubscribeTimeline)   { unsubscribeTimeline();   unsubscribeTimeline = null;   }

      formWrapper?.classList.add('opacity-0', 'pointer-events-none');

      authContainer.innerHTML = `
        <button id="login-btn" class="bg-primary-dim text-white font-bold py-1.5 px-4 rounded-lg text-sm hover:bg-primary transition-colors cursor-pointer active:scale-95">
          구글로 시작하기
        </button>
      `;
      document.getElementById('login-btn').addEventListener('click', signInWithGoogle);
    }
  });
};

document.addEventListener('DOMContentLoaded', initApp);
