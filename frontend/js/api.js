const API_BASE_URL = "http://localhost:3111/api";
const TOKEN_KEY = "nexattend_token";

const api = {
    currentUser: null,

    async request(endpoint, options = {}) {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Request failed");
        }

        return data;
    },

    async login(email, password) {
        const data = await this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        sessionStorage.setItem(TOKEN_KEY, data.token);
        this.currentUser = data.user;
        return data;
    },

    async register(userObj) {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userObj),
        });
    },

    async getCurrentUser() {
        if (this.currentUser) return this.currentUser;

        const token = sessionStorage.getItem(TOKEN_KEY);
        if (!token) return null;

        try {
            const data = await this.request("/auth/me");
            this.currentUser = data.user;
            return data.user;
        } catch (error) {
            sessionStorage.removeItem(TOKEN_KEY);
            this.currentUser = null;
            return null;
        }
    },

    logout() {
        sessionStorage.removeItem(TOKEN_KEY);
        this.currentUser = null;
        const inPages = window.location.pathname.includes("/pages/");
        window.location.href = inPages ? "../index.html" : "index.html";
    },

    async getUsers() {
        return this.request("/users");
    },

    async getAdminDashboard() {
        return this.request("/admin/dashboard");
    },

    async createUser(payload) {
        return this.request("/users", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async updateUser(userId, payload) {
        return this.request(`/users/${userId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    async deleteUser(userId) {
        return this.request(`/users/${userId}`, {
            method: "DELETE",
        });
    },

    async getStudents() {
        return this.request("/students");
    },

    async getCourses() {
        return this.request("/courses");
    },

    async createCourse(formData) {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: "POST",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || "Request failed");
        }
        return data;
    },

    async downloadCourse(courseId) {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/download`, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Download failed");
        }
        const blob = await response.blob();
        const cd = response.headers.get("Content-Disposition");
        let filename = `course-${courseId}`;
        if (cd) {
            const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)/i.exec(cd);
            if (match && match[1]) {
                filename = decodeURIComponent(match[1].replace(/["']/g, "").trim());
            }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    async getInstructorDashboard() {
        return this.request("/instructor/dashboard");
    },

    async getSessions() {
        return this.request("/sessions");
    },

    async createSession(payload) {
        return this.request("/sessions", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async verifySessionToken(payload) {
        return this.request("/sessions/verify-token", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async closeSession(sessionId) {
        return this.request(`/sessions/${sessionId}/close`, {
            method: "PATCH",
        });
    },

    async markAttendance(payload) {
        return this.request("/attendance/mark", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async markAttendanceByToken(payload) {
        return this.request("/attendance/mark-by-token", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async getAttendanceBySession(sessionId) {
        return this.request(`/attendance/session/${sessionId}`);
    },

    async getAttendanceByStudent(studentId) {
        return this.request(`/attendance/student/${studentId}`);
    },
};

window.api = api;
