/* ═══════════════════════════════════════════════════════════════
   SUPABASE CLIENT — Bashir Manzil Hisaab
   ───────────────────────────────────────────────────────────────
   HOW TO CONFIGURE:
     1. Go to https://supabase.com → your project → Settings → API
     2. Copy "Project URL" and paste below as SUPABASE_URL
     3. Copy "anon / public" key and paste below as SUPABASE_ANON_KEY
     4. Save this file — the app will automatically sync to cloud.
═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL      = 'https://zkwqylxhrkdzbpnthucx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprd3F5bHhocmtkemJwbnRodWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTY1MzUsImV4cCI6MjA5ODMzMjUzNX0.smHxdVpCfQ06O2OhhBrdy7lcJBOyYvoigmepw7Qbcig';

// ── Internal setup ────────────────────────────────────────────
const _configured = (
    SUPABASE_URL      !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
);

let _client = null;
if (_configured && typeof supabase !== 'undefined') {
    try {
        _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Supabase] Connected to cloud.');
    } catch (e) {
        console.warn('[Supabase] Failed to init client:', e);
    }
} else if (!_configured) {
    console.info('[Supabase] Not configured — running in offline (localStorage) mode.');
}

// ── Public database API ───────────────────────────────────────
// All methods are async. If Supabase is not configured they are
// silent no-ops so the app continues to work purely offline.

const db = {

    /** Returns true when Supabase is connected. */
    isEnabled() { return !!_client; },

    /**
     * Pull all entries of a given type from Supabase.
     * Returns an array of entry objects, or null on error / offline.
     */
    async fetchAll(type) {
        if (!_client) return null;
        try {
            const { data, error } = await _client
                .from('entries')
                .select('id, date, data')
                .eq('type', type)
                .order('date', { ascending: false });

            if (error) throw error;
            // Flatten: merge the `data` JSONB blob into the top-level object
            return data.map(row => ({ id: row.id, date: row.date, ...row.data }));
        } catch (e) {
            console.error('[Supabase] fetchAll error:', e.message);
            return null;
        }
    },

    /**
     * Insert a new entry. `entry` must include `id` and `date`.
     */
    async insert(type, entry) {
        if (!_client) return;
        const { id, date, ...data } = entry;
        try {
            const { error } = await _client
                .from('entries')
                .insert({ id, type, date, data });
            if (error) throw error;
        } catch (e) {
            console.error('[Supabase] insert error:', e.message);
        }
    },

    /**
     * Update an existing entry by id.
     */
    async update(type, entry) {
        if (!_client) return;
        const { id, date, ...data } = entry;
        try {
            const { error } = await _client
                .from('entries')
                .update({ date, data })
                .eq('id', id);
            if (error) throw error;
        } catch (e) {
            console.error('[Supabase] update error:', e.message);
        }
    },

    /**
     * Delete an entry by id.
     */
    async delete(type, id) {
        if (!_client) return;
        try {
            const { error } = await _client
                .from('entries')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } catch (e) {
            console.error('[Supabase] delete error:', e.message);
        }
    },

    /**
     * Sync a single type: fetch from Supabase and merge into local state.
     * Cloud data wins for conflicts (same id -> cloud version is used).
     * Returns the merged array, or null if offline.
     */
    async syncType(type, localEntries) {
        const cloudEntries = await this.fetchAll(type);
        if (cloudEntries === null) return null; // offline, keep local

        // Build maps by id
        const cloudMap = new Map(cloudEntries.map(e => [e.id, e]));
        const localMap = new Map(localEntries.map(e => [e.id, e]));

        // Push any local-only entries up to cloud
        for (const [id, entry] of localMap) {
            if (!cloudMap.has(id)) {
                await this.insert(type, entry);
                cloudMap.set(id, entry);
            }
        }

        // Return cloud version as source of truth
        return cloudEntries;
    }
};
