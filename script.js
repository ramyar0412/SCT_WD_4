// Task Manager App
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    cacheDOMElements() {
        this.taskForm = document.getElementById('task-form');
        this.taskInput = document.getElementById('task-input');
        this.taskDate = document.getElementById('task-date');
        this.taskTime = document.getElementById('task-time');
        this.tasksList = document.getElementById('tasks-list');
        this.emptyState = document.getElementById('empty-state');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clear-completed');
        this.totalTasksEl = document.getElementById('total-tasks');
        this.completedTasksEl = document.getElementById('completed-tasks');
        this.pendingTasksEl = document.getElementById('pending-tasks');
    }

    bindEvents() {
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    }

    handleAddTask(e) {
        e.preventDefault();
        
        const taskText = this.taskInput.value.trim();
        const taskDate = this.taskDate.value;
        const taskTime = this.taskTime.value;

        if (!taskText) return;

        const task = {
            id: Date.now(),
            text: taskText,
            date: taskDate,
            time: taskTime,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();

        // Reset form
        this.taskInput.value = '';
        this.taskDate.value = '';
        this.taskTime.value = '';
        this.taskInput.focus();

        // Add success animation
        this.showSuccessAnimation();
    }

    showSuccessAnimation() {
        const firstTask = this.tasksList.firstElementChild;
        if (firstTask) {
            firstTask.style.animation = 'none';
            setTimeout(() => {
                firstTask.style.animation = '';
            }, 10);
        }
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksList.style.display = 'none';
            this.emptyState.classList.add('show');
            return;
        }

        this.tasksList.style.display = 'flex';
        this.emptyState.classList.remove('show');

        this.tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        this.bindTaskEvents();
    }

    createTaskHTML(task) {
        const dateDisplay = task.date ? new Date(task.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }) : '';

        const timeDisplay = task.time || '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox" data-action="toggle"></div>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    ${dateDisplay || timeDisplay ? `
                        <div class="task-datetime">
                            ${dateDisplay ? `<div class="task-date">📅 ${dateDisplay}</div>` : ''}
                            ${timeDisplay ? `<div class="task-time">⏰ ${timeDisplay}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" data-action="edit">✏️</button>
                    <button class="task-btn delete-btn" data-action="delete">🗑️</button>
                </div>
            </div>
        `;
    }

    bindTaskEvents() {
        this.tasksList.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            const taskId = parseInt(taskItem.dataset.id);
            const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;

            switch(action) {
                case 'toggle':
                    this.toggleTask(taskId);
                    break;
                case 'edit':
                    this.editTask(taskId, taskItem);
                    break;
                case 'delete':
                    this.deleteTask(taskId);
                    break;
            }
        });
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    editTask(id, taskItem) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const wasEditing = taskItem.classList.contains('editing');
        
        if (wasEditing) {
            return; // Already in edit mode
        }

        // Enter edit mode
        taskItem.classList.add('editing');
        
        const taskContent = taskItem.querySelector('.task-content');
        taskContent.innerHTML = `
            <input type="text" class="edit-input" value="${this.escapeHtml(task.text)}" autofocus>
            <div class="edit-datetime">
                <input type="date" class="edit-date" value="${task.date || ''}">
                <input type="time" class="edit-time" value="${task.time || ''}">
            </div>
        `;

        const taskActions = taskItem.querySelector('.task-actions');
        taskActions.innerHTML = `
            <button class="task-btn save-btn" data-action="save">💾</button>
            <button class="task-btn cancel-btn" data-action="cancel">✖️</button>
        `;

        // Focus the input
        const editInput = taskContent.querySelector('.edit-input');
        editInput.focus();
        editInput.select();

        // Handle save
        const saveBtn = taskActions.querySelector('[data-action="save"]');
        const cancelBtn = taskActions.querySelector('[data-action="cancel"]');

        const saveEdit = () => {
            const newText = editInput.value.trim();
            const newDate = taskContent.querySelector('.edit-date').value;
            const newTime = taskContent.querySelector('.edit-time').value;

            if (newText) {
                task.text = newText;
                task.date = newDate;
                task.time = newTime;
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
            }
        };

        const cancelEdit = () => {
            this.renderTasks();
        };

        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            saveEdit();
        });

        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cancelEdit();
        });

        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        });

        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelEdit();
            }
        });
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    handleFilter(e) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderTasks();
    }

    getFilteredTasks() {
        switch(this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            alert('No completed tasks to clear!');
            return;
        }

        if (confirm(`Delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        this.animateNumber(this.totalTasksEl, total);
        this.animateNumber(this.completedTasksEl, completed);
        this.animateNumber(this.pendingTasksEl, pending);
    }

    animateNumber(element, newValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const duration = 300;
        const steps = 20;
        const increment = (newValue - currentValue) / steps;
        let current = currentValue;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;
            element.textContent = Math.round(current);

            if (step >= steps) {
                element.textContent = newValue;
                clearInterval(timer);
            }
        }, duration / steps);
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('task-input').focus();
    }
});