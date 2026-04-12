import { User, ActivityLog, LogType, UserRole, DeliveryRequest, DeliveryStatus } from '../types';

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
        window.dispatchEvent(new Event('mock-db-changed'));
    },

    deleteUser: (userId: string) => {
        const users = mockDb.getUsers();
        const filtered = users.filter(u => u.id !== userId);
        localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('mock-db-changed'));
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
    },

    // --- PRODUCTS ---
    getProducts: (): any[] => {
        const data = localStorage.getItem('agro_suste_products');
        return data ? JSON.parse(data) : [];
    },

    saveProduct: (product: any) => {
        const products = mockDb.getProducts();
        const index = products.findIndex((p: any) => p.id === product.id);
        if (index >= 0) {
            products[index] = { ...products[index], ...product };
        } else {
            products.push(product);
        }
        localStorage.setItem('agro_suste_products', JSON.stringify(products));
        window.dispatchEvent(new Event('mock-db-changed'));
    },

    deleteProduct: (productId: string, userId: string, userRole: UserRole): boolean => {
        const products = mockDb.getProducts();
        const product = products.find((p: any) => p.id === productId);
        
        if (!product) return false;

        // RBAC Guard
        if (product.producerId !== userId && userRole !== UserRole.ADMIN) {
            alert('Unauthorized: You do not have permission to delete this product.');
            return false;
        }

        const filtered = products.filter((p: any) => p.id !== productId);
        localStorage.setItem('agro_suste_products', JSON.stringify(filtered));
        window.dispatchEvent(new Event('mock-db-changed'));
        return true;
    },

    // --- DELIVERY REQUESTS ---
    getDeliveryRequests: (): DeliveryRequest[] => {
        const data = localStorage.getItem('agro_suste_delivery_requests');
        return data ? JSON.parse(data) : [];
    },

    saveDeliveryRequest: (request: DeliveryRequest) => {
        const requests = mockDb.getDeliveryRequests();
        const index = requests.findIndex(r => r.id === request.id);
        if (index >= 0) {
            requests[index] = { ...requests[index], ...request };
        } else {
            requests.push(request);
        }
        localStorage.setItem('agro_suste_delivery_requests', JSON.stringify(requests));
        window.dispatchEvent(new Event('mock-db-changed'));
    },

    updateDeliveryStatus: (id: string, status: DeliveryStatus, driverId?: string) => {
        const requests = mockDb.getDeliveryRequests();
        const index = requests.findIndex(r => r.id === id);
        if (index >= 0) {
            requests[index].status = status;
            if (driverId) requests[index].assigned_driver_id = driverId;
            localStorage.setItem('agro_suste_delivery_requests', JSON.stringify(requests));
            window.dispatchEvent(new Event('mock-db-changed'));
            return true;
        }
        return false;
    }
};
