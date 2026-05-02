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

    /** POST /api/courses/enroll (alias: POST /api/enroll) */
    async enrollCourse(courseId) {
        const id = Number(courseId);
        const data = await this.request("/courses/enroll", {
            method: "POST",
            body: JSON.stringify({ courseId: id }),
        });
        try {
            const raw = JSON.parse(localStorage.getItem("enrolledCoursesFallback") || "[]");
            const set = new Set(Array.isArray(raw) ? raw.map(Number) : []);
            set.add(id);
            localStorage.setItem("enrolledCoursesFallback", JSON.stringify([...set]));
        } catch (_) {
            /* ignore storage */
        }
        return data;
    },

    /** GET /api/courses/saved-courses (alias: GET /api/saved-courses) */
    async getSavedCourses() {
        try {
            const data = await this.request("/courses/saved-courses");
            let courses = data.courses ?? data.savedCourses ?? [];
            if (!Array.isArray(courses)) courses = [];
            return { courses };
        } catch (_) {
            return { courses: [] };
        }
    },

    /** Submit session QR/token — uses current student id from auth. */
    async verifyToken(token) {
        const user = await this.getCurrentUser();
        if (!user?.user_id) {
            throw new Error("You must be logged in");
        }
        const t = typeof token === "string" ? token.trim() : String(token ?? "").trim();
        return this.verifySessionToken({
            token: t,
            studentId: user.user_id,
        });
    },

    /** Current student's attendance rows from GET /api/attendance/student/:id */
    async getAttendance() {
        const user = await this.getCurrentUser();
        if (!user?.user_id) {
            throw new Error("You must be logged in");
        }
        return this.getAttendanceByStudent(user.user_id);
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
