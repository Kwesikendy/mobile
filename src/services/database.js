import * as SQLite from 'expo-sqlite';

let db = null;

export const initDatabase = async () => {
    if (db) {
        console.log('Using existing database connection');
        return db;
    }

    try {
        db = await SQLite.openDatabaseAsync('church_members.db');

        // Create members table
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        dob TEXT,
        age INTEGER,
        gender TEXT,
        phone TEXT,
        address TEXT,
        baptized INTEGER,
        waterBaptized INTEGER,
        holyGhostBaptized INTEGER,
        presidingElder TEXT,
        working INTEGER,
        occupation TEXT,
        maritalStatus TEXT,
        childrenCount INTEGER,
        ministry TEXT,
        joinedDate TEXT,
        picture TEXT,
        metadata TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

        // Create form schema cache table
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS form_schema_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER,
        elements TEXT,
        cachedAt TEXT
      );
    `);

        console.log('✅ Database initialized successfully');
        return db;
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
};

export const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
};

// Member CRUD operations
export const saveMember = async (memberData) => {
    const db = getDatabase();
    const id = memberData.id || generateUUID();
    const now = new Date().toISOString();

    try {
        await db.runAsync(
            `INSERT OR REPLACE INTO members (
        id, firstName, lastName, dob, age, gender, phone, address,
        baptized, waterBaptized, holyGhostBaptized, presidingElder,
        working, occupation, maritalStatus, childrenCount, ministry,
        joinedDate, picture, metadata, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                memberData.firstName,
                memberData.lastName,
                memberData.dob || null,
                memberData.age || null,
                memberData.gender || null,
                memberData.phone || null,
                memberData.address || null,
                memberData.baptized ? 1 : 0,
                memberData.waterBaptized ? 1 : 0,
                memberData.holyGhostBaptized ? 1 : 0,
                memberData.presidingElder || null,
                memberData.working ? 1 : 0,
                memberData.occupation || null,
                memberData.maritalStatus || null,
                memberData.childrenCount || null,
                memberData.ministry || null,
                memberData.joinedDate || null,
                memberData.picture || null,
                memberData.metadata ? JSON.stringify(memberData.metadata) : null,
                'pending',
                memberData.createdAt || now,
                now,
            ]
        );

        return { id, ...memberData, createdAt: memberData.createdAt || now, updatedAt: now };
    } catch (error) {
        console.error('Error saving member:', error);
        throw error;
    }
};

export const getPendingMembers = async () => {
    const db = getDatabase();
    try {
        const rows = await db.getAllAsync(
            `SELECT * FROM members WHERE syncStatus = 'pending' ORDER BY createdAt DESC`
        );
        return rows.map(parseMember);
    } catch (error) {
        console.error('Error getting pending members:', error);
        return [];
    }
};

export const getAllMembers = async () => {
    const db = getDatabase();
    try {
        const rows = await db.getAllAsync(`SELECT * FROM members ORDER BY createdAt DESC`);
        return rows.map(parseMember);
    } catch (error) {
        console.error('Error getting all members:', error);
        return [];
    }
};

export const updateMemberSyncStatus = async (id, status) => {
    const db = getDatabase();
    try {
        await db.runAsync(`UPDATE members SET syncStatus = ? WHERE id = ?`, [status, id]);
    } catch (error) {
        console.error('Error updating sync status:', error);
        throw error;
    }
};

export const deleteMember = async (id) => {
    const db = getDatabase();
    try {
        await db.runAsync(`DELETE FROM members WHERE id = ?`, [id]);
    } catch (error) {
        console.error('Error deleting member:', error);
        throw error;
    }
};

// Form schema cache operations
export const cacheFormSchema = async (version, elements) => {
    const db = getDatabase();
    try {
        await db.runAsync(`DELETE FROM form_schema_cache`);
        await db.runAsync(
            `INSERT INTO form_schema_cache (version, elements, cachedAt) VALUES (?, ?, ?)`,
            [version, JSON.stringify(elements), new Date().toISOString()]
        );
    } catch (error) {
        console.error('Error caching form schema:', error);
    }
};

export const getCachedFormSchema = async () => {
    const db = getDatabase();
    try {
        const result = await db.getFirstAsync(`SELECT * FROM form_schema_cache ORDER BY id DESC LIMIT 1`);
        if (result) {
            return {
                version: result.version,
                elements: JSON.parse(result.elements),
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting cached schema:', error);
        return null;
    }
};

// Helper functions
const parseMember = (row) => ({
    ...row,
    baptized: row.baptized === 1,
    waterBaptized: row.waterBaptized === 1,
    holyGhostBaptized: row.holyGhostBaptized === 1,
    working: row.working === 1,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
});

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
