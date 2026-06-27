const API_BASE = '/api';

let currentDate = new Date();
let holidaysByDate = {};   // "YYYY-MM-DD" -> holiday name
let eventsByDate = {};     // "YYYY-MM-DD" -> [events]
let currentFilter = 'all';

const monthLabel = document.getElementById('monthLabel');
const calendarGrid = document.getElementById('calendarGrid');
const dayDetails = document.getElementById('dayDetails');
const taskList = document.getElementById('taskList');

// ---------- Helpers ----------
function toISODate(year, month, day) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function isToday(year, month, day) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// ---------- Calendar rendering ----------
async function loadHolidays(year) {
  try {
    const holidays = await api(`/holidays/${year}`);
    holidaysByDate = {};
    holidays.forEach((h) => {
      holidaysByDate[h.date] = h.localName || h.name;
    });
  } catch (err) {
    console.warn('Holiday fetch failed:', err.message);
    holidaysByDate = {};
  }
}

async function loadEvents(year, month) {
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const events = await api(`/events?month=${monthStr}`);
  eventsByDate = {};
  events.forEach((e) => {
    const dateKey = e.event_date.slice(0, 10);
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(e);
  });
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthLabel.textContent = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarGrid.innerHTML = '';

  // Empty cells before the 1st
  for (let i = 0; i < firstDayWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = toISODate(year, month, day);
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (isToday(year, month, day)) cell.classList.add('today');
    if (holidaysByDate[dateKey]) cell.classList.add('holiday');

    const dayNum = document.createElement('div');
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    if (eventsByDate[dateKey]) {
      const dot = document.createElement('span');
      dot.className = 'event-dot';
      cell.appendChild(dot);
    }

    cell.addEventListener('click', () => showDayDetails(dateKey));
    calendarGrid.appendChild(cell);
  }
}

function showDayDetails(dateKey) {
  const holiday = holidaysByDate[dateKey];
  const events = eventsByDate[dateKey] || [];

  let html = `<strong>${dateKey}</strong><br/>`;
  if (holiday) html += `<span class="holiday-name">${holiday}</span><br/>`;
  if (events.length) {
    html += events
      .map((e) => `${e.event_time ? e.event_time.slice(0, 5) + ' — ' : ''}${e.title}`)
      .join('<br/>');
  } else if (!holiday) {
    html += 'No events or holidays.';
  }

  dayDetails.innerHTML = html;
  document.getElementById('eventDate').value = dateKey;
}

async function refreshCalendarData() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  await Promise.all([loadHolidays(year), loadEvents(year, month)]);
  renderCalendar();
}

document.getElementById('prevMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  refreshCalendarData();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  refreshCalendarData();
});

document.getElementById('addEventBtn').addEventListener('click', async () => {
  const title = document.getElementById('eventTitle').value.trim();
  const event_date = document.getElementById('eventDate').value;
  const event_time = document.getElementById('eventTime').value;

  if (!title || !event_date) {
    alert('Event title and date are required.');
    return;
  }

  try {
    await api('/events', {
      method: 'POST',
      body: JSON.stringify({ title, event_date, event_time }),
    });
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTime').value = '';
    await refreshCalendarData();
  } catch (err) {
    alert(`Could not add event: ${err.message}`);
  }
});

// ---------- Tasks ----------
async function loadTasks() {
  const status = currentFilter === 'all' ? '' : `?status=${currentFilter}`;
  const tasks = await api(`/tasks${status}`);
  renderTasks(tasks);
}

function renderTasks(tasks) {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = '<li class="task-meta">No tasks here.</li>';
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    titleSpan.textContent = task.title;

    const meta = document.createElement('span');
    meta.className = `priority-badge priority-${task.priority}`;
    meta.textContent = task.priority;

    const dueSpan = document.createElement('span');
    dueSpan.className = 'task-meta';
    dueSpan.textContent = task.due_date ? task.due_date.slice(0, 10) : '';

    const actions = document.createElement('span');
    actions.className = 'task-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = task.status === 'completed' ? '↺' : '✓';
    toggleBtn.title = task.status === 'completed' ? 'Mark pending' : 'Mark complete';
    toggleBtn.addEventListener('click', () => toggleTaskStatus(task));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(titleSpan);
    li.appendChild(dueSpan);
    li.appendChild(meta);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

async function toggleTaskStatus(task) {
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  try {
    await api(`/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    await loadTasks();
  } catch (err) {
    alert(`Could not update task: ${err.message}`);
  }
}

async function deleteTask(id) {
  try {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    await loadTasks();
  } catch (err) {
    alert(`Could not delete task: ${err.message}`);
  }
}

document.getElementById('addTaskBtn').addEventListener('click', async () => {
  const title = document.getElementById('taskTitle').value.trim();
  const due_date = document.getElementById('taskDueDate').value;
  const priority = document.getElementById('taskPriority').value;

  if (!title) {
    alert('Task title is required.');
    return;
  }

  try {
    await api('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, due_date, priority }),
    });
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDueDate').value = '';
    await loadTasks();
  } catch (err) {
    alert(`Could not add task: ${err.message}`);
  }
});

document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.status;
    loadTasks();
  });
});

// ---------- Init ----------
(async function init() {
  await refreshCalendarData();
  await loadTasks();
})();
