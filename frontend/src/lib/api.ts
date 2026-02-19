const useProd = import.meta.env.VITE_USE_PROD_API === 'True';
const API_URL = useProd ? import.meta.env.VITE_API_URL_LIVE : (import.meta.env.VITE_API_URL_LOCAL || "http://localhost:3000/api");


const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    auth: {
        login: async (credentials: any) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        register: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        getUser: async () => {
            // Since we are moving away from Supabase, we might not have a /user endpoint or it's handled by token
            // For now return null or validation of token?
            // We will store user in localStorage on login
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        },
        signOut: async () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },
    aircrafts: {
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/aircrafts`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        list: async () => {
            const res = await fetch(`${API_URL}/aircrafts`, { headers: getHeaders() });
            return res.json();
        },
        get: async (id: string) => {
            const res = await fetch(`${API_URL}/aircrafts/${id}`, { headers: getHeaders() });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/aircrafts/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        }
    },
    components: {
        list: async () => {
            const res = await fetch(`${API_URL}/components`, { headers: getHeaders() });
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/components`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        }
    },
    aircraftComponents: {
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/aircraft_components`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        getForAircraft: async (id: string) => {
            const res = await fetch(`${API_URL}/aircraft_components/${id}`, { headers: getHeaders() });
            return res.json();
        }
    },
    services: {
        list: async () => {
            const res = await fetch(`${API_URL}/services`, { headers: getHeaders() });
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/services`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        }
    }
};
