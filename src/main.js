import './style.css';
import { signInWithGoogle, logout, subscribeToAuthChanges } from './firebase/auth.js';
import { getDefaultProject, saveCharacter, subscribeToCharacters } from './firebase/db.js';

let currentUser = null;
let currentProjectId = null;
let unsubscribeCharacters = null;

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

const initApp = () => {
  const authContainer = document.getElementById('auth-container');
  const charForm = document.getElementById('character-form');
  const abilityInput = document.getElementById('char-ability-input');
  const abilitiesContainer = document.getElementById('char-abilities-container');

  // Abilities Badge Logic
  let abilities = ['Ink Manipulation', 'Chrono-Echo']; 

  const renderAbilities = () => {
    abilitiesContainer.innerHTML = '';
    abilities.forEach((ability, index) => {
      const span = document.createElement('span');
      span.className = 'bg-primary-dim/20 text-primary-fixed border border-primary/20 px-3 py-1 rounded-full text-xs flex items-center gap-2';
      span.innerHTML = `${ability} <span class="material-symbols-outlined text-[14px] cursor-pointer" data-index="${index}">close</span>`;
      abilitiesContainer.appendChild(span);
    });

    // close click event
    abilitiesContainer.querySelectorAll('.material-symbols-outlined').forEach(icon => {
      icon.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        abilities.splice(idx, 1);
        renderAbilities();
      });
    });
  };

  abilityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = abilityInput.value.trim();
      if (val) {
        abilities.push(val);
        abilityInput.value = '';
        renderAbilities();
      }
    }
  });

  renderAbilities();

  // Auth Logic
  subscribeToAuthChanges(async (user) => {
    currentUser = user;
    if (user) {
      // Logged in
      authContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="Profile" class="w-8 h-8 rounded-full border border-primary-dim/30">
          <button id="logout-btn" class="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">Logout</button>
        </div>
      `;
      document.getElementById('logout-btn').addEventListener('click', logout);

      // Load Default Project
      try {
        const project = await getDefaultProject(user.uid);
        currentProjectId = project.id;
        console.log("Current Project:", project);
      } catch (err) {
        console.error("Error loading project:", err);
      }

      // subscribe to characters
      if (unsubscribeCharacters) unsubscribeCharacters();
      unsubscribeCharacters = subscribeToCharacters(user.uid, (characters) => {
        const listContainer = document.getElementById('character-list-container');
        const countBadge = document.getElementById('character-count-badge');
        
        if (countBadge) countBadge.innerText = characters.length;
        if (!listContainer) return;

        listContainer.innerHTML = '';
        characters.forEach(char => {
          const card = document.createElement('div');
          card.className = 'glass-panel p-4 rounded-xl cursor-pointer hover:border-primary transition-all';
          card.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-surface text-primary flex items-center justify-center font-bold text-lg border border-primary-dim/30">
                ${char.fullName ? char.fullName.charAt(0).toUpperCase() : '?'}
              </div>
              <div class="overflow-hidden">
                <h4 class="text-sm font-semibold text-white truncate w-32">${char.fullName || '이름 없음'}</h4>
                <p class="text-[10px] uppercase tracking-widest text-secondary mt-0.5 w-32 truncate">${char.archetype || '알 수 없음'}</p>
              </div>
            </div>
          `;
          listContainer.appendChild(card);
        });
      });
    } else {
      // Logged out
      currentProjectId = null;
      authContainer.innerHTML = `
        <button id="login-btn" type="button" class="bg-primary-dim text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-colors cursor-pointer hover:bg-primary active:scale-95">
          구글로 시작하기
        </button>
      `;
      document.getElementById('login-btn').addEventListener('click', signInWithGoogle);

      if (unsubscribeCharacters) {
        unsubscribeCharacters();
        unsubscribeCharacters = null;
      }
      const listContainer = document.getElementById('character-list-container');
      if (listContainer) listContainer.innerHTML = '';
      const countBadge = document.getElementById('character-count-badge');
      if (countBadge) countBadge.innerText = '0';
    }
  });

  // Save Character Logic
  charForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !currentProjectId) {
      alert("로그인이 필요합니다. (또는 프로젝트 로딩 중입니다)");
      return;
    }

    const fullNameElement = document.getElementById('char-fullname');
    const fullName = fullNameElement.value.trim();
    
    if (!fullName) {
      alert("이름을 입력해 주세요.");
      fullNameElement.focus();
      return;
    }

    const archetype = document.getElementById('char-archetype').value;
    const personality = document.getElementById('char-personality').value;

    const charData = {
      projectId: currentProjectId,
      fullName,
      archetype,
      specialAbilities: abilities,
      personality
    };

    const saveBtn = document.getElementById('save-char-btn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
      await saveCharacter(charData, currentUser.uid);
      showToast(`${fullName} 캐릭터가 성공적으로 기록되었습니다!`);
      
      // Reset form
      charForm.reset();
      abilities = [];
      renderAbilities();
    } catch (err) {
      alert("캐릭터 저장 중 오류가 발생했습니다.");
    } finally {
      saveBtn.innerText = originalText;
      saveBtn.disabled = false;
    }
  });
};

document.addEventListener('DOMContentLoaded', initApp);
