// LARPP APP ULTRA-STABLE - Final Version for Launch

// Permanent Keys
const K = { GOALS: 'pw_goals_master_v1', HIST: 'pw_hist_master_v1', THEME: 'pw_theme_master_v1' };
let goals = [];
let history = [];

try {
    goals = JSON.parse(localStorage.getItem(K.GOALS));
    if (!Array.isArray(goals)) goals = [];
} catch (e) {
    goals = [];
}

try {
    history = JSON.parse(localStorage.getItem(K.HIST));
    if (!Array.isArray(history)) history = [];
} catch (e) {
    history = [];
}

let currentMonth = new Date();
let currentImg = null;
let deferredPrompt = null;

const TIPS = [
    "La disciplina financiera construye imperios. 🏎️",
    "No ahorres lo que queda después de gastar; gasta lo que queda después de ahorrar. 💎",
    "Tu 'yo' del futuro te agradecerá la sabiduría de hoy. 🥂",
    "Cada peso es una semilla para tu libertad financiera. 🎋"
];

const EMPTY_TIP = "Establece tu primer objetivo para empezar a construir tu fortuna. 📈";

window.addEventListener('load', () => {
    try {
        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log("LARPP APP SW: Invertido con éxito."))
                .catch(err => console.error("SW Bug:", err));
        }
        
        initTheme();
        setupDisplayMode();
        render();
        setupFAB();
        setupNavigation();
        setupActions();
        requestNotifs();
        handleInstallLogic();
    } catch (e) {
        console.error("Initialization Error:", e);
        alert("Error de inicialización de la app: " + e.message);
    }
});

// PWA & INSTALLING (Banner logic fixed)
function setupDisplayMode() {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const banner = document.getElementById('promo-banner');
    if (banner) {
        // If already in PWA, ALWAYS hide. If in web, show until installed.
        banner.style.display = isPWA ? 'none' : 'block';
    }
}

function handleInstallLogic() {
    const btn = document.getElementById('header-install-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (btn) btn.style.display = 'block';
    });

    const installAction = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choice) => {
                if (choice.outcome === 'accepted') {
                   if (btn) btn.style.display = 'none';
                   const pb = document.getElementById('promo-banner');
                   if (pb) pb.style.display = 'none';
                }
                deferredPrompt = null;
            });
        } else {
            // Error handling/Fallback: If prompt is not available (Safari/Chrome before prompt)
            alert("Para instalar en iPhone: Toca el icono de Compartir y selecciona 'Añadir a pantalla de inicio'.\n\nEn Android: Toca el botón de tres puntos y 'Instalar Aplicación'.");
        }
    };

    const pib = document.getElementById('promo-install-btn');
    if (pib) pib.onclick = installAction;
    if (btn) btn.onclick = installAction;
}

// NAVIGATION
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    navItems.forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            item.classList.add('active');
            const target = item.getAttribute('data-view');
            const targetEl = document.getElementById(`view-${target}`);
            if (targetEl) targetEl.classList.add('active');
            if (target === 'history') renderCalendar();
        };
    });
    
    document.getElementById('prev-month').onclick = () => { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCalendar(); };
    document.getElementById('next-month').onclick = () => { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCalendar(); };
}

// CALENDAR
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month');
    if (!grid || !monthLabel) return;
    grid.innerHTML = '';
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    monthLabel.textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentMonth);
    
    ['D', 'L', 'M', 'M', 'J', 'V', 'S'].forEach(d => {
        const el = document.createElement('div');
        el.className = 'calendar-day-label';
        el.textContent = d; el.style.textAlign = 'center'; el.style.opacity = '0.5'; el.style.fontSize = '12px';
        grid.appendChild(el);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${month + 1}-${d}`;
        const dayEvents = history.filter(h => {
             const hDate = new Date(h.timestamp);
             return hDate.getFullYear() === year && hDate.getMonth() === month && hDate.getDate() === d;
        });
        const metaStart = goals.find(g => {
            const sDate = new Date(g.startDate);
            return sDate.getFullYear() === year && sDate.getMonth() === month && sDate.getDate() === d;
        });

        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = d;
        const level = Math.min(dayEvents.length, 4);
        if (level > 0) el.classList.add(`day-level-${level}`);
        if (metaStart) {
            el.classList.add('meta-start-marker');
            el.style.color = metaStart.color || 'var(--md-sys-color-primary)';
        }
        el.onclick = () => showDailySummary(dateStr, dayEvents, metaStart);
        grid.appendChild(el);
    }
}

function showDailySummary(dateStr, events, metaStart) {
    const list = document.getElementById('day-history-list');
    const label = document.getElementById('history-date-label');
    label.textContent = new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    list.innerHTML = '';
    
    if (metaStart) {
        const div = document.createElement('div');
        div.style = `padding:14px; background:${metaStart.color}22; border-radius:15px; margin-bottom:12px; border:1px solid ${metaStart.color}`;
        div.innerHTML = `<span style="font-size:10px; font-weight:700; color:${metaStart.color}">INICIO SUEÑO</span><br><b>${metaStart.name}</b>`;
        list.appendChild(div);
    }
    
    if (events.length === 0 && !metaStart) {
        list.innerHTML = '<p style="opacity:0.5; text-align:center;">Sin actividad financiera.</p>';
    } else {
        events.forEach(h => {
            const div = document.createElement('div');
            div.style = `padding:16px; background:var(--md-sys-color-secondary-container); border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;`;
            div.innerHTML = `<div><b>${h.name}</b></div><b style="color:${h.type==='wit'?'var(--md-sys-color-error)':'var(--md-sys-color-primary)'}">${h.type==='wit'?'-':'+'}$${h.amt.toLocaleString()}</b>`;
            list.appendChild(div);
        });
    }
    document.getElementById('day-history-modal').classList.add('active');
}

// DASHBOARD RENDER (FIXED)
function render() {
    const list = document.getElementById('goals-list');
    const title = document.getElementById('goals-title');
    const tip = document.getElementById('tip-content');
    if (!list) return;
    list.innerHTML = '';
    
    if (goals.length === 0) {
        if (tip) tip.textContent = EMPTY_TIP;
        if (title) title.classList.remove('visible');
    } else {
        if (tip) tip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
        if (title) title.classList.add('visible');
        
        goals.forEach(g => {
            const perc = Math.min(Math.round((g.current / g.target) * 100), 100);
            const daysLeft = Math.ceil((new Date(g.endDate) - new Date()) / 86400000);
            const countdownTxt = daysLeft > 0 ? `⌛ Faltan ${daysLeft} días` : "⌛ Plazo cumplido";
            
            const el = document.createElement('div');
            el.className = 'goal-card';
            
            let imgHTML = `<div class="goal-icon-placeholder" style="background:${g.color || 'var(--md-sys-color-primary)'}; color:white;">🎯</div>`;
            if (g.image) {
                imgHTML = `<img src="${g.image}" class="goal-image" alt="${g.name}">`;
            }

            el.innerHTML = `
                <div class="goal-image-container">
                    ${imgHTML}
                </div>
                <div class="goal-info">
                    <div class="goal-header-row">
                        <div class="goal-title-txt">${g.name}</div>
                        <div class="goal-perc-txt" style="color:${g.color || 'var(--md-sys-color-primary)'}">${perc}%</div>
                    </div>
                    <div class="goal-amount-txt">$${g.current.toLocaleString()} / $${g.target.toLocaleString()}</div>
                    <div class="goal-countdown-txt">${countdownTxt}</div>
                    <div class="goal-progress-container">
                        <div class="goal-progress-fill" style="width:${perc}%; background:${g.color || 'var(--md-sys-color-primary)'};"></div>
                    </div>
                </div>
            `;
            el.onclick = () => openDetail(g);
            list.appendChild(el);
        });
    }
}

function openDetail(g) {
    const d = document.getElementById('goal-detail');
    const img = document.getElementById('detail-img');
    document.getElementById('detail-name').textContent = g.name;
    
    if (g.image) {
        img.src = g.image;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }

    document.getElementById('detail-progress-text').textContent = `$${g.current.toLocaleString()} / $${g.target.toLocaleString()}`;
    const p = Math.min((g.current / g.target) * 100, 100);
    const progressBar = document.getElementById('detail-progress-bar');
    progressBar.style.width = p + '%';
    progressBar.style.background = g.color || 'var(--md-sys-color-primary)';
    
    document.getElementById('detail-percentage').textContent = Math.round(p) + '%';
    document.getElementById('detail-time-range').textContent = `${new Date(g.startDate).toLocaleDateString()} al ${new Date(g.endDate).toLocaleDateString()}`;
    const days = Math.ceil((new Date(g.endDate) - new Date()) / 86400000);
    document.getElementById('detail-time').textContent = days > 0 ? `Quedan ${days} días para lograrlo` : "Plazo cumplido";
    document.getElementById('detail-advice').textContent = g.current > g.target * 0.9 ? "¡Inversión casi completada!" : "Cada aporte es un escalón hacia tu imperio.";
    
    const delBtn = document.getElementById('delete-goal-btn');
    if (delBtn) {
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm("¿Estás seguro que quieres abandonar este sueño? 🧐")) {
                deleteGoal(g.id);
            }
        };
    }

    d.classList.add('active');
}

function deleteGoal(id) {
    goals = goals.filter(g => g.id !== id);
    save();
    document.getElementById('goal-detail').classList.remove('active');
    render();
}

function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 200;
            const MAX_HEIGHT = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with low quality (0.6) to guarantee small footprint (approx 5-15KB)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ACTION LISTENERS (Goal Creation Fixed)
function setupActions() {
    const imgFile = document.getElementById('goal-image-file');
    if (imgFile) {
        imgFile.onchange = (e) => {
            const f = e.target.files[0];
            if (f) {
                compressImage(f, (compressedDataUrl) => {
                    currentImg = compressedDataUrl;
                    const prev = document.getElementById('upload-preview');
                    if (prev) prev.innerHTML = `<img src="${currentImg}" style="width:100px; height:100px; border-radius:20px; object-fit:cover;">`;
                });
            }
        };
    }

    const saveGoalBtn = document.getElementById('save-goal-btn');
    if (saveGoalBtn) {
        saveGoalBtn.onclick = () => {
            try {
                const name = document.getElementById('goal-name').value;
                const target = parseFloat(document.getElementById('goal-target').value);
                const start = document.getElementById('goal-start-date').value;
                const end = document.getElementById('goal-end-date').value;
                const color = document.getElementById('goal-color').value;
                
                if (name && target && start && end) {
                    const newGoal = { id: Date.now(), name, target, current: 0, startDate: start, endDate: end, color, image: currentImg };
                    goals.push(newGoal);
                    save(); 
                    closeModals(); 
                    render();
                    
                    // Clear Form
                    document.getElementById('goal-name').value = '';
                    document.getElementById('goal-target').value = '';
                    document.getElementById('goal-start-date').value = '';
                    document.getElementById('goal-end-date').value = '';
                    currentImg = null;
                    const prev = document.getElementById('upload-preview');
                    if (prev) prev.textContent = "📸 Subir Foto";
                    notify('🎯 Meta de Éxito', `Has iniciado: ${name}.`);
                } else {
                    alert("Completa todos los campos estratégicos.");
                }
            } catch (e) {
                console.error("Error creating goal:", e);
                alert("Error al crear la meta: " + e.message);
            }
        };
    }

    const confirmSavingBtn = document.getElementById('confirm-saving-btn');
    if (confirmSavingBtn) {
        confirmSavingBtn.onclick = () => {
            try {
                const idSelection = document.getElementById('select-goal').value;
                const amt = parseFloat(document.getElementById('saving-amount').value);
                if (idSelection && amt > 0) {
                    const idx = goals.findIndex(x => x.id === parseInt(idSelection));
                    if (idx !== -1) {
                        goals[idx].current += amt;
                        log(goals[idx].name, amt, 'dep');
                        save(); closeModals(); render();
                        document.getElementById('saving-amount').value = '';
                    }
                }
            } catch (e) {
                console.error("Error saving:", e);
                alert("Error al registrar ahorro: " + e.message);
            }
        };
    }

    const confirmWithdrawBtn = document.getElementById('confirm-withdraw-btn');
    if (confirmWithdrawBtn) {
        confirmWithdrawBtn.onclick = () => {
            try {
                const idSelection = document.getElementById('withdraw-select-goal').value;
                const amt = parseFloat(document.getElementById('withdraw-amount').value);
                if (idSelection && amt > 0) {
                    const g = goals.find(x => x.id === parseInt(idSelection));
                    if (g && g.current >= amt) {
                        g.current -= amt; log(g.name, amt, 'wit');
                        save(); closeModals(); render();
                        document.getElementById('withdraw-amount').value = '';
                    }
                }
            } catch (e) {
                console.error("Error withdrawing:", e);
                alert("Error al retirar: " + e.message);
            }
        };
    }
    
    const closeDetailBtn = document.getElementById('close-detail');
    if (closeDetailBtn) closeDetailBtn.onclick = () => document.getElementById('goal-detail').classList.remove('active');
}

// UI HELPERS
function setupFAB() {
    const fab = document.getElementById('main-fab');
    const menu = document.getElementById('fab-menu');
    if (fab && menu) {
        fab.onclick = () => { fab.classList.toggle('active'); menu.classList.toggle('active'); };
    }
}

function initTheme() {
    const t = localStorage.getItem(K.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', t);
    document.getElementById('theme-toggle').onclick = () => {
        const n = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', n);
        localStorage.setItem(K.THEME, n);
    };
}

window.openGoalModal = () => { document.getElementById('goal-modal').classList.add('active'); closeFAB(); };
window.openSavingModal = () => { 
    if(!goals.length) return alert("Crea una meta primero.");
    const s = document.getElementById('select-goal');
    s.innerHTML = goals.map(x => `<option value="${x.id}">${x.name}</option>`).join('');
    document.getElementById('saving-modal').classList.add('active');
    closeFAB();
};
window.openWithdrawModal = () => { 
    if(!goals.length) return alert("No hay metas para retirar.");
    const s = document.getElementById('withdraw-select-goal');
    s.innerHTML = goals.map(x => `<option value="${x.id}">${x.name}</option>`).join('');
    document.getElementById('withdraw-modal').classList.add('active');
    closeFAB();
};
window.openComisionModal = () => {
    if(!goals.length) return alert("Crea una meta primero para registrar tu comisión.");
    const s = document.getElementById('comision-select-goal');
    s.innerHTML = goals.map(x => `<option value="${x.id}">${x.name}</option>`).join('');
    document.getElementById('comision-modal').classList.add('active');
    closeFAB();
};
window.addComision = (name, price) => {
    const idSelection = document.getElementById('comision-select-goal').value;
    if (idSelection && price > 0) {
        const idx = goals.findIndex(x => x.id === parseInt(idSelection));
        if (idx !== -1) {
            goals[idx].current += price;
            log(`Comisión: ${name}`, price, 'dep');
            save(); closeModals(); render();
            notify('💰 Ingreso Registrado', `Has añadido $${price} por el ${name}.`);
        }
    }
};
window.closeModals = () => { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); };

function closeFAB() {
    const fab = document.getElementById('main-fab');
    const menu = document.getElementById('fab-menu');
    if (fab && menu) { fab.classList.remove('active'); menu.classList.remove('active'); }
}

function log(name, amt, type) { history.unshift({ name, amt, type, timestamp: Date.now() }); }
function save() {
    try {
        localStorage.setItem(K.GOALS, JSON.stringify(goals));
        localStorage.setItem(K.HIST, JSON.stringify(history));
    } catch (e) {
        console.warn("Storage write failed, attempting auto-cleanup:", e);
        // QuotaExceededError check (code 22 or name Match)
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.message.includes('quota')) {
            // Strip out large base64 images to recover space
            let optimized = false;
            goals.forEach(g => {
                if (g.image && g.image.length > 5000) { // Strip images larger than 5KB (typically base64 raw uploads)
                    g.image = null;
                    optimized = true;
                }
            });
            
            if (optimized) {
                try {
                    localStorage.setItem(K.GOALS, JSON.stringify(goals));
                    localStorage.setItem(K.HIST, JSON.stringify(history));
                    alert("⚠️ El almacenamiento local estaba lleno. Para guardar tu nueva meta, el sistema optimizó y eliminó fotos pesadas de metas anteriores de forma automática. ¡Tus metas ya se guardaron con éxito!");
                    return;
                } catch (retryError) {
                    console.error("Critical: Storage still full after stripping images", retryError);
                }
            }
            
            // If still failing or no images could be optimized, try trimming history
            if (history.length > 50) {
                history = history.slice(0, 50); // Keep last 50 events
                try {
                    localStorage.setItem(K.GOALS, JSON.stringify(goals));
                    localStorage.setItem(K.HIST, JSON.stringify(history));
                    alert("⚠️ El almacenamiento local sigue lleno. Se recortó el historial antiguo de transacciones para poder guardar tus metas con éxito.");
                    return;
                } catch (retryError) {
                    console.error("Storage full after history trimming", retryError);
                }
            }
            
            alert("❌ El almacenamiento de tu navegador está completamente lleno. Por favor, elimina metas antiguas para liberar espacio.");
        } else {
            throw e;
        }
    }
}
async function requestNotifs() { if ('Notification' in window) await Notification.requestPermission(); }
function notify(t, b) { if ('serviceWorker' in navigator && Notification.permission === 'granted') navigator.serviceWorker.ready.then(r => r.showNotification(t, { body: b, icon: 'icon.png' })); }
