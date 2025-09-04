document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const loginLogoutBtn = document.getElementById('login-logout-btn');
    const welcomeMessageEl = document.getElementById('welcome-message');
    const modalOverlay = document.getElementById('modal-overlay');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginErrorEl = document.getElementById('login-error');
    // ... (outros elementos do DOM como antes)
    const currentMonthYearEl = document.getElementById('current-month-year');
    const calendarGridEl = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const todayBtn = document.getElementById('today-btn');
    const monthViewBtn = document.getElementById('month-view-btn');
    const dayViewBtn = document.getElementById('day-view-btn');
    const monthViewEl = document.getElementById('month-view');
    const dayViewEl = document.getElementById('day-view');
    const dayViewDateEl = document.getElementById('day-view-date');
    const dayTimelineEl = document.getElementById('day-timeline');
    const daySlotsEl = document.getElementById('day-slots');
    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');

    // --- ESTADO DA APLICAÇÃO ---
    let currentUser = null;
    let currentDate = new Date();
    let selectedDate = new Date();

    // --- CONFIGURAÇÕES DA AGENDA ---
    const startTime = 8, endTime = 18, slotDuration = 30;

    // --- LÓGICA DE LOGIN E SESSÃO ---
    function updateUIForUser() {
        if (currentUser) {
            welcomeMessageEl.textContent = `Bem-vindo, ${currentUser.user}!`;
            loginLogoutBtn.textContent = 'Logout';
        } else {
            welcomeMessageEl.textContent = '';
            loginLogoutBtn.textContent = 'Login';
        }
        renderMonthView();
        renderDayView();
    }

    async function checkLoginStatus() {
        const response = await fetch('api.php?action=status');
        const data = await response.json();
        if (data.loggedIn) {
            currentUser = data.user;
        } else {
            currentUser = null;
        }
        updateUIForUser();
    }

    loginLogoutBtn.addEventListener('click', async () => {
        if (currentUser) { // Logout
            await fetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' })
            });
            currentUser = null;
            updateUIForUser();
        } else { // Login
            loginErrorEl.textContent = '';
            modalOverlay.classList.remove('hidden');
            loginModal.classList.remove('hidden');
        }
    });

    modalOverlay.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        loginModal.classList.add('hidden');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const senha = document.getElementById('password').value;
        
        const response = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', user, senha })
        });

        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            modalOverlay.classList.add('hidden');
            loginModal.classList.add('hidden');
            loginForm.reset();
            updateUIForUser();
        } else {
            loginErrorEl.textContent = data.message;
        }
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO (ATUALIZADAS) ---
    async function renderMonthView() {
        calendarGridEl.innerHTML = 'Carregando...';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        currentMonthYearEl.textContent = `${currentDate.toLocaleString('pt-BR', { month: 'long' })} ${year}`;
        
        const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
        const data = await fetchDataFor('month', monthString);

        const appointmentCounts = countByDate(data.agendamentos);
        const blockCounts = countByDate(data.bloqueios);

        calendarGridEl.innerHTML = '';
        // ... (lógica para renderizar dias do mês anterior)
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGridEl.insertAdjacentHTML('beforeend', '<div class="calendar-day other-month"></div>');
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            
            let dayHTML = `<div class="calendar-day" data-date="${dateString}">
                <span class="day-number">${day}</span>`;
            
            if (appointmentCounts[dateString]) {
                const count = appointmentCounts[dateString];
                dayHTML += `<div class="appointment-info">${count} ${count > 1 ? 'agendamentos' : 'agendamento'}</div>`;
            }
            if (blockCounts[dateString]) {
                const count = blockCounts[dateString];
                dayHTML += `<div class="block-info">${count} ${count > 1 ? 'bloqueios' : 'bloqueio'}</div>`;
            }
            dayHTML += `</div>`;
            calendarGridEl.insertAdjacentHTML('beforeend', dayHTML);
        }
        
        // Adiciona eventos e classe 'current-day'
        document.querySelectorAll('.calendar-day[data-date]').forEach(dayEl => {
            if (dayEl.dataset.date === new Date().toISOString().split('T')[0]) {
                dayEl.classList.add('current-day');
            }
            dayEl.addEventListener('click', () => {
                selectedDate = new Date(dayEl.dataset.date + 'T00:00:00');
                renderDayView();
                switchToView('day');
            });
        });
    }

    async function renderDayView() {
        dayTimelineEl.innerHTML = '';
        daySlotsEl.innerHTML = '';
        const dateString = selectedDate.toISOString().split('T')[0];
        dayViewDateEl.textContent = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const data = await fetchDataFor('date', dateString);
        const bookedTimes = new Set(data.agendamentos.map(a => a.time));
        const blockedTimes = new Set(data.bloqueios.map(b => b.time));

        for (let hour = startTime; hour < endTime; hour++) {
            dayTimelineEl.insertAdjacentHTML('beforeend', `<div class="hour-marker" data-hour="${hour}:00"></div>`);
            for (let minutes = 0; minutes < 60; minutes += slotDuration) {
                const time = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                const slotEl = document.createElement('div');
                slotEl.classList.add('time-slot');
                slotEl.dataset.time = time;

                if (blockedTimes.has(time)) {
                    slotEl.classList.add('blocked');
                    slotEl.textContent = 'Bloqueado';
                } else if (bookedTimes.has(time)) {
                    slotEl.classList.add('booked');
                    slotEl.textContent = 'Ocupado';
                } else {
                    slotEl.classList.add('available');
                }
                
                // Lógica de clique baseada na permissão
                slotEl.addEventListener('click', () => handleSlotClick(dateString, time, slotEl));
                daySlotsEl.appendChild(slotEl);
            }
        }
    }

    // --- LÓGICA DE DADOS E AÇÕES ---
    async function fetchDataFor(type, value) {
        try {
            const response = await fetch(`api.php?${type}=${value}`);
            if (!response.ok) throw new Error('Erro ao buscar dados.');
            return await response.json();
        } catch (error) {
            console.error(error);
            return { agendamentos: [], bloqueios: [] };
        }
    }

    function countByDate(items) {
        return items.reduce((acc, item) => {
            acc[item.date] = (acc[item.date] || 0) + 1;
            return acc;
        }, {});
    }

    function handleSlotClick(date, time, element) {
        if (!currentUser) {
            alert('Por favor, faça o login para interagir com a agenda.');
            return;
        }

        if (currentUser.permissao === 'advogado') {
            if (element.classList.contains('available')) {
                bookAppointment(date, time);
            }
        } else if (currentUser.permissao === 'admin') {
            if (!element.classList.contains('booked')) { // Admin pode bloquear/desbloquear horários vagos ou já bloqueados
                toggleBlockSlot(date, time);
            }
        }
    }

    async function bookAppointment(date, time) {
        if (!confirm(`Confirmar agendamento para ${selectedDate.toLocaleDateString()} às ${time}?`)) return;
        const response = await postData({ action: 'book', date, time });
        if (response) {
            alert(response.message);
            renderDayView();
            renderMonthView();
        }
    }

    async function toggleBlockSlot(date, time) {
        const response = await postData({ action: 'toggle_block', date, time });
        if (response) {
            renderDayView();
            renderMonthView();
        }
    }

    async function postData(body) {
        try {
            const response = await fetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Ocorreu um erro.');
            return result;
        } catch (error) {
            alert(`Erro: ${error.message}`);
            return null;
        }
    }

    // --- CONTROLES E EVENTOS (sem grandes mudanças) ---
    function switchToView(viewName) { /* ... */ }
    prevMonthBtn.addEventListener('click', () => { /* ... */ });
    nextMonthBtn.addEventListener('click', () => { /* ... */ });
    todayBtn.addEventListener('click', () => { /* ... */ });
    monthViewBtn.addEventListener('click', () => switchToView('month'));
    dayViewBtn.addEventListener('click', () => switchToView('day'));
    prevDayBtn.addEventListener('click', () => { /* ... */ });
    nextDayBtn.addEventListener('click', () => { /* ... */ });
    
    // Funções de navegação e troca de view (copiadas da versão anterior)
    function switchToView(viewName) {
        monthViewEl.classList.toggle('active', viewName === 'month');
        dayViewEl.classList.toggle('active', viewName === 'day');
        monthViewBtn.classList.toggle('active', viewName === 'month');
        dayViewBtn.classList.toggle('active', viewName === 'day');
    }
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderMonthView(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderMonthView(); });
    todayBtn.addEventListener('click', () => { currentDate = new Date(); selectedDate = new Date(); renderMonthView(); renderDayView(); });
    prevDayBtn.addEventListener('click', () => { selectedDate.setDate(selectedDate.getDate() - 1); if (selectedDate.getMonth() !== currentDate.getMonth()) { currentDate = new Date(selectedDate); renderMonthView(); } renderDayView(); });
    nextDayBtn.addEventListener('click', () => { selectedDate.setDate(selectedDate.getDate() + 1); if (selectedDate.getMonth() !== currentDate.getMonth()) { currentDate = new Date(selectedDate); renderMonthView(); } renderDayView(); });

    // --- INICIALIZAÇÃO ---
    checkLoginStatus(); // Verifica se já existe uma sessão ativa ao carregar a página
});