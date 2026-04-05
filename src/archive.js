import './style.css';
import { signInWithGoogle, logout, subscribeToAuthChanges, checkRedirectResult } from './firebase/auth.js';
import { restoreCharacter, subscribeToCharacters, deleteCharacter } from './firebase/db.js';

let currentUser = null;

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

const initArchive = () => {
  const authContainer = document.getElementById('auth-container');
  const listContainer = document.getElementById('archived-list-container');

  checkRedirectResult().then(() => {});

  subscribeToAuthChanges(async (user) => {
    currentUser = user;
    if (user) {
      authContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="Profile" class="w-8 h-8 rounded-full border border-primary-dim/30 outline outline-2 outline-primary/20">
          <button id="logout-btn" class="text-xs text-on-surface-variant hover:text-white transition-colors cursor-pointer bg-surface-container-high px-3 py-1 rounded-md">Logout</button>
        </div>
      `;
      document.getElementById('logout-btn').addEventListener('click', logout);

      // 'archived' 상태인 캐릭터만 구독
      subscribeToCharacters(user.uid, (characters) => {
        listContainer.innerHTML = characters.length ? '' : '<p class="col-span-full text-center text-on-surface-variant/40 italic py-24">The archive is currently empty...</p>';
        
        characters.forEach(char => {
          const card = document.createElement('div');
          card.className = 'bg-surface-container-high p-6 rounded-2xl border border-surface-bright/20 flex flex-col gap-5 hover:border-primary/40 hover:scale-[1.02] transition-all group ambient-shadow';
          card.innerHTML = `
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-surface-bright flex-shrink-0 grayscale group-hover:grayscale-0 transition-all">
                <img src="${char.avatarUrl || 'https://via.placeholder.com/100'}" class="w-full h-full object-cover">
              </div>
              <div class="flex-1 overflow-hidden">
                <h4 class="text-lg font-headline font-bold text-white truncate">${char.fullName}</h4>
                <p class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">${char.archetype}</p>
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <button class="restore-btn flex-1 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold rounded-xl border border-primary/30 transition-all flex items-center justify-center gap-2" data-id="${char.id}">
                <span class="material-symbols-outlined text-sm">history</span> Restore
              </button>
              <button class="delete-btn px-4 h-10 bg-error/10 text-error hover:bg-error hover:text-white text-xs font-bold rounded-xl border border-error/20 transition-all flex items-center justify-center" data-id="${char.id}">
                <span class="material-symbols-outlined text-sm">delete_forever</span>
              </button>
            </div>
          `;
          
          card.querySelector('.restore-btn').addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            await restoreCharacter(id);
            showToast(`${char.fullName} has been restored!`);
          });

          card.querySelector('.delete-btn').addEventListener('click', async (e) => {
            if (confirm("Permanently delete this shadow? This cannot be undone.")) {
              const id = e.currentTarget.getAttribute('data-id');
              await deleteCharacter(id);
              showToast(`${char.fullName} was permanently deleted.`);
            }
          });

          listContainer.appendChild(card);
        });
      }, 'archived');

    } else {
      authContainer.innerHTML = `<button id="login-btn" type="button" class="bg-primary-dim text-white font-bold py-1.5 px-4 rounded-lg text-sm transition-colors cursor-pointer hover:bg-primary active:scale-95">구글 로그인</button>`;
      document.getElementById('login-btn').addEventListener('click', signInWithGoogle);
      listContainer.innerHTML = '<p class="col-span-full text-center text-on-surface-variant/40 italic py-24">Please login to view your archived shadows...</p>';
    }
  });
};

document.addEventListener('DOMContentLoaded', initArchive);
