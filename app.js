// ===================== STATE =====================
let state = {
  profiles: [],
  currentUserId: null,
  currentPage: 'dashboard',
  calendarDate: new Date(),
  selectedDay: null,
  sleepQuality: 0,
  editingWorkoutId: null,
  weightChart: null
};

// ===================== STORAGE =====================
function loadState() {
  const saved = localStorage.getItem('fitfam_data');
  if (saved) {
    const data = JSON.parse(saved);
    state.profiles = data.profiles || [];
    state.currentUserId = data.currentUserId || null;
  }
}

function saveState() {
  localStorage.setItem('fitfam_data', JSON.stringify({
    profiles: state.profiles,
    currentUserId: state.currentUserId
  }));
}

function getUser() {
  return state.profiles.find(p => p.id === state.currentUserId);
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function ensureUserData(user) {
  if (!user.data) user.data = {};
  if (!user.data.water) user.data.water = {};
  if (!user.data.sleep) user.data.sleep = [];
  if (!user.data.meals) user.data.meals = {};
  if (!user.data.routine) user.data.routine = {}; // dayIndex -> workoutId
  if (!user.data.customWorkouts) user.data.customWorkouts = [];
  if (!user.data.measures) user.data.measures = [];
  if (!user.data.completedWorkouts) user.data.completedWorkouts = {}; // date -> [ids]
  if (!user.data.streak) user.data.streak = 0;
  if (!user.data.lastActive) user.data.lastActive = null;
}

// ===================== AUTH =====================
function renderProfiles() {
  const list = document.getElementById('profile-list');
  list.innerHTML = '';
  if (state.profiles.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);margin-bottom:16px">Nenhum perfil ainda. Crie o primeiro!</p>';
  }
  state.profiles.forEach(p => {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.innerHTML = `
      <span class="avatar">${p.avatar}</span>
      <span class="name">${p.name}</span>
      <i class="fa-solid fa-chevron-right arrow"></i>`;
    card.onclick = () => login(p.id);
    list.appendChild(card);
  });
}

function login(id) {
  state.currentUserId = id;
  const user = getUser();
  ensureUserData(user);
  saveState();
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app').classList.add('active');
  document.getElementById('user-avatar').textContent = user.avatar;
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('dash-name').textContent = user.name;
  navigate('dashboard');
  updateDashboard();
}

function logout() {
  state.currentUserId = null;
  saveState();
  document.getElementById('app').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
  renderProfiles();
}

// ===================== NAVIGATION =====================
function navigate(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  const titles = {
    dashboard: 'Dashboard',
    calendar: 'Calendário',
    workouts: 'Treinos',
    routine: 'Minha Rotina',
    diet: 'Dieta',
    water: 'Água',
    sleep: 'Sono',
    progress: 'Progresso'
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  closeSidebar();

  if (page === 'calendar') renderCalendar();
  if (page === 'workouts') renderWorkouts();
  if (page === 'routine') renderRoutine();
  if (page === 'diet') renderDiet();
  if (page === 'water') renderWater();
  if (page === 'sleep') renderSleep();
  if (page === 'progress') renderProgress();
  if (page === 'dashboard') updateDashboard();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('active');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

// ===================== MODALS =====================
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ===================== DASHBOARD =====================
function updateDashboard() {
  const user = getUser();
  if (!user) return;
  ensureUserData(user);

  const today = getTodayKey();
  const waterToday = user.data.water[today] || { total: 0, log: [] };
  document.getElementById('stat-water').textContent = `${(waterToday.total/1000).toFixed(1)} / 2.5L`;

  // Sleep
  const lastSleep = user.data.sleep[user.data.sleep.length - 1];
  if (lastSleep) {
    document.getElementById('stat-sleep').textContent = `${lastSleep.hours.toFixed(1)}h`;
  } else {
    document.getElementById('stat-sleep').textContent = '—';
  }

  // Workouts this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  let weekCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (user.data.completedWorkouts[key]) weekCount += user.data.completedWorkouts[key].length;
  }
  document.getElementById('stat-workout').textContent = weekCount;

  // Streak
  document.getElementById('stat-streak').textContent = user.data.streak || 0;

  // Date
  const opts = { weekday: 'long', day: 'numeric', month: 'long' };
  document.getElementById('dash-date').textContent = now.toLocaleDateString('pt-BR', opts);

  // Today workout from routine
  const dayIndex = now.getDay();
  const routineId = user.data.routine[dayIndex];
  const container = document.getElementById('today-workout');
  if (routineId) {
    const all = [...WORKOUT_LIBRARY, ...user.data.customWorkouts];
    const w = all.find(x => x.id === routineId);
    if (w) {
      container.innerHTML = `
        <div class="workout-item" onclick="showWorkoutDetail('${w.id}')">
          <div class="info">
            <h4>${w.name}</h4>
            <span>${w.exercises.length} exercícios</span>
          </div>
          <span class="badge">${w.muscle}</span>
        </div>`;
    } else {
      container.innerHTML = '<p class="empty">Nenhum treino agendado para hoje.</p>';
    }
  } else {
    container.innerHTML = '<p class="empty">Nenhum treino agendado para hoje. Monte sua rotina!</p>';
  }

  // Tip
  const tipIndex = now.getDate() % DAILY_TIPS.length;
  document.getElementById('daily-tip').textContent = DAILY_TIPS[tipIndex];
}

// ===================== CALENDAR =====================
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  document.getElementById('calendar-month').textContent = `${MONTHS[month]} ${year}`;

  grid.innerHTML = '';
  WEEK_DAYS_SHORT.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const user = getUser();
  ensureUserData(user);

  // Prev month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'cal-day other';
    el.textContent = daysInPrev - i;
    grid.appendChild(el);
  }

  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (year === today.getFullYear() && month === today.getMonth() && d === today.getDate()) {
      el.classList.add('today');
    }
    if (user.data.completedWorkouts[key] && user.data.completedWorkouts[key].length > 0) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      el.appendChild(dot);
    }
    el.onclick = () => selectDay(year, month, d, el);
    grid.appendChild(el);
  }

  // Next month fill
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day other';
    el.textContent = i;
    grid.appendChild(el);
  }
}

function selectDay(year, month, day, el) {
  document.querySelectorAll('.cal-day.selected').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedDay = { year, month, day };
  const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  document.getElementById('day-title').textContent = `${day} de ${MONTHS[month]}`;
  const user = getUser();
  ensureUserData(user);
  let html = '';
  const completed = user.data.completedWorkouts[key] || [];
  if (completed.length > 0) {
    html += '<p style="margin-bottom:8px;color:var(--success)"><i class="fa-solid fa-check"></i> Treinos realizados:</p>';
    completed.forEach(id => {
      const all = [...WORKOUT_LIBRARY, ...user.data.customWorkouts];
      const w = all.find(x => x.id === id);
      if (w) html += `<div class="workout-item" style="margin-bottom:6px"><div class="info"><h4>${w.name}</h4></div></div>`;
    });
  }
  const water = user.data.water[key];
  if (water) {
    html += `<p style="margin-top:10px"><i class="fa-solid fa-droplet" style="color:var(--primary)"></i> Água: ${(water.total/1000).toFixed(1)}L</p>`;
  }
  const sleep = user.data.sleep.find(s => s.date === key);
  if (sleep) {
    html += `<p><i class="fa-solid fa-moon" style="color:var(--accent)"></i> Sono: ${sleep.hours.toFixed(1)}h (${sleep.quality}/5)</p>`;
  }
  if (!html) html = '<p class="empty">Nenhum registro neste dia.</p>';
  document.getElementById('day-content').innerHTML = html;
}

// ===================== WORKOUTS =====================
function renderWorkouts() {
  renderLibrary();
  renderCustomWorkouts();
}

function renderLibrary() {
  const filter = document.getElementById('filter-muscle').value;
  const list = document.getElementById('workout-library');
  list.innerHTML = '';
  const filtered = filter === 'all' ? WORKOUT_LIBRARY : WORKOUT_LIBRARY.filter(w => w.muscle === filter);
  filtered.forEach(w => {
    const item = document.createElement('div');
    item.className = 'workout-item';
    item.innerHTML = `
      <div class="info">
        <h4>${w.name}</h4>
        <span>${w.exercises.length} exercícios</span>
      </div>
      <span class="badge">${w.muscle}</span>`;
    item.onclick = () => showWorkoutDetail(w.id);
    list.appendChild(item);
  });
}

function renderCustomWorkouts() {
  const user = getUser();
  ensureUserData(user);
  const list = document.getElementById('custom-workouts');
  list.innerHTML = '';
  if (user.data.customWorkouts.length === 0) {
    list.innerHTML = '<p class="empty" style="margin-top:12px">Você ainda não criou treinos personalizados.</p>';
    return;
  }
  user.data.customWorkouts.forEach(w => {
    const item = document.createElement('div');
    item.className = 'workout-item';
    item.innerHTML = `
      <div class="info">
        <h4>${w.name}</h4>
        <span>${w.exercises.length} exercícios</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="badge">${w.muscle}</span>
        <i class="fa-solid fa-trash" style="color:var(--danger);cursor:pointer" onclick="event.stopPropagation();deleteCustomWorkout('${w.id}')"></i>
      </div>`;
    item.onclick = () => showWorkoutDetail(w.id);
    list.appendChild(item);
  });
}

function showWorkoutDetail(id) {
  const user = getUser();
  ensureUserData(user);
  const all = [...WORKOUT_LIBRARY, ...user.data.customWorkouts];
  const w = all.find(x => x.id === id);
  if (!w) return;
  document.getElementById('detail-title').textContent = w.name;
  let html = '<div style="margin-bottom:16px">';
  w.exercises.forEach((ex, i) => {
    html += `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
      <span><strong>${i+1}.</strong> ${ex.name}</span>
      <span style="color:var(--text-muted)">${ex.sets}x ${ex.reps}</span>
    </div>`;
  });
  html += '</div>';
  document.getElementById('detail-exercises').innerHTML = html;
  document.getElementById('btn-start-workout').onclick = () => completeWorkout(id);
  openModal('modal-workout-detail');
}

function completeWorkout(id) {
  const user = getUser();
  ensureUserData(user);
  const today = getTodayKey();
  if (!user.data.completedWorkouts[today]) user.data.completedWorkouts[today] = [];
  if (!user.data.completedWorkouts[today].includes(id)) {
    user.data.completedWorkouts[today].push(id);
  }
  // Streak logic
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
  if (user.data.lastActive === today) {
    // already counted
  } else if (user.data.lastActive === yKey || !user.data.lastActive) {
    user.data.streak = (user.data.streak || 0) + 1;
  } else {
    user.data.streak = 1;
  }
  user.data.lastActive = today;
  saveState();
  closeModal('modal-workout-detail');
  alert('Treino registrado! 💪 Continue assim!');
  updateDashboard();
}

function openNewWorkoutModal() {
  state.editingWorkoutId = null;
  document.getElementById('workout-name').value = '';
  document.getElementById('workout-muscle').value = 'peito';
  document.getElementById('exercises-list').innerHTML = '';
  addExerciseRow();
  openModal('modal-workout');
}

function addExerciseRow(name = '', sets = '3', reps = '10-12') {
  const list = document.getElementById('exercises-list');
  const row = document.createElement('div');
  row.className = 'exercise-row';
  row.innerHTML = `
    <input class="ex-name" placeholder="Exercício" value="${name}" />
    <input class="ex-sets" type="number" placeholder="Séries" value="${sets}" />
    <input class="ex-reps" placeholder="Reps" value="${reps}" />
    <i class="fa-solid fa-xmark remove-ex" onclick="this.parentElement.remove()"></i>`;
  list.appendChild(row);
}

function saveWorkout() {
  const name = document.getElementById('workout-name').value.trim();
  if (!name) return alert('Dê um nome ao treino');
  const muscle = document.getElementById('workout-muscle').value;
  const rows = document.querySelectorAll('#exercises-list .exercise-row');
  const exercises = [];
  rows.forEach(r => {
    const n = r.querySelector('.ex-name').value.trim();
    const s = r.querySelector('.ex-sets').value;
    const re = r.querySelector('.ex-reps').value;
    if (n) exercises.push({ name: n, sets: parseInt(s) || 3, reps: re || '10' });
  });
  if (exercises.length === 0) return alert('Adicione pelo menos um exercício');

  const user = getUser();
  ensureUserData(user);
  const workout = {
    id: 'custom-' + Date.now(),
    name,
    muscle,
    exercises
  };
  user.data.customWorkouts.push(workout);
  saveState();
  closeModal('modal-workout');
  renderCustomWorkouts();
  // switch to custom tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="custom"]').classList.add('active');
  document.getElementById('tab-library').classList.remove('active');
  document.getElementById('tab-custom').classList.add('active');
}

function deleteCustomWorkout(id) {
  if (!confirm('Excluir este treino?')) return;
  const user = getUser();
  user.data.customWorkouts = user.data.customWorkouts.filter(w => w.id !== id);
  // Remove from routine
  Object.keys(user.data.routine).forEach(k => {
    if (user.data.routine[k] === id) delete user.data.routine[k];
  });
  saveState();
  renderCustomWorkouts();
  if (state.currentPage === 'routine') renderRoutine();
}

// ===================== ROUTINE =====================
function renderRoutine() {
  const user = getUser();
  ensureUserData(user);
  const week = document.getElementById('routine-week');
  week.innerHTML = '';
  WEEK_DAYS.forEach((day, i) => {
    const div = document.createElement('div');
    div.className = 'routine-day';
    div.dataset.day = i;
    const assignedId = user.data.routine[i];
    let content = `<h4>${day}</h4>`;
    if (assignedId) {
      const all = [...WORKOUT_LIBRARY, ...user.data.customWorkouts];
      const w = all.find(x => x.id === assignedId);
      if (w) {
        content += `<span class="assigned">${w.name} <i class="fa-solid fa-xmark remove" onclick="removeFromRoutine(${i})"></i></span>`;
      } else {
        content += `<span class="empty" style="font-size:13px;color:var(--text-muted)">Clique em um treino abaixo</span>`;
      }
    } else {
      content += `<span style="font-size:13px;color:var(--text-muted)">Descanso / Clique para adicionar</span>`;
    }
    div.innerHTML = content;
    div.onclick = (e) => {
      if (e.target.classList.contains('remove')) return;
      state.selectedRoutineDay = i;
      // highlight
      document.querySelectorAll('.routine-day').forEach(d => d.style.borderColor = 'var(--border)');
      div.style.borderColor = 'var(--primary)';
      div.style.borderStyle = 'solid';
    };
    week.appendChild(div);
  });

  // Available
  const avail = document.getElementById('available-workouts');
  avail.innerHTML = '';
  const all = [...WORKOUT_LIBRARY, ...user.data.customWorkouts];
  all.forEach(w => {
    const chip = document.createElement('span');
    chip.className = 'avail-chip';
    chip.textContent = w.name;
    chip.onclick = () => assignToRoutine(w.id);
    avail.appendChild(chip);
  });
}

function assignToRoutine(workoutId) {
  if (state.selectedRoutineDay === undefined) {
    alert('Selecione um dia da semana primeiro (clique no dia)');
    return;
  }
  const user = getUser();
  ensureUserData(user);
  user.data.routine[state.selectedRoutineDay] = workoutId;
  saveState();
  renderRoutine();
}

function removeFromRoutine(dayIndex) {
  const user = getUser();
  delete user.data.routine[dayIndex];
  saveState();
  renderRoutine();
}

// ===================== DIET =====================
function renderDiet() {
  const user = getUser();
  ensureUserData(user);
  const today = getTodayKey();
  const meals = user.data.meals[today] || [];
  const list = document.getElementById('meals-list');
  list.innerHTML = '';
  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;
  if (meals.length === 0) {
    list.innerHTML = '<p class="empty">Nenhuma refeição registrada hoje.</p>';
  }
  meals.forEach((m, i) => {
    totalCal += m.cal || 0;
    totalProt += m.prot || 0;
    totalCarb += m.carb || 0;
    totalFat += m.fat || 0;
    const item = document.createElement('div');
    item.className = 'meal-item';
    item.innerHTML = `
      <div>
        <h4>${m.name}</h4>
        <p>${m.foods}</p>
        <div class="meal-macros">${m.cal||0} kcal · P ${m.prot||0}g · C ${m.carb||0}g · G ${m.fat||0}g</div>
      </div>
      <i class="fa-solid fa-trash delete-meal" onclick="deleteMeal(${i})"></i>`;
    list.appendChild(item);
  });
  document.getElementById('macro-cal').textContent = totalCal;
  document.getElementById('macro-prot').textContent = totalProt + 'g';
  document.getElementById('macro-carb').textContent = totalCarb + 'g';
  document.getElementById('macro-fat').textContent = totalFat + 'g';
}

function saveMeal() {
  const name = document.getElementById('meal-name').value.trim();
  if (!name) return alert('Dê um nome à refeição');
  const foods = document.getElementById('meal-foods').value.trim();
  const cal = parseInt(document.getElementById('meal-cal').value) || 0;
  const prot = parseInt(document.getElementById('meal-prot').value) || 0;
  const carb = parseInt(document.getElementById('meal-carb').value) || 0;
  const fat = parseInt(document.getElementById('meal-fat').value) || 0;
  const user = getUser();
  ensureUserData(user);
  const today = getTodayKey();
  if (!user.data.meals[today]) user.data.meals[today] = [];
  user.data.meals[today].push({ name, foods, cal, prot, carb, fat });
  saveState();
  closeModal('modal-meal');
  renderDiet();
  // clear
  document.getElementById('meal-name').value = '';
  document.getElementById('meal-foods').value = '';
  document.getElementById('meal-cal').value = '';
  document.getElementById('meal-prot').value = '';
  document.getElementById('meal-carb').value = '';
  document.getElementById('meal-fat').value = '';
}

function deleteMeal(index) {
  const user = getUser();
  const today = getTodayKey();
  user.data.meals[today].splice(index, 1);
  saveState();
  renderDiet();
}

// ===================== WATER =====================
function renderWater() {
  const user = getUser();
  ensureUserData(user);
  const today = getTodayKey();
  const data = user.data.water[today] || { total: 0, log: [] };
  const goal = 2500;
  const pct = Math.min(100, (data.total / goal) * 100);
  document.getElementById('water-fill').style.height = pct + '%';
  document.getElementById('water-amount').textContent = data.total + ' ml';
  document.getElementById('water-goal').textContent = goal + ' ml';
  const log = document.getElementById('water-log');
  log.innerHTML = '';
  if (data.log.length === 0) {
    log.innerHTML = '<li style="color:var(--text-muted)">Nenhum registro ainda</li>';
  } else {
    data.log.slice().reverse().forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `<span>+${entry.ml} ml</span><span style="color:var(--text-muted)">${entry.time}</span>`;
      log.appendChild(li);
    });
  }
}

function addWater(ml) {
  const user = getUser();
  ensureUserData(user);
  const today = getTodayKey();
  if (!user.data.water[today]) user.data.water[today] = { total: 0, log: [] };
  user.data.water[today].total += ml;
  const now = new Date();
  user.data.water[today].log.push({
    ml,
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });
  saveState();
  renderWater();
  updateDashboard();
}

function resetWater() {
  if (!confirm('Zerar o consumo de água de hoje?')) return;
  const user = getUser();
  const today = getTodayKey();
  user.data.water[today] = { total: 0, log: [] };
  saveState();
  renderWater();
  updateDashboard();
}

// ===================== SLEEP =====================
function renderSleep() {
  const user = getUser();
  ensureUserData(user);
  const hist = document.getElementById('sleep-history');
  hist.innerHTML = '';
  if (user.data.sleep.length === 0) {
    hist.innerHTML = '<p class="empty">Nenhum registro de sono ainda.</p>';
    return;
  }
  user.data.sleep.slice().reverse().slice(0, 14).forEach(s => {
    const entry = document.createElement('div');
    entry.className = 'sleep-entry';
    const stars = '★'.repeat(s.quality) + '☆'.repeat(5 - s.quality);
    entry.innerHTML = `
      <div>
        <strong>${s.date}</strong><br>
        <span style="color:var(--text-muted);font-size:12px">${s.bed} → ${s.wake}</span>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700">${s.hours.toFixed(1)}h</div>
        <div class="stars-display">${stars}</div>
      </div>`;
    hist.appendChild(entry);
  });
}

function setSleepQuality(v) {
  state.sleepQuality = v;
  document.querySelectorAll('#sleep-stars i').forEach(star => {
    const val = parseInt(star.dataset.v);
    star.className = val <= v ? 'fa-solid fa-star active' : 'fa-regular fa-star';
  });
}

function saveSleep() {
  const bed = document.getElementById('sleep-bed').value;
  const wake = document.getElementById('sleep-wake').value;
  if (!bed || !wake) return alert('Preencha os horários');
  if (state.sleepQuality === 0) return alert('Avalie a qualidade do sono');

  // Calculate hours
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  const hours = (wakeMin - bedMin) / 60;

  const user = getUser();
  ensureUserData(user);
  const today = getTodayKey();
  // Remove existing for today if any
  user.data.sleep = user.data.sleep.filter(s => s.date !== today);
  user.data.sleep.push({
    date: today,
    bed,
    wake,
    hours,
    quality: state.sleepQuality
  });
  saveState();
  state.sleepQuality = 0;
  document.querySelectorAll('#sleep-stars i').forEach(s => s.className = 'fa-regular fa-star');
  document.getElementById('sleep-bed').value = '';
  document.getElementById('sleep-wake').value = '';
  renderSleep();
  updateDashboard();
  alert(`Sono registrado: ${hours.toFixed(1)} horas!`);
}

// ===================== PROGRESS =====================
function renderProgress() {
  const user = getUser();
  ensureUserData(user);
  const hist = document.getElementById('measures-history');
  hist.innerHTML = '';
  if (user.data.measures.length === 0) {
    hist.innerHTML = '<p class="empty">Nenhuma medida registrada.</p>';
  } else {
    user.data.measures.slice().reverse().forEach(m => {
      const el = document.createElement('div');
      el.className = 'measure-entry';
      el.innerHTML = `
        <span>${m.date}</span>
        <span>${m.weight ? m.weight + ' kg' : '—'} ${m.waist ? '· ' + m.waist + ' cm' : ''} ${m.bf ? '· ' + m.bf + '%' : ''}</span>`;
      hist.appendChild(el);
    });
  }
  renderWeightChart();
}

function saveMeasures() {
  const weight = parseFloat(document.getElementById('measure-weight').value);
  const height = parseFloat(document.getElementById('measure-height').value);
  const waist = parseFloat(document.getElementById('measure-waist').value);
  const bf = parseFloat(document.getElementById('measure-bf').value);
  if (!weight && !height && !waist && !bf) return alert('Preencha pelo menos um campo');
  const user = getUser();
  ensureUserData(user);
  user.data.measures.push({
    date: getTodayKey(),
    weight: weight || null,
    height: height || null,
    waist: waist || null,
    bf: bf || null
  });
  saveState();
  document.getElementById('measure-weight').value = '';
  document.getElementById('measure-height').value = '';
  document.getElementById('measure-waist').value = '';
  document.getElementById('measure-bf').value = '';
  renderProgress();
  alert('Medidas salvas!');
}

function renderWeightChart() {
  const user = getUser();
  ensureUserData(user);
  const measures = user.data.measures.filter(m => m.weight).slice(-12);
  const ctx = document.getElementById('weight-chart');
  if (state.weightChart) state.weightChart.destroy();
  if (measures.length < 2) {
    ctx.parentElement.querySelector('h3').insertAdjacentHTML('afterend',
      measures.length === 0 ? '' : '<p class="empty" style="margin-top:8px">Adicione mais registros para ver o gráfico.</p>');
    return;
  }
  state.weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: measures.map(m => m.date.slice(5)),
      datasets: [{
        label: 'Peso (kg)',
        data: measures.map(m => m.weight),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#22d3ee'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
      }
    }
  });
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderProfiles();

  // Auto-login if only one profile and was logged
  if (state.currentUserId && state.profiles.find(p => p.id === state.currentUserId)) {
    login(state.currentUserId);
  }

  // New profile
  document.getElementById('btn-new-profile').onclick = () => openModal('modal-profile');
  document.querySelectorAll('#avatar-options .avatar').forEach(a => {
    a.onclick = () => {
      document.querySelectorAll('#avatar-options .avatar').forEach(x => x.classList.remove('selected'));
      a.classList.add('selected');
    };
  });
  document.getElementById('btn-save-profile').onclick = () => {
    const name = document.getElementById('input-name').value.trim();
    if (!name) return alert('Digite um nome');
    const avatar = document.querySelector('#avatar-options .avatar.selected').dataset.avatar;
    const profile = {
      id: 'u-' + Date.now(),
      name,
      avatar,
      data: {}
    };
    state.profiles.push(profile);
    saveState();
    closeModal('modal-profile');
    document.getElementById('input-name').value = '';
    renderProfiles();
  };

  // Nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => navigate(item.dataset.page);
  });
  document.getElementById('btn-menu').onclick = openSidebar;
  document.getElementById('sidebar-overlay').onclick = closeSidebar;
  document.getElementById('btn-switch-user').onclick = logout;

  // Calendar nav
  document.getElementById('prev-month').onclick = () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
    renderCalendar();
  };
  document.getElementById('next-month').onclick = () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
    renderCalendar();
  };

  // Workouts
  document.getElementById('filter-muscle').onchange = renderLibrary;
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    };
  });
  document.getElementById('btn-new-workout').onclick = openNewWorkoutModal;
  document.getElementById('btn-add-exercise').onclick = () => addExerciseRow();
  document.getElementById('btn-save-workout').onclick = saveWorkout;

  // Diet
  document.getElementById('btn-add-meal').onclick = () => openModal('modal-meal');
  document.getElementById('btn-save-meal').onclick = saveMeal;

  // Water
  document.querySelectorAll('.water-btn').forEach(btn => {
    btn.onclick = () => addWater(parseInt(btn.dataset.ml));
  });
  document.getElementById('btn-reset-water').onclick = resetWater;

  // Sleep
  document.querySelectorAll('#sleep-stars i').forEach(star => {
    star.onclick = () => setSleepQuality(parseInt(star.dataset.v));
  });
  document.getElementById('btn-save-sleep').onclick = saveSleep;

  // Progress
  document.getElementById('btn-save-measures').onclick = saveMeasures;
});
