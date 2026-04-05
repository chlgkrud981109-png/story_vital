import './style.css';
import { loginWithGoogle, logout, subscribeToAuthChanges } from './firebase/auth.js';
import { getDefaultProject, saveCharacter } from './firebase/db.js';

let currentUser = null;
let currentProjectId = null;

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
    } else {
      // Logged out
      currentProjectId = null;
      authContainer.innerHTML = `
        <button id="login-btn" type="button" class="bg-primary-dim text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-colors cursor-pointer hover:bg-primary active:scale-95">
          Login with Google
        </button>
      `;
      document.getElementById('login-btn').addEventListener('click', loginWithGoogle);
    }
  });

  // Save Character Logic
  charForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !currentProjectId) {
      alert("로그인이 필요합니다. (또는 프로젝트 로딩 중입니다)");
      return;
    }

    const fullName = document.getElementById('char-fullname').value;
    const archetype = document.getElementById('char-archetype').value;
    const personality = document.getElementById('char-personality').value;

    const charData = {
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
      await saveCharacter(currentProjectId, charData);
      alert(`${fullName} 캐릭터가 성공적으로 저장되었습니다!`);
    } catch (err) {
      alert("캐릭터 저장 중 오류가 발생했습니다.");
    } finally {
      saveBtn.innerText = originalText;
      saveBtn.disabled = false;
    }
  });
};

document.addEventListener('DOMContentLoaded', initApp);
