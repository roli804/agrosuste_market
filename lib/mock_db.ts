import { User, ActivityLog, LogType, UserRole } from '../types';

const USERS_KEY = 'agro_suste_profiles';
const LOGS_KEY = 'agro_suste_activity_logs';

export const mockDb = {
    // --- USERS / PROFILES ---
    getUsers: (): User[] => {
        const data = localStorage.getItem(USERS_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveUser: (user: User) => {
        const users = mockDb.getUsers();
        const index = users.findIndex(u => u.id === user.id || u.email === user.email);
        if (index >= 0) {
            users[index] = { ...users[index], ...user };
        } else {
            users.push(user);
        }
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },

    // --- ACTIVITY LOGS ---
    getLogs: (): ActivityLog[] => {
        const data = localStorage.getItem(LOGS_KEY);
        return data ? JSON.parse(data) : [];
    },

    logActivity: (params: {
        userId: string;
        userName: string;
        userRole: UserRole;
        type: LogType;
        description: string;
        details?: any;
    }) => {
        const logs = mockDb.getLogs();
        const newLog: ActivityLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...params,
            timestamp: new Date().toISOString()
        };
        logs.unshift(newLog); // Newest first
        // Keep only last 200 logs to prevent localStorage bloat
        const truncatedLogs = logs.slice(0, 200);
        localStorage.setItem(LOGS_KEY, JSON.stringify(truncatedLogs));
        console.log(`[Activity Log] ${params.type}: ${params.description}`);
    }
};
