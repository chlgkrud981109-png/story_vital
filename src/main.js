import './style.css';
import { signInWithGoogle, logout, subscribeToAuthChanges } from './firebase/auth.js';
import { 
  getDefaultProject, saveCharacter, subscribeToCharacters, updateCharacter, deleteCharacter, 
  archiveCharacter, saveTimelineEvent, updateTimelineEvent, subscribeToTimelineEvents 
} from './firebase/db.js';

let currentUser = null;
let currentProjectId = null;
let unsubscribeCharacters = null;
let unsubscribeTimeline = null;
let registeredCharacters = [];

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=200&auto=format&fit=crop'
];

const showToast = (message) => {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 z-50 bg-[#1f1f23] border border-primary-dim/30 text-white px-6 py-4 rounded-xl flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 shadow-[0_10px_40px_rgba(0,0,0,0.5)]';
  toast.innerHTML = `<span class="material-symbols-outlined text-primary">check_circle</span> <span class="text-sm font-semibold">${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const initTimer = () => {
  const timerBtn = document.getElementById('pomodoro-timer');
  const timerDisplay = document.getElementById('timer-display');
  const timerLabel = document.getElementById('timer-label');
  const pulseOverlay = document.getElementById('pomodoro-pulse');
  const timerReset = document.getElementById('timer-reset');
  
  if (!timerBtn) return;

  let timeLeft = 25 * 60;
  let timerId = null;
  let originalTitle = document.title;
  let blinkId = null;

  const updateDisplay = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopBlink = () => {
    if (blinkId) { clearInterval(blinkId); blinkId = null; }
    document.title = originalTitle;
    pulseOverlay.classList.add('hidden');
  };

  const startBlink = () => {
    pulseOverlay.classList.remove('hidden');
    blinkId = setInterval(() => {
      document.title = document.title === "TIME UP! 🖋️" ? originalTitle : "TIME UP! 🖋️";
    }, 1000);
  };

  timerBtn.addEventListener('click', (e) => {
    if (e.target.closest('#timer-reset')) return;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      timerLabel.innerText = "Paused";
      timerBtn.classList.remove('timer-active');
    } else {
      stopBlink();
      if (timeLeft <= 0) timeLeft = 25 * 60;
      timerLabel.innerText = "Focusing...";
      timerBtn.classList.add('timer-active');
      timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerId);
          timerId = null;
          timerLabel.innerText = "Finished";
          timerBtn.classList.remove('timer-active');
          startBlink();
        }
      }, 1000);
    }
  });

  timerReset?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (timerId) { clearInterval(timerId); timerId = null; }
    stopBlink();
    timeLeft = 25 * 60;
    timerLabel.innerText = "Reset";
    timerBtn.classList.remove('timer-active');
    updateDisplay();
  });

  // Double click to switch 25/50
  timerBtn.addEventListener('dblclick', (e) => {
    if (timerId || e.target.closest('#timer-reset')) return;
    timeLeft = timeLeft === 25 * 60 ? 50 * 60 : 25 * 60;
    timerLabel.innerText = `Switched to ${timeLeft/60}m`;
    updateDisplay();
  });
};

const initApp = () => {
  const authContainer = document.getElementById('auth-container');
  const charForm = document.getElementById('character-form');
  const traitInput = document.getElementById('char-trait-input');
  const traitsContainer = document.getElementById('char-traits-container');
  const relContainer = document.getElementById('relationships-container');
  const addRelBtn = document.getElementById('add-relationship-btn');
  const saveBtn = document.getElementById('save-char-btn');
  const deleteBtn = document.getElementById('delete-char-btn');
  const archiveBtn = document.getElementById('archive-char-btn');
  const protoToggle = document.getElementById('char-is-protagonist');
  const relToProtoContainer = document.getElementById('rel-to-protagonist-container');
  
  const timelineContainer = document.getElementById('timeline-container');
  const addEventBtn = document.getElementById('add-timeline-event-btn');
  const eventModal = document.getElementById('timeline-modal');
  const eventTitleInput = document.getElementById('event-title');
  const eventSummaryInput = document.getElementById('event-summary');
  const saveEventBtn = document.getElementById('save-event-btn');
  const closeEventBtn = document.getElementById('close-event-modal');

  const eventParticipantsList = document.getElementById('event-participants-list');
  
  let traits = [];
  let relationships = [];
  let isEditing = false;
  let editingId = null;
  let currentEventId = null;
  let activeParticipantIds = null; // New: For map filtering

  initTimer();

  // 2. Timeline Interaction
  const openEventModal = (event = null) => {
    // Populate participants list
    eventParticipantsList.innerHTML = '';
    registeredCharacters.forEach(c => {
      const div = document.createElement('div');
      div.className = 'flex items-center gap-2 p-1.5 bg-surface-container rounded-lg border border-surface-bright/20 cursor-pointer hover:bg-surface-bright transition-all';
      div.innerHTML = `
        <input type="checkbox" id="part-${c.id}" value="${c.id}" ${event?.participantIds?.includes(c.id) ? 'checked' : ''} class="w-3 h-3 accent-primary">
        <label for="part-${c.id}" class="text-[10px] text-white cursor-pointer select-none">${c.fullName}</label>
      `;
      div.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const cb = div.querySelector('input');
          cb.checked = !cb.checked;
        }
      });
      eventParticipantsList.appendChild(div);
    });

    if (event) {
      currentEventId = event.id;
      eventTitleInput.value = event.title;
      eventSummaryInput.value = event.summary;
    } else {
      currentEventId = null;
      eventTitleInput.value = '';
      eventSummaryInput.value = '';
    }
    eventModal.classList.remove('hidden');
  };

  addEventBtn?.addEventListener('click', () => openEventModal());
  closeEventBtn?.addEventListener('click', () => eventModal.classList.add('hidden'));

  saveEventBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("[Main] Save Event clicked. currentProjectId:", currentProjectId);
    if (!currentProjectId) {
      showToast("Initializing project... Please wait.");
      return;
    }
    
    const title = eventTitleInput.value.trim();
    const summary = eventSummaryInput.value.trim();
    if (!title) {
        showToast("Please enter a scene title.");
        return;
    }

    const participantIds = Array.from(eventParticipantsList.querySelectorAll('input:checked')).map(el => el.value);

    const eventData = {
      projectId: currentProjectId,
      title,
      summary,
      participantIds: participantIds || [],
      order: Date.now()
    };

    try {
      if (currentEventId) await updateTimelineEvent(currentEventId, eventData);
      else await saveTimelineEvent(eventData);
      eventModal.classList.add('hidden');
      showToast("Timeline entry synchronized.");
    } catch (err) { 
      console.error("Timeline sync error:", err);
      showToast("Timeline sync failed."); 
    }
  });

  const renderTimeline = (events) => {
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '<div class="absolute left-[7px] top-0 bottom-0 w-0.5 timeline-line opacity-20"></div>';
    
    if (activeParticipantIds) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'w-full mb-4 py-2 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20 hover:bg-primary/20 transition-all';
      resetBtn.innerText = "Clear Map Filter";
      resetBtn.onclick = () => {
        activeParticipantIds = null;
        renderTimeline(events);
        updateMapVisualization(registeredCharacters);
      };
      timelineContainer.appendChild(resetBtn);
    }

    events.forEach(e => {
      const div = document.createElement('div');
      div.className = `relative pl-8 group cursor-pointer hover:bg-surface-container-high/20 p-2 rounded-lg transition-all animate-in fade-in slide-in-from-left-4 duration-300 ${activeParticipantIds && (e.participantIds || []).length > 0 && e.participantIds.some(id => activeParticipantIds.includes(id)) ? 'bg-primary/5 border-l-2 border-primary/20' : ''}`;
      
      const avatarHtml = e.participantIds?.length > 0 ? `<div class="mt-2 flex -space-x-2">${e.participantIds.map(id => {
          const c = registeredCharacters.find(char => char.id === id);
          return c ? `<div class="w-5 h-5 rounded-full border border-surface bg-surface-container overflow-hidden"><img src="${c.avatarUrl}" class="w-full h-full object-cover"></div>` : '';
        }).join('')}</div>` : '';

      div.innerHTML = `
        <div class="absolute left-0 top-3.5 w-4 h-4 rounded-full bg-surface border-2 border-primary-dim z-10 group-hover:scale-125 transition-transform"></div>
        <div class="flex items-start justify-between">
          <h4 class="text-sm font-semibold text-white mb-1 group-hover:text-primary transition-colors">${e.title}</h4>
          <span class="material-symbols-outlined text-xs text-on-surface-variant hover:text-white edit-event-btn">edit</span>
        </div>
        <p class="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3">${e.summary}</p>
        ${avatarHtml}
      `;

      // Event Listeners for individual scene cards
      div.querySelector('.edit-event-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEventModal(e);
      });

      div.addEventListener('click', (ev) => {
        if (ev.target.classList.contains('edit-event-btn')) return;
        activeParticipantIds = e.participantIds || [];
        updateMapVisualization(registeredCharacters);
        renderTimeline(events);
      });

      timelineContainer.appendChild(div);
    });
  };

  // 3. Protagonist & Image Logic
  protoToggle?.addEventListener('change', (e) => {
    relToProtoContainer.classList.toggle('hidden', e.target.checked);
  });

  const renderTraits = () => {
    traitsContainer.innerHTML = '';
    traits.forEach((t, i) => {
      const span = document.createElement('span');
      span.className = 'bg-primary-dim/20 text-primary-fixed border border-primary/20 px-3 py-1 rounded-full text-xs flex items-center gap-2 group cursor-default transition-colors hover:bg-primary-dim/30';
      span.innerHTML = `${t} <span class="material-symbols-outlined text-[14px] cursor-pointer hover:text-white" data-index="${i}">close</span>`;
      traitsContainer.appendChild(span);
    });
    traitsContainer.querySelectorAll('.material-symbols-outlined').forEach(icon => {
      icon.addEventListener('click', (e) => {
        traits.splice(e.target.getAttribute('data-index'), 1);
        renderTraits();
      });
    });
  };

  traitInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = traitInput.value.trim();
      if (val) { traits.push(val); traitInput.value = ''; renderTraits(); }
    }
  });

  const renderRelationships = () => {
    relContainer.innerHTML = '';
    relationships.forEach((rel, index) => {
      const div = document.createElement('div');
      div.className = 'grid grid-cols-12 gap-3 items-center animate-in fade-in slide-in-from-left-4 duration-300';
      let optionsHtml = `<option value="">Target...</option>`;
      registeredCharacters.forEach(c => {
        if (editingId && c.id === editingId) return;
        optionsHtml += `<option value="${c.id}" ${rel.targetId === c.id ? 'selected' : ''}>${c.fullName}</option>`;
      });
      div.innerHTML = `
        <div class="col-span-11 relative">
          <select aria-label="Select Relationship Target" class="w-full h-10 recessed-input px-3 text-xs appearance-none border border-surface-bright/20" data-field="targetId" data-index="${index}">${optionsHtml}</select>
          <span class="material-symbols-outlined absolute right-2 top-2 text-[14px] text-on-surface-variant pointer-events-none">expand_more</span>
        </div>
        <div class="col-span-1 flex justify-center">
          <button type="button" class="text-error-dim hover:text-error transition-colors p-1" data-index="${index}"><span class="material-symbols-outlined text-[18px]">delete</span></button>
        </div>
      `;
      relContainer.appendChild(div);
    });
    relContainer.querySelectorAll('select').forEach(el => {
      el.addEventListener('change', (e) => {
        relationships[e.target.getAttribute('data-index')].targetId = e.target.value;
      });
    });
    relContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        relationships.splice(e.currentTarget.getAttribute('data-index'), 1);
        renderRelationships();
      });
    });
  };

  addRelBtn?.addEventListener('click', () => {
    relationships.push({ targetId: '' });
    renderRelationships();
  });

  const populateEditForm = (char) => {
    isEditing = true;
    editingId = char.id;
    deleteBtn.classList.remove('hidden');
    document.getElementById('char-fullname').value = char.fullName || '';
    document.getElementById('char-archetype').value = char.archetype || 'Protagonist';
    document.getElementById('char-personality').value = char.personality || '';
    document.getElementById('char-rel-to-proto').value = char.relToProtagonist || '';
    const protoCheck = document.getElementById('char-is-protagonist');
    protoCheck.checked = char.isProtagonist || false;
    relToProtoContainer.classList.toggle('hidden', protoCheck.checked);
    traits = char.traits || char.specialAbilities || [];
    renderTraits();
    relationships = char.relationships || [];
    renderRelationships();
    saveBtn.innerText = "Update Character";
    saveBtn.classList.replace('bg-primary-dim', 'bg-surface-variant');
    saveBtn.style.backgroundColor = '#1f1f23'; // secondary-container logic
    charForm.scrollIntoView({ behavior: 'smooth' });
  };

  const resetForm = () => {
    charForm.reset();
    traits = [];
    relationships = [];
    isEditing = false;
    editingId = null;
    deleteBtn.classList.add('hidden');
    saveBtn.innerText = "Save Character";
    saveBtn.style.backgroundColor = '';
    saveBtn.classList.replace('bg-surface-variant', 'bg-primary-dim');
    relToProtoContainer.classList.remove('hidden');
    renderTraits();
    renderRelationships();
  };

  archiveBtn?.addEventListener('click', async () => {
    if (!editingId) return;
    await archiveCharacter(editingId);
    showToast("Moved to Archive.");
    resetForm();
  });

  deleteBtn?.addEventListener('click', async () => {
    if (!editingId) return;
    if (confirm(`Permanently delete ${document.getElementById('char-fullname').value}?`)) {
      await deleteCharacter(editingId);
      showToast("Deleted.");
      resetForm();
    }
  });

  // 4. Center-Hub Relationship Map
  const updateMapVisualization = (characters) => {
    const mapArea = document.querySelector('.flex-1.bg-surface-container-low.rounded-2xl.relative');
    if (!mapArea) return;
    mapArea.querySelectorAll('.map-node, svg').forEach(el => el.remove());

    // Fiter if activeParticipantIds is set
    const filteredCharacters = activeParticipantIds && activeParticipantIds.length > 0 
      ? characters.filter(c => activeParticipantIds.includes(c.id))
      : characters;

    if (filteredCharacters.length === 0) {
      const p = document.createElement('p');
      p.className = 'absolute inset-0 flex items-center justify-center text-[10px] text-on-surface-variant/40 italic text-center p-8';
      p.innerText = 'No participants assigned to this event or manuscript is empty.';
      mapArea.appendChild(p);
      return;
    }

    const center = { x: mapArea.offsetWidth / 2, y: mapArea.offsetHeight / 2 };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "absolute inset-0 w-full h-full pointer-events-none");
    mapArea.appendChild(svg);
    
    const protagonists = filteredCharacters.filter(c => c.isProtagonist);
    const supporting = filteredCharacters.filter(c => !c.isProtagonist);
    const nodes = [];

    protagonists.forEach((c, i) => {
      const offsetX = protagonists.length > 1 ? (Math.cos((i / protagonists.length) * Math.PI * 2) * 20) : 0;
      const offsetY = protagonists.length > 1 ? (Math.sin((i / protagonists.length) * Math.PI * 2) * 20) : 0;
      const x = center.x + offsetX;
      const y = center.y + offsetY;
      nodes.push({ id: c.id, x, y, isProto: true });
      const div = document.createElement('div');
      div.className = `map-node absolute w-14 h-14 bg-primary-dim rounded-full flex items-center justify-center ambient-shadow map-node-protagonist z-50 transition-all hover:scale-110`;
      div.style.left = `${x - 28}px`; div.style.top = `${y - 28}px`;
      div.innerHTML = `<img src="${c.avatarUrl}" class="w-full h-full object-cover rounded-full"><span class="absolute -top-1 -right-1 material-symbols-outlined text-primary text-xs bg-black rounded-full p-0.5">stars</span>`;
      mapArea.appendChild(div);
    });

    supporting.forEach((c, i) => {
      const angle = (i / supporting.length) * Math.PI * 2;
      const radius = 120 + (supporting.length * 2);
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      nodes.push({ id: c.id, x, y, isProto: false });
      const div = document.createElement('div');
      div.className = `map-node absolute w-9 h-9 bg-surface-bright border border-primary/20 rounded-full flex items-center justify-center ambient-shadow z-10 transition-all hover:scale-110`;
      div.style.left = `${x - 18}px`; div.style.top = `${y - 18}px`;
      div.innerHTML = `<img src="${c.avatarUrl}" class="w-full h-full object-cover rounded-full flex-shrink-0">`;
      mapArea.appendChild(div);
    });

    filteredCharacters.forEach(source => {
      if (source.relationships) {
        source.relationships.forEach(rel => {
          const sNode = nodes.find(n => n.id === source.id);
          const tNode = nodes.find(n => n.id === rel.targetId);
          if (sNode && tNode) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", sNode.x); line.setAttribute("y1", sNode.y);
            line.setAttribute("x2", tNode.x); line.setAttribute("y2", tNode.y);
            line.setAttribute("stroke", (sNode.isProto || tNode.isProto) ? "#7e51ff" : "#7e51ff44");
            line.setAttribute("stroke-width", (sNode.isProto || tNode.isProto) ? "2" : "0.5");
            line.setAttribute("stroke-dasharray", "4 4");
            svg.appendChild(line);
          }
        });
      }
    });
  };

  // ----- Auth & Execution -----
  subscribeToAuthChanges(async (user) => {
    console.log("[Main] Auth state changed. User:", user ? user.uid : "None");
    currentUser = user;
    
    if (user) {
      console.log(`Login Success: ${user.displayName}`);
      authContainer.innerHTML = `<div class="flex items-center gap-3"><img src="${user.photoURL}" class="w-8 h-8 rounded-full border border-primary/20"><button id="logout-btn" class="text-xs text-on-surface-variant hover:text-white">Logout</button></div>`;
      document.getElementById('logout-btn').addEventListener('click', logout);
      
      try {
        console.log("[Main] Fetching default project for user...");
        const project = await getDefaultProject(user.uid);
        console.log("[Main] Project received:", project);
        
        if (!project || !project.id) throw new Error("Project ID is missing from response.");
        
        currentProjectId = project.id;
        console.log(`[Main] Active Project ID set: ${currentProjectId}`);

        // 프로젝트 ID 설정 완료 후 모든 버튼 즉시 활성화
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerText = isEditing ? "Update Character" : "Save Character";
        }
        if (addEventBtn) {
          addEventBtn.disabled = false;
          console.log("[Main] addEventBtn enabled");
        }
        if (saveEventBtn) saveEventBtn.disabled = false;

        // 구독 시작
        console.log("[Main] Starting subscriptions...");
        if (unsubscribeCharacters) unsubscribeCharacters();
        unsubscribeCharacters = subscribeToCharacters(user.uid, (chars) => {
          registeredCharacters = chars;
          const container = document.getElementById('character-list-container');
          if (container) {
            document.getElementById('character-count-badge').innerText = chars.length;
            container.innerHTML = chars.length ? '' : '<p class="text-xs italic py-4 text-center">Manuscript is empty...</p>';
            chars.forEach(c => {
              const card = document.createElement('div');
              card.className = `p-4 rounded-lg cursor-pointer bg-surface-container-low hover:bg-surface-container-highest transition-all flex items-center gap-4 mb-4 ${c.isProtagonist ? 'border-l-4 border-primary' : ''}`;
              card.innerHTML = `<div class="w-10 h-10 rounded-full border border-primary/20 overflow-hidden"><img src="${c.avatarUrl}" class="w-full h-full object-cover"></div><div><h4 class="text-sm font-bold text-white">${c.fullName}</h4><p class="text-[9px] uppercase tracking-widest text-on-surface-variant">${c.archetype}</p></div>`;
              card.addEventListener('click', () => populateEditForm(c));
              container.appendChild(card);
            });
          }
          updateMapVisualization(chars);
          renderRelationships();
        });

        if (unsubscribeTimeline) unsubscribeTimeline();
        unsubscribeTimeline = subscribeToTimelineEvents(currentProjectId, (events) => renderTimeline(events));

      } catch (err) {
        console.error("[Main] Project initialization failed:", err);
        showToast("Session initialization error. Please refresh.");
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerText = "Init Failed";
        }
        // 예외 상황에서도 UI 접근성을 위해 로그아웃 버튼 등은 유지
      }
    } else {
      authContainer.innerHTML = `<button id="login-btn" class="bg-primary text-white font-bold py-1.5 px-4 rounded-lg text-sm">Login with Google</button>`;
      document.getElementById('login-btn').addEventListener('click', () => {
        console.log("[Main] Login button clicked -> Calling signInWithGoogle");
        signInWithGoogle();
      });
      currentProjectId = null;
    }
  });

  charForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const fullName = document.getElementById('char-fullname').value.trim();
    if (!fullName) return;
    const charData = {
      fullName: fullName || "Unnamed",
      archetype: document.getElementById('char-archetype')?.value || "Protagonist",
      personality: document.getElementById('char-personality')?.value || "",
      isProtagonist: !!document.getElementById('char-is-protagonist')?.checked,
      relToProtagonist: document.getElementById('char-is-protagonist')?.checked ? '' : (document.getElementById('char-rel-to-proto')?.value || ""),
      traits: traits || [],
      relationships: (relationships || []).filter(r => r.targetId),
      avatarUrl: isEditing ? (registeredCharacters.find(c => c.id === editingId)?.avatarUrl || DEFAULT_AVATARS[0]) : DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]
    };

    saveBtn.disabled = true;
    saveBtn.innerText = "Processing...";

    try {
      if (isEditing) await updateCharacter(editingId, charData);
      else await saveCharacter(charData, currentUser.uid, currentProjectId);
      showToast("Character synchronization complete.");
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Data rejected by server.");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerText = isEditing ? "Update Character" : "Save Character";
    }
  });
};

document.addEventListener('DOMContentLoaded', initApp);
