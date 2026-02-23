const useProd = import.meta.env.VITE_USE_PROD_API === 'True';
const API_URL = useProd ? import.meta.env.VITE_API_URL_LIVE : (import.meta.env.VITE_API_URL_LOCAL || "http://localhost:3000/api");


const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// On 401/403: clear stale auth and redirect to login
const handleUnauthorized = (status: number) => {
    if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
};

const throwIfError = async (res: Response) => {
    if (!res.ok) {
        handleUnauthorized(res.status);
        throw await res.json();
    }
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
            await throwIfError(res);
            return res.json();
        },
        list: async () => {
            const res = await fetch(`${API_URL}/aircrafts`, { headers: getHeaders() });
            await throwIfError(res);
            return res.json();
        },
        get: async (id: string) => {
            const res = await fetch(`${API_URL}/aircrafts/${id}`, { headers: getHeaders() });
            await throwIfError(res);
            return res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/aircrafts/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            await throwIfError(res);
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/aircrafts/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            await throwIfError(res);
            // 204 No Content has no body — return ok flag
            return res.status === 204 ? { ok: true } : res.json();
        }
    },
    components: {
        list: async () => {
            const res = await fetch(`${API_URL}/components`, { headers: getHeaders() });
            await throwIfError(res);
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/components`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            await throwIfError(res);
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/components/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            await throwIfError(res);
            return res.status === 204 ? { ok: true } : res.json();
        }
    },
    aircraftComponents: {
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/aircraft_components`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            await throwIfError(res);
            return res.json();
        },
        getForAircraft: async (id: string) => {
            const res = await fetch(`${API_URL}/aircraft_components/${id}`, { headers: getHeaders() });
            await throwIfError(res);
            return res.json();
        },
        update: async (componentId: string, data: any) => {
            const res = await fetch(`${API_URL}/aircraft_components/${componentId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            await throwIfError(res);
            return res.json();
        },
        delete: async (componentId: string) => {
            const res = await fetch(`${API_URL}/aircraft_components/${componentId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            await throwIfError(res);
            return res.json();
        }
    },
    services: {
        list: async () => {
            const res = await fetch(`${API_URL}/services`, { headers: getHeaders() });
            await throwIfError(res);
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/services`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            await throwIfError(res);
            return res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/services/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            await throwIfError(res);
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/services/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            await throwIfError(res);
            return res.status === 204 ? { ok: true } : res.json();
        }
    },
    scheduler: {
        /** Get all scheduler entries for an aircraft */
        getForAircraft: async (aircraftId: string) => {
            const res = await fetch(`${API_URL}/scheduler/${aircraftId}`, { headers: getHeaders() });
            await throwIfError(res);
            return res.json();
        },
        /** Bulk upload from Excel (array of rows) */
        upload: async (aircraftId: string, rows: any[]) => {
            const res = await fetch(`${API_URL}/scheduler/${aircraftId}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(rows),
            });
            await throwIfError(res);
            return res.json();
        },
        /** Delete a single entry */
        deleteEntry: async (entryId: string) => {
            const res = await fetch(`${API_URL}/scheduler/entry/${entryId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            await throwIfError(res);
            return res.status === 204 ? { ok: true } : res.json();
        },
    },
    forecast: {
        /** Get all forecast records for an aircraft */
        getForAircraft: async (aircraftId: string) => {
            const res = await fetch(`${API_URL}/forecast/${aircraftId}`, { headers: getHeaders() });
            await throwIfError(res);
            return res.json();
        },
        /** Create or update (upsert) a single forecast record */
        save: async (data: any) => {
            const res = await fetch(`${API_URL}/forecast`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            await throwIfError(res);
            return res.json();
        },
        /** Bulk-update avg_hours / avg_cycles + next_date for all services of an aircraft */
        updateAvg: async (aircraftId: string, data: { avg_hours?: number; avg_cycles?: number; updates: { service_id: string; next_date: string }[] }) => {
            const res = await fetch(`${API_URL}/forecast/avg/${aircraftId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            await throwIfError(res);
            return res.json();
        }
    }
};
