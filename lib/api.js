import axios from "axios";

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	withCredentials: true,
});

// Queues concurrent requests while a refresh is in flight instead of letting
// them reject independently (the gap in ESK_FE's hooks/Api.js interceptor).
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error) => {
	pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
	pendingQueue = [];
};

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const { config, response } = error;

		if (!config || response?.status !== 401 || config._retry) {
			return Promise.reject(error);
		}

		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				pendingQueue.push({ resolve, reject });
			}).then(() => api(config));
		}

		config._retry = true;
		isRefreshing = true;

		try {
			await api.post("/auth/refresh-token");
			flushQueue(null);
			return api(config);
		} catch (refreshError) {
			flushQueue(refreshError);
			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	}
);

export default api;
