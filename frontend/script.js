document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONFIG ---
    let currentUser = null;
    let notesData = [];
    const API_URL = 'http://127.0.0.1:5000';

    // --- DOM REFERENCES ---
    const searchInput = document.getElementById('search-input');
    const appWrapper = document.getElementById('app-wrapper');
    const createProfilePage = document.getElementById('create-profile-page');
    const profileForm = document.getElementById('profile-form');
    const logoutButton = document.getElementById('logout-button');
    const homePage = document.getElementById('home-page');
    const profilePage = document.getElementById('profile-page');
    const homeLink = document.getElementById('home-link');
    const profileLink = document.getElementById('profile-link');
    const notesContainer = document.getElementById('notes-container');
    const profileNotesContainer = document.getElementById('profile-notes-container');
    const profileUsername = document.getElementById('profile-username');
    const profileStandard = document.getElementById('profile-standard');
    const uploadButton = document.getElementById('upload-button');
    const uploadModal = document.getElementById('upload-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const uploadForm = document.getElementById('upload-form');

    // --- FUNCTIONS ---
    const handleSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        const filteredNotes = notesData.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.subject.toLowerCase().includes(query)
        );
        renderNotes(filteredNotes, notesContainer);
    };
    
    const fetchAndRenderNotes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/notes`);
            notesData = await response.json();
            renderNotes(notesData, notesContainer);
        } catch (error) { console.error("Could not fetch notes:", error); }
    };

    const checkLoginState = async () => {
        const savedUser = localStorage.getItem('educonnect_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            appWrapper.classList.remove('hidden');
            createProfilePage.classList.add('hidden');
            await fetchAndRenderNotes();
            showPage('home');
        } else {
            appWrapper.classList.add('hidden');
            createProfilePage.classList.remove('hidden');
        }
    };

    const showPage = (pageName) => {
        if (pageName === 'profile') {
            renderProfile();
            homePage.classList.add('hidden');
            profilePage.classList.remove('hidden');
        } else {
            homePage.classList.remove('hidden');
            profilePage.classList.add('hidden');
        }
    };

    const renderProfile = () => {
        if (!currentUser) return;
        profileUsername.textContent = currentUser.username;
        profileStandard.textContent = `Standard: ${currentUser.standard}`;
        const userNotes = notesData.filter(note => note.author === currentUser.username);
        renderNotes(userNotes, profileNotesContainer, true);
    };

    const renderNotes = (notesArray, container, isProfile = false) => {
        container.innerHTML = '';
        if (notesArray.length === 0) {
            container.innerHTML = '<p style="color: #8b949e;">No notes found.</p>';
            return;
        }
        notesArray.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            noteCard.setAttribute('data-filename', note.fileName);
            
            const deleteBtn = isProfile ? `<button class="delete-btn" data-id="${note.id}">Delete</button>` : '';

            noteCard.innerHTML = `<h4>${note.title}</h4><div class="meta"><span>By: <strong>${note.author}</strong></span> | <span>File: ${note.fileName}</span></div>${deleteBtn}`;
            container.appendChild(noteCard);
        });
    };
    
    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', handleSearch);
    
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUser = {
            username: document.getElementById('profile-new-username').value,
            standard: parseInt(document.getElementById('profile-new-standard').value)
        };
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser)
        });
        if (response.ok) {
            currentUser = newUser;
            localStorage.setItem('educonnect_user', JSON.stringify(currentUser));
            checkLoginState();
        } else { alert('Username may already be taken.'); }
    });
    
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', document.getElementById('note-title').value);
        formData.append('subject', document.getElementById('note-subject').value);
        formData.append('author', currentUser.username);
        formData.append('file', document.getElementById('note-file').files[0]);

        await fetch(`${API_URL}/api/notes`, { method: 'POST', body: formData });
        uploadModal.classList.add('hidden');
        uploadForm.reset();
        await fetchAndRenderNotes();
        if (!profilePage.classList.contains('hidden')) renderProfile();
    });

    const openFileOnClick = async (event) => {
        // 1. Check if the delete button was clicked
        const deleteBtn = event.target.closest('.delete-btn');
        if (deleteBtn) {
            event.stopPropagation(); // Stops the file from opening
            const noteId = deleteBtn.getAttribute('data-id');
            
            if (confirm("Are you sure you want to permanently delete this file?")) {
                try {
                    const response = await fetch(`${API_URL}/api/notes/${noteId}`, { method: 'DELETE' });
                    const result = await response.json(); // Read the server response
                    
                    if (response.ok) {
                        await fetchAndRenderNotes();
                        renderProfile();
                    } else {
                        // THIS WILL TELL US EXACTLY WHAT IS WRONG
                        alert("Error: " + (result.error || "Unknown server issue"));
                    }
                } catch (error) {
                    alert("Network Error: Could not reach the backend server.");
                }
            }
            return; 
        }

        // 2. Otherwise, check if the card was clicked to open the file
        const card = event.target.closest('.note-card');
        if (card) {
            const filename = card.dataset.filename;
            if (filename) {
                window.open(`${API_URL}/api/files/${filename}`, '_blank');
            }
        }
    };

    notesContainer.addEventListener('click', openFileOnClick);
    profileNotesContainer.addEventListener('click', openFileOnClick);
    logoutButton.addEventListener('click', () => { localStorage.removeItem('educonnect_user'); location.reload(); });
    homeLink.addEventListener('click', (e) => { e.preventDefault(); showPage('home'); });
    profileLink.addEventListener('click', (e) => { e.preventDefault(); showPage('profile'); });
    uploadButton.addEventListener('click', () => uploadModal.classList.remove('hidden'));
    closeModalButton.addEventListener('click', () => uploadModal.classList.add('hidden'));

    checkLoginState();
});