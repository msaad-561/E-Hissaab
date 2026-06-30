/* ═══════════════════════════════════════════════════
   CONFIG — TYPE DEFINITIONS
═══════════════════════════════════════════════════ */
const ALL_TYPES = ['doodh', 'pani', 'faheem', 'nasra', 'sumaira', 'other'];

const VIEWS = {
    home:    { title: 'Bashir Manzil' },
    doodh:   { title: '🥛 Doodh ka Hisaab' },
    pani:    { title: '💧 Pani ka Hisaab' },
    faheem:  { title: '🤝 Faheem Bhai Hisaab' },
    nasra:   { title: '🧵 Baji Nasra Hisaab' },
    sumaira: { title: '✂️ Sumaira Darzan Hisaab' },
    other:   { title: '📝 Doosra Hisaab' },
    total:   { title: '📊 Total Hisaab' }
};

/* ── Helper: make a Darzan-type config for nasra or sumaira ── */
function makeDarzanConfig(type) {
    const META = {
        nasra:   { emoji: '🧵', label: 'Baji Nasra',      accent: 'accent-nasra',   color: 'var(--c-nasra)',   soft: 'var(--c-nasra-soft)' },
        sumaira: { emoji: '✂️', label: 'Sumaira Darzan',  accent: 'accent-sumaira', color: 'var(--c-sumaira)', soft: 'var(--c-sumaira-soft)' }
    };
    const m = META[type];
    return {
        emoji: m.emoji, label: m.label,
        accent: m.accent, color: m.color, soft: m.soft,
        valueFields: [`${type}-qty`, `${type}-item`, `${type}-rate`, `${type}-stitch`, `${type}-suits`],
        resetFields: [`${type}-qty`, `${type}-item`, `${type}-rate`, `${type}-stitch`, `${type}-suits`],
        hasAmount: true,
        getDetail: e => {
            const darzanTotal = round2(e.qty * e.rate);
            const stitchTotal = (e.stitchCost || 0) * (e.numSuits || 0);
            return `${esc(e.item)} — ${e.qty} Drz × Rs ${fmtNum(e.rate)} = Rs ${fmtNum(darzanTotal)}` +
                   (stitchTotal ? ` + Stitching Rs ${fmtNum(stitchTotal)} = <strong>Rs ${fmtNum(darzanTotal + stitchTotal)}</strong>` : '');
        },
        getMonthSummary: entries => `Rs ${fmtNum(entries.reduce((s, e) => s + (e.total || 0), 0))}`,
        getHomeMetaLine: entries => {
            const thisMonth = getThisMonthKey();
            const m = entries.filter(e => e.date.slice(0, 7) === thisMonth);
            return m.length ? `Rs ${fmtNum(m.reduce((s, e) => s + (e.total || 0), 0))} this month` : `${entries.length} entries`;
        },
        buildEntry: vals => {
            const qty        = parseFloat(vals[`${type}-qty`]);
            const rate       = parseFloat(vals[`${type}-rate`]);
            const stitchCost = parseFloat(vals[`${type}-stitch`]) || 0;
            const numSuits   = parseInt(vals[`${type}-suits`], 10) || 0;
            const darzanTotal = round2(qty * rate);
            const stitchTotal = stitchCost * numSuits;
            return {
                date: vals[`${type}-date`],
                item: vals[`${type}-item`].trim(),
                qty, rate, stitchCost, numSuits,
                total: darzanTotal + stitchTotal
            };
        },
        editFields: entry => `
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="edit-date" value="${entry.date}" required>
                </div>
                <div class="form-group">
                    <label>Darzans</label>
                    <input type="number" step="0.5" min="0.5" id="edit-qty" value="${entry.qty}" required inputmode="decimal">
                </div>
            </div>
            <div class="form-group">
                <label>Item Name</label>
                <input type="text" id="edit-item" value="${esc(entry.item)}" required autocomplete="off">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Rate/Darzan (Rs)</label>
                    <input type="number" step="1" min="1" id="edit-rate" value="${entry.rate}" required inputmode="numeric">
                </div>
                <div class="form-group">
                    <label>Stitching/Suit (Rs)</label>
                    <input type="number" step="1" min="0" id="edit-stitch" value="${entry.stitchCost || 0}" required inputmode="numeric">
                </div>
            </div>
            <div class="form-group">
                <label>No. of Suits</label>
                <input type="number" step="1" min="0" id="edit-suits" value="${entry.numSuits || 0}" required inputmode="numeric">
            </div>`,
        readEdit: () => {
            const qty        = parseFloat(val('edit-qty'));
            const rate       = parseFloat(val('edit-rate'));
            const stitchCost = parseFloat(val('edit-stitch')) || 0;
            const numSuits   = parseInt(val('edit-suits'), 10) || 0;
            return { date: val('edit-date'), item: val('edit-item').trim(), qty, rate, stitchCost, numSuits,
                     total: round2(qty * rate) + stitchCost * numSuits };
        },
        totalAmount: entries => entries.reduce((s, e) => s + (e.total || 0), 0),
        totalLabel:  entries => `Rs ${fmtNum(entries.reduce((s, e) => s + (e.total || 0), 0))} — ${entries.length} entries`,
    };
}

const TYPE_CONFIG = {
    doodh: {
        emoji: '🥛', label: 'Doodh',
        accent: 'accent-doodh',
        color: 'var(--c-doodh)', soft: 'var(--c-doodh-soft)',
        valueFields: ['doodh-litres', 'doodh-price'],
        resetFields: ['doodh-litres', 'doodh-price'],
        hasAmount: true,
        getDetail: e => {
            if (e.pricePerLitre) return `${e.litres} L × Rs ${fmtNum(e.pricePerLitre)} = <strong>Rs ${fmtNum(e.totalCost)}</strong>`;
            return `${e.litres} Litre${e.litres !== 1 ? 's' : ''}`;
        },
        getMonthSummary: entries => {
            const totalCost = round2(entries.reduce((s, e) => s + (e.totalCost || 0), 0));
            return totalCost ? `Rs ${fmtNum(totalCost)}` : `${round2(entries.reduce((s, e) => s + e.litres, 0))} L`;
        },
        getHomeMetaLine: entries => {
            const thisMonth = getThisMonthKey();
            const m = entries.filter(e => e.date.slice(0, 7) === thisMonth);
            if (!m.length) return `${entries.length} entries`;
            const cost = round2(m.reduce((s, e) => s + (e.totalCost || 0), 0));
            return cost ? `Rs ${fmtNum(cost)} this month` : `${round2(m.reduce((s, e) => s + e.litres, 0))} L this month`;
        },
        buildEntry: vals => {
            const litres       = parseFloat(vals['doodh-litres']);
            const pricePerLitre = parseFloat(vals['doodh-price']);
            return { date: vals['doodh-date'], litres, pricePerLitre, totalCost: round2(litres * pricePerLitre) };
        },
        editFields: entry => `
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="edit-date" value="${entry.date}" required>
                </div>
                <div class="form-group">
                    <label>Litres</label>
                    <input type="number" step="0.5" min="0.5" id="edit-litres" value="${entry.litres}" required inputmode="decimal">
                </div>
            </div>
            <div class="form-group">
                <label>Price per Litre (Rs)</label>
                <input type="number" step="1" min="1" id="edit-price" value="${entry.pricePerLitre || ''}" required inputmode="numeric">
            </div>`,
        readEdit: () => {
            const litres        = parseFloat(val('edit-litres'));
            const pricePerLitre = parseFloat(val('edit-price'));
            return { date: val('edit-date'), litres, pricePerLitre, totalCost: round2(litres * pricePerLitre) };
        },
        totalAmount: entries => round2(entries.reduce((s, e) => s + (e.totalCost || 0), 0)),
        totalLabel:  entries => {
            const litres = round2(entries.reduce((s, e) => s + e.litres, 0));
            const cost   = round2(entries.reduce((s, e) => s + (e.totalCost || 0), 0));
            return `${litres} L — Rs ${fmtNum(cost)} total`;
        },
    },

    pani: {
        emoji: '💧', label: 'Pani',
        accent: 'accent-pani',
        color: 'var(--c-pani)', soft: 'var(--c-pani-soft)',
        valueFields: ['pani-cans'],
        resetFields: ['pani-cans'],
        hasAmount: true,
        getDetail: e => {
            if (e.pricePerCan) return `${e.cans} Can${e.cans !== 1 ? 's' : ''} × Rs ${e.pricePerCan} = <strong>Rs ${fmtNum(e.totalCost)}</strong>`;
            return `${e.cans} ${e.cans === 1 ? 'Can' : 'Cans'}`;
        },
        getMonthSummary: entries => {
            const cost = entries.reduce((s, e) => s + (e.totalCost || 0), 0);
            return cost ? `Rs ${fmtNum(cost)}` : `${entries.reduce((s, e) => s + e.cans, 0)} cans`;
        },
        getHomeMetaLine: entries => {
            const thisMonth = getThisMonthKey();
            const m = entries.filter(e => e.date.slice(0, 7) === thisMonth);
            if (!m.length) return `${entries.length} entries`;
            const cost = m.reduce((s, e) => s + (e.totalCost || 0), 0);
            return cost ? `Rs ${fmtNum(cost)} this month` : `${m.reduce((s, e) => s + e.cans, 0)} cans this month`;
        },
        buildEntry: vals => {
            const cans       = parseInt(vals['pani-cans'], 10);
            const pricePerCan = parseInt(document.getElementById('pani-price')?.value || '40', 10);
            return { date: vals['pani-date'], cans, pricePerCan, totalCost: cans * pricePerCan };
        },
        editFields: entry => `
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="edit-date" value="${entry.date}" required>
                </div>
                <div class="form-group">
                    <label>Cans</label>
                    <input type="number" step="1" min="1" id="edit-cans" value="${entry.cans}" required inputmode="numeric">
                </div>
            </div>
            <div class="form-group">
                <label>Price per Can</label>
                <select id="edit-pani-price" class="form-select">
                    <option value="30" ${(entry.pricePerCan||40) == 30 ? 'selected' : ''}>Rs 30 per can</option>
                    <option value="40" ${(entry.pricePerCan||40) == 40 ? 'selected' : ''}>Rs 40 per can</option>
                    <option value="70" ${(entry.pricePerCan||40) == 70 ? 'selected' : ''}>Rs 70 per can</option>
                </select>
            </div>`,
        readEdit: () => {
            const cans        = parseInt(val('edit-cans'), 10);
            const pricePerCan = parseInt(document.getElementById('edit-pani-price').value, 10);
            return { date: val('edit-date'), cans, pricePerCan, totalCost: cans * pricePerCan };
        },
        totalAmount: entries => entries.reduce((s, e) => s + (e.totalCost || 0), 0),
        totalLabel:  entries => {
            const cans = entries.reduce((s, e) => s + e.cans, 0);
            const cost = entries.reduce((s, e) => s + (e.totalCost || 0), 0);
            return `${cans} cans — Rs ${fmtNum(cost)} total`;
        },
    },

    faheem: {
        emoji: '🤝', label: 'Faheem Bhai',
        accent: 'accent-faheem',
        color: 'var(--c-faheem)', soft: 'var(--c-faheem-soft)',
        valueFields: ['faheem-amount', 'faheem-desc'],
        resetFields: ['faheem-amount', 'faheem-desc', 'faheem-note'],
        hasAmount: true,
        getDetail: e => `${esc(e.desc)} — Rs ${fmtNum(e.amount)}`,
        getMonthSummary: entries => `Rs ${fmtNum(entries.reduce((s, e) => s + e.amount, 0))}`,
        getHomeMetaLine: entries => {
            const thisMonth = getThisMonthKey();
            const m = entries.filter(e => e.date.slice(0, 7) === thisMonth);
            return m.length ? `Rs ${fmtNum(m.reduce((s, e) => s + e.amount, 0))} this month` : `${entries.length} entries`;
        },
        buildEntry: vals => ({
            date: vals['faheem-date'],
            desc: vals['faheem-desc'].trim(),
            amount: parseFloat(vals['faheem-amount']),
            type: document.querySelector('input[name="faheem-type"]:checked')?.value || 'diya',
            note: vals['faheem-note']?.trim() || ''
        }),
        editFields: entry => `
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="edit-date" value="${entry.date}" required>
                </div>
                <div class="form-group">
                    <label>Amount (Rs)</label>
                    <input type="number" step="1" min="1" id="edit-amount" value="${entry.amount}" required inputmode="numeric">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="edit-desc" value="${esc(entry.desc)}" required autocomplete="off">
            </div>
            <div class="form-group">
                <label>Type</label>
                <div class="toggle-group">
                    <input type="radio" id="edit-type-diya" name="edit-faheem-type" value="diya" ${entry.type === 'diya' ? 'checked' : ''}>
                    <label for="edit-type-diya" class="toggle-option toggle-diya">💸 Diya (Given)</label>
                    <input type="radio" id="edit-type-liya" name="edit-faheem-type" value="liya" ${entry.type === 'liya' ? 'checked' : ''}>
                    <label for="edit-type-liya" class="toggle-option toggle-liya">💰 Liya (Received)</label>
                </div>
            </div>
            <div class="form-group">
                <label>Note <span class="optional">(Optional)</span></label>
                <input type="text" id="edit-note" value="${esc(entry.note || '')}" autocomplete="off">
            </div>`,
        readEdit: () => ({
            date: val('edit-date'),
            desc: val('edit-desc').trim(),
            amount: parseFloat(val('edit-amount')),
            type: document.querySelector('input[name="edit-faheem-type"]:checked')?.value || 'diya',
            note: val('edit-note').trim()
        }),
        totalAmount: entries => entries.reduce((s, e) => s + e.amount, 0),
        totalLabel:  entries => `Rs ${fmtNum(entries.reduce((s, e) => s + e.amount, 0))} — ${entries.length} entries`,
    },

    nasra:   makeDarzanConfig('nasra'),
    sumaira: makeDarzanConfig('sumaira'),

    other: {
        emoji: '📝', label: 'Doosra Kharcha',
        accent: 'accent-other',
        color: 'var(--c-other)', soft: 'var(--c-other-soft)',
        valueFields: ['other-amount', 'other-name'],
        resetFields: ['other-name', 'other-amount', 'other-note'],
        hasAmount: true,
        getDetail: e => `${esc(e.name)} — Rs ${fmtNum(e.amount)}`,
        getMonthSummary: entries => `Rs ${fmtNum(entries.reduce((s, e) => s + e.amount, 0))}`,
        getHomeMetaLine: entries => {
            const thisMonth = getThisMonthKey();
            const m = entries.filter(e => e.date.slice(0, 7) === thisMonth);
            return m.length ? `Rs ${fmtNum(m.reduce((s, e) => s + e.amount, 0))} this month` : `${entries.length} entries`;
        },
        buildEntry: vals => ({
            date: vals['other-date'],
            name: vals['other-name'].trim(),
            amount: parseFloat(vals['other-amount']),
            note: vals['other-note']?.trim() || ''
        }),
        editFields: entry => `
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="edit-date" value="${entry.date}" required>
                </div>
                <div class="form-group">
                    <label>Amount (Rs)</label>
                    <input type="number" step="1" min="1" id="edit-amount" value="${entry.amount}" required inputmode="numeric">
                </div>
            </div>
            <div class="form-group">
                <label>Expense Name</label>
                <input type="text" id="edit-name" value="${esc(entry.name)}" required autocomplete="off">
            </div>
            <div class="form-group">
                <label>Note <span class="optional">(Optional)</span></label>
                <input type="text" id="edit-note" value="${esc(entry.note || '')}" autocomplete="off">
            </div>`,
        readEdit: () => ({
            date: val('edit-date'),
            name: val('edit-name').trim(),
            amount: parseFloat(val('edit-amount')),
            note: val('edit-note').trim()
        }),
        totalAmount: entries => entries.reduce((s, e) => s + e.amount, 0),
        totalLabel:  entries => `Rs ${fmtNum(entries.reduce((s, e) => s + e.amount, 0))} — ${entries.length} entries`,
    }
};

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
const state = {
    currentView: 'home',
    editingId: null,
    editingType: null,
    pendingDeleteId: null,
    pendingDeleteType: null,
    totalMonth: null,
    data: Object.fromEntries(ALL_TYPES.map(t => [t, loadData(`bmh_${t}`)]))
};

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function loadData(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
}

let _saveTimer = null;
function saveToLocal(type) {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        localStorage.setItem(`bmh_${type}`, JSON.stringify(state.data[type]));
    }, 80);
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function getTodayString() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

function getThisMonthKey() { return getTodayString().slice(0, 7); }

function formatMonthLabel(yyyymm) {
    const [y, m] = yyyymm.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function formatDateDisplay(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
}

function round2(n) { return Math.round(n * 100) / 100; }
function fmtNum(n) { return Number(n).toLocaleString(); }
function esc(s = '') { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function val(id) { return document.getElementById(id)?.value ?? ''; }

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
let _toastTimer = null;
function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.classList.add('hidden'), 250);
    }, 2400);
}

/* ═══════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════ */
const app = {

    // ──────────────────── INIT ────────────────────

    init() {
        const today = getTodayString();
        ALL_TYPES.forEach(t => {
            const el = document.getElementById(`${t}-date`);
            if (el) el.value = today;
        });

        // Unified form submit listeners
        ALL_TYPES.forEach(type => {
            const form = document.getElementById(`form-${type}`);
            if (form) form.addEventListener('submit', e => { e.preventDefault(); this.handleAdd(type); });
        });

        // Live calculators
        ['doodh-litres', 'doodh-price'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateSimpleCalc('doodh'));
        });
        ['pani-cans'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateSimpleCalc('pani'));
        });
        document.getElementById('pani-price')?.addEventListener('change', () => this.updateSimpleCalc('pani'));

        ['nasra-qty', 'nasra-rate', 'nasra-stitch', 'nasra-suits'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateDarzanCalc('nasra'));
        });
        ['sumaira-qty', 'sumaira-rate', 'sumaira-stitch', 'sumaira-suits'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateDarzanCalc('sumaira'));
        });

        // Edit form
        document.getElementById('form-edit').addEventListener('submit', e => { e.preventDefault(); this.saveEdit(); });

        // Delete confirm
        document.getElementById('confirm-delete-btn').addEventListener('click', () => this.confirmDelete());

        // Total page default month
        state.totalMonth = getThisMonthKey();

        this.renderAllLists();
        this.updateHomeCards();

        // Supabase background sync
        if (typeof db !== 'undefined' && db.isEnabled()) {
            this._syncFromCloud();
        }
    },

    // ──────────────────── CLOUD SYNC ──────────────

    async _syncFromCloud() {
        let changed = false;
        for (const type of ALL_TYPES) {
            const merged = await db.syncType(type, state.data[type]);
            if (merged !== null) {
                state.data[type] = merged;
                saveToLocal(type);
                changed = true;
            }
        }
        if (changed) {
            this.renderAllLists();
            this.updateHomeCards();
            if (state.currentView === 'total') this.renderTotal();
        }
    },

    // ──────────────────── NAVIGATION ─────────────

    navigate(viewId) {
        const cur = document.getElementById(`view-${state.currentView}`);
        if (cur) { cur.classList.remove('active'); cur.classList.add('hidden'); }

        const target = document.getElementById(`view-${viewId}`);
        target.classList.remove('hidden');
        requestAnimationFrame(() => target.classList.add('active'));

        document.getElementById('page-title').textContent = VIEWS[viewId].title;

        const backBtn = document.getElementById('back-btn');
        if (viewId === 'home') {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
            backBtn.onclick = () => this.navigate('home');
        }

        state.currentView = viewId;
        window.scrollTo({ top: 0, behavior: 'instant' });

        if (viewId === 'total') this.renderTotal();
    },

    // ──────────────────── HOME CARD META ──────────

    updateHomeCards() {
        ALL_TYPES.forEach(type => {
            const el = document.getElementById(`meta-${type}`);
            if (!el) return;
            const entries = state.data[type];
            if (entries.length === 0) { el.textContent = 'No entries'; return; }
            el.textContent = TYPE_CONFIG[type].getHomeMetaLine(entries);
        });
    },

    // ──────────────────── LIVE CALCULATORS ────────

    updateSimpleCalc(type) {
        if (type === 'doodh') {
            const litres = parseFloat(document.getElementById('doodh-litres')?.value) || 0;
            const price  = parseFloat(document.getElementById('doodh-price')?.value)  || 0;
            const disp   = document.getElementById('doodh-total-display');
            if (disp) disp.textContent = (litres && price) ? `Total: Rs ${fmtNum(round2(litres * price))}` : 'Total: Rs —';
        } else if (type === 'pani') {
            const cans  = parseInt(document.getElementById('pani-cans')?.value)  || 0;
            const price = parseInt(document.getElementById('pani-price')?.value) || 0;
            const disp  = document.getElementById('pani-total-display');
            if (disp) disp.textContent = (cans && price) ? `Total: Rs ${fmtNum(cans * price)}` : 'Total: Rs —';
        }
    },

    updateDarzanCalc(type) {
        const qty        = parseFloat(document.getElementById(`${type}-qty`)?.value)   || 0;
        const rate       = parseFloat(document.getElementById(`${type}-rate`)?.value)  || 0;
        const stitch     = parseFloat(document.getElementById(`${type}-stitch`)?.value)|| 0;
        const suits      = parseInt(document.getElementById(`${type}-suits`)?.value)   || 0;
        const darzanTotal = round2(qty * rate);
        const stitchTotal = stitch * suits;
        const grand       = darzanTotal + stitchTotal;

        const dDisp = document.getElementById(`${type}-darzan-display`);
        const tDisp = document.getElementById(`${type}-total-display`);
        if (dDisp) dDisp.textContent = (qty && rate) ? `Rs ${fmtNum(darzanTotal)}` : 'Rs —';
        if (tDisp) tDisp.textContent = grand > 0 ? `Grand Total: Rs ${fmtNum(grand)}` : 'Grand Total: Rs —';
    },

    // ──────────────────── ADD ENTRIES ─────────────

    handleAdd(type) {
        const cfg  = TYPE_CONFIG[type];
        const vals = {};

        // Date
        const dateEl = document.getElementById(`${type}-date`);
        if (!dateEl.value) { dateEl.classList.add('input-error'); dateEl.focus(); return; }
        dateEl.classList.remove('input-error');
        vals[`${type}-date`] = dateEl.value;

        // Value fields
        for (const id of cfg.valueFields) {
            const el = document.getElementById(id);
            if (!el) continue;
            if (el.required !== false && !el.value.trim()) {
                el.classList.add('input-error'); el.focus(); return;
            }
            el.classList.remove('input-error');
            vals[id] = el.value;
        }

        // Optional fields (in resetFields but not valueFields)
        cfg.resetFields.filter(id => !cfg.valueFields.includes(id))
            .forEach(id => { vals[id] = document.getElementById(id)?.value ?? ''; });

        const entry = { id: generateId(), ...cfg.buildEntry(vals) };
        state.data[type].push(entry);
        saveToLocal(type);
        this.renderList(type);
        this.updateHomeCards();

        // Reset fields
        cfg.resetFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Reset calc displays
        if (type === 'doodh') this.updateSimpleCalc('doodh');
        if (type === 'pani')  this.updateSimpleCalc('pani');
        if (type === 'nasra')   this.updateDarzanCalc('nasra');
        if (type === 'sumaira') this.updateDarzanCalc('sumaira');

        // Cloud sync
        if (typeof db !== 'undefined') db.insert(type, entry);

        showToast('✅ Entry saved!');
    },

    // ──────────────────── RENDER LISTS ────────────

    renderAllLists() { ALL_TYPES.forEach(t => this.renderList(t)); },

    renderList(type) {
        const container = document.getElementById(`entries-${type}`);
        if (!container) return;
        const cfg     = TYPE_CONFIG[type];
        const entries = [...state.data[type]].sort((a, b) => b.date.localeCompare(a.date));

        if (entries.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="e-icon">📭</div><p>No entries yet. Add one above!</p></div>`;
            return;
        }

        const grouped = new Map();
        for (const e of entries) {
            const mk = e.date.slice(0, 7);
            if (!grouped.has(mk)) grouped.set(mk, []);
            grouped.get(mk).push(e);
        }

        container.innerHTML = [...grouped.entries()].map(([mk, monthEntries]) => `
            <div class="month-group">
                <div class="month-header">
                    <h3 class="month-title">${formatMonthLabel(mk)}</h3>
                    <span class="month-total">${cfg.getMonthSummary(monthEntries)}</span>
                </div>
                <div class="entry-list">
                    ${monthEntries.map(e => this._entryHTML(type, e, cfg)).join('')}
                </div>
            </div>`).join('');
    },

    _entryHTML(type, entry, cfg) {
        const detail   = cfg.getDetail(entry);
        const noteHtml = entry.note ? `<div class="entry-note">${esc(entry.note)}</div>` : '';
        const badgeHtml = (type === 'faheem' && entry.type)
            ? `<span class="entry-badge badge-${entry.type}">${entry.type === 'diya' ? '💸 Diya' : '💰 Liya'}</span>` : '';

        return `
            <div class="entry-item">
                <div class="entry-accent-bar ${cfg.accent}"></div>
                <div class="entry-info">
                    <div class="entry-date">${formatDateDisplay(entry.date)}</div>
                    <div class="entry-detail">${detail}</div>
                    ${badgeHtml}${noteHtml}
                </div>
                <div class="entry-actions">
                    <button class="icon-btn edit-btn" onclick="app.openEditModal('${type}','${entry.id}')" aria-label="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button class="icon-btn delete-btn" onclick="app.openDeleteModal('${type}','${entry.id}')" aria-label="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>`;
    },

    // ──────────────────── DELETE ──────────────────

    openDeleteModal(type, id) {
        state.pendingDeleteType = type;
        state.pendingDeleteId   = id;
        document.getElementById('delete-modal').classList.remove('hidden');
    },
    closeDeleteModal() {
        document.getElementById('delete-modal').classList.add('hidden');
        state.pendingDeleteType = null;
        state.pendingDeleteId   = null;
    },
    confirmDelete() {
        const { pendingDeleteType: type, pendingDeleteId: id } = state;
        if (!type || !id) return;
        state.data[type] = state.data[type].filter(e => e.id !== id);
        saveToLocal(type);
        this.renderList(type);
        this.updateHomeCards();
        if (state.currentView === 'total') this.renderTotal();
        this.closeDeleteModal();
        if (typeof db !== 'undefined') db.delete(type, id);
        showToast('🗑️ Entry deleted');
    },

    // ──────────────────── EDIT ────────────────────

    openEditModal(type, id) {
        const entry = state.data[type].find(e => e.id === id);
        if (!entry) return;
        state.editingId   = id;
        state.editingType = type;
        document.getElementById('edit-fields').innerHTML = TYPE_CONFIG[type].editFields(entry);
        document.getElementById('edit-modal').classList.remove('hidden');
    },
    closeEditModal() {
        document.getElementById('edit-modal').classList.add('hidden');
        state.editingId   = null;
        state.editingType = null;
    },
    saveEdit() {
        const { editingType: type, editingId: id } = state;
        const idx = state.data[type].findIndex(e => e.id === id);
        if (idx === -1) return;
        const updates = TYPE_CONFIG[type].readEdit();
        state.data[type][idx] = { ...state.data[type][idx], ...updates };
        saveToLocal(type);
        this.renderList(type);
        this.updateHomeCards();
        if (state.currentView === 'total') this.renderTotal();
        this.closeEditModal();
        if (typeof db !== 'undefined') db.update(type, state.data[type][idx]);
        showToast('✅ Entry updated!');
    },

    // ──────────────────── TOTAL HISAAB ────────────

    changeMonth(delta) {
        const [y, m] = state.totalMonth.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        state.totalMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        this.renderTotal();
    },

    renderTotal() {
        const mk = state.totalMonth;
        document.getElementById('total-month-display').textContent = formatMonthLabel(mk);

        const monthData = {};
        ALL_TYPES.forEach(type => {
            monthData[type] = state.data[type].filter(e => e.date.slice(0, 7) === mk);
        });

        const grandTotal = ALL_TYPES
            .filter(t => TYPE_CONFIG[t].hasAmount)
            .reduce((sum, type) => {
                const fn = TYPE_CONFIG[type].totalAmount;
                return sum + (fn ? fn(monthData[type]) : 0);
            }, 0);

        const totalEntries = ALL_TYPES.reduce((s, t) => s + monthData[t].length, 0);

        document.getElementById('total-grand-card').innerHTML = `
            <div class="gt-label">Total Kharcha — ${formatMonthLabel(mk)}</div>
            <div class="gt-amount">Rs ${fmtNum(round2(grandTotal))}</div>
            <div class="gt-sub">${totalEntries} total entries across all categories</div>`;

        if (totalEntries === 0) {
            document.getElementById('total-breakdown').innerHTML = `
                <div class="total-no-data"><div class="e-icon">📭</div><p>No entries found for this month</p></div>`;
            return;
        }

        const maxAmount = Math.max(...ALL_TYPES
            .filter(t => TYPE_CONFIG[t].hasAmount)
            .map(t => { const fn = TYPE_CONFIG[t].totalAmount; return fn ? fn(monthData[t]) : 0; }), 1);

        document.getElementById('total-breakdown').innerHTML = ALL_TYPES.map(type => {
            const cfg     = TYPE_CONFIG[type];
            const entries = monthData[type];
            const amtFn   = cfg.totalAmount;
            const amount  = amtFn ? amtFn(entries) : null;
            const barPct  = (amount && maxAmount) ? Math.round((amount / maxAmount) * 100) : 0;

            return `
                <div class="breakdown-card">
                    <div class="breakdown-icon" style="background:${cfg.soft};color:${cfg.color}">${cfg.emoji}</div>
                    <div class="breakdown-info" style="flex:1">
                        <div class="breakdown-name">${cfg.label}</div>
                        <div class="breakdown-count">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</div>
                        ${cfg.hasAmount ? `
                        <div class="breakdown-bar-wrap">
                            <div class="breakdown-bar" style="width:${barPct}%;background:${cfg.color}"></div>
                        </div>` : ''}
                    </div>
                    <div class="breakdown-amount" style="color:${cfg.color}">
                        ${entries.length === 0
                            ? '<span style="color:var(--text-3);font-weight:500;font-size:.9rem">None</span>'
                            : cfg.totalLabel(entries)}
                    </div>
                </div>`;
        }).join('');
    }
};

/* ═══════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => app.init());
