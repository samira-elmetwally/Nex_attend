/**
 * Admin Dashboard Logic - NexAttend
 */

document.addEventListener('DOMContentLoaded', () => {
    const initAdminPage = async () => {
    const user = await window.api.getCurrentUser();
    if (!user || user.role !== 'Admin') {
        window.location.href = '../index.html';
        return;
    }
    let cache = { users: [], courses: [], sessions: [], instructors: [], stats: {} };

    async function refreshCache() {
        const dashboardData = await window.api.getAdminDashboard();
        cache.users = dashboardData.users || [];
        cache.courses = dashboardData.courses || [];
        cache.sessions = dashboardData.sessions || [];
        cache.instructors = dashboardData.instructors || [];
        cache.stats = dashboardData.stats || {};
    }

    function setLoadingState() {
        document.getElementById('statStudents').textContent = '...';
        document.getElementById('statInstructors').textContent = '...';
        document.getElementById('statCourses').textContent = '...';
        document.getElementById('statSessions').textContent = '...';

        const usersTableBody = document.querySelector('#usersTable tbody');
        if (usersTableBody) {
            usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
        }

        const coursesTableBody = document.querySelector('#coursesTable tbody');
        if (coursesTableBody) {
            coursesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
        }
    }

    const deptMap = { 0: 'Administration', 1: 'Computer Science', 2: 'Information Systems' };

    // Initial Header Load
    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar) {
        navAvatar.textContent = user.name.substring(0, 2).toUpperCase();
    }

    // ── Navigation ──────────────────────────────────────
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.tab-view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            item.classList.add('active');
            const viewId = 'view-' + item.dataset.view;
            const target = document.getElementById(viewId);
            if (target) {
                target.classList.add('active');
                if (item.dataset.view === 'dashboard') loadDashboard();
                if (item.dataset.view === 'users') loadUsers();
                if (item.dataset.view === 'courses') loadCourses();
                if (item.dataset.view === 'settings') loadSettings();
            }
        });
    });

    // ── Logout ──────────────────────────────────────────
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Logout from Admin panel?')) window.api.logout();
    });

    // ── DASHBOARD ────────────────────────────────────────
    function loadDashboard() {
        document.getElementById('statStudents').textContent = cache.stats.students ?? 0;
        document.getElementById('statInstructors').textContent = cache.stats.instructors ?? 0;
        document.getElementById('statCourses').textContent = cache.stats.courses ?? 0;
        document.getElementById('statSessions').textContent = cache.stats.sessions ?? 0;
    }

    // ── MANAGE USERS ─────────────────────────────────────
    function loadUsers() {
        const users = cache.users;
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${u.user_id}</td>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.role.toLowerCase()}">${u.role}</span></td>
                <td>${deptMap[u.department_id] || 'N/A'}</td>
                <td>
                    <button class="btn-outline" style="padding:5px 10px;font-size:12px;" onclick="window.editUser(${u.user_id})">Edit</button>
                    <button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="window.deleteUser(${u.user_id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.editUser = (userId) => {
        const users = cache.users;
        const u = users.find(localUser => localUser.user_id === userId);
        if (!u) return;

        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('editUserId').value = u.user_id;
        document.getElementById('editName').value = u.name;
        document.getElementById('editEmail').value = u.email;
        document.getElementById('editRole').value = u.role;
        document.getElementById('editDept').value = u.department_id;

        document.getElementById('userModal').style.display = 'flex';
    };

    document.getElementById('addUserBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Add New User';
        document.getElementById('editUserId').value = '';
        document.getElementById('editName').value = '';
        document.getElementById('editEmail').value = '';
        document.getElementById('editRole').value = 'Student';
        document.getElementById('editDept').value = '1';

        document.getElementById('userModal').style.display = 'flex';
    });

    document.getElementById('saveUserBtn').addEventListener('click', async () => {
        const id = document.getElementById('editUserId').value;
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const role = document.getElementById('editRole').value;
        const dept = parseInt(document.getElementById('editDept').value);

        if (!name || !email) { alert('Please fill all fields'); return; }

        try {
            if (id) {
                await window.api.updateUser(Number(id), { name, email, role, departmentId: dept });
            } else {
                await window.api.createUser({ name, email, role, departmentId: dept, password: '123456' });
            }
            await refreshCache();
            document.getElementById('userModal').style.display = 'none';
            loadUsers();
            loadDashboard();
        } catch (error) {
            alert(error.message);
        }
    });

    window.deleteUser = async (userId) => {
        if (userId === user.user_id) { alert('You cannot delete your own account!'); return; }
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await window.api.deleteUser(userId);
                await refreshCache();
                loadUsers();
                loadDashboard();
                loadCourses();
            } catch (error) {
                alert(error.message || 'Failed to delete user');
            }
        }
    };

    // ── SYSTEM COURSES ───────────────────────────────────
    function loadCourses() {
        const courses = cache.courses;
        const users = cache.users;
        const sessions = cache.sessions;
        const tbody = document.querySelector('#coursesTable tbody');
        tbody.innerHTML = '';

        courses.forEach(c => {
            const instructor = cache.instructors.find(u => u.user_id === c.instructor_id) || users.find(u => u.user_id === c.instructor_id);
            const courseSessions = sessions.filter(s => s.course_id === c.id);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${c.id}</td>
                <td><strong>${c.name}</strong></td>
                <td>${instructor ? instructor.name : 'Unknown'}</td>
                <td>${deptMap[c.department_id] || 'N/A'}</td>
                <td>${courseSessions.length} Sessions</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ── SETTINGS ─────────────────────────────────────────
    async function loadSettings() {
        const freshUser = await window.api.getCurrentUser();
        document.getElementById('adminName').value = freshUser.name;
        document.getElementById('adminEmail').value = freshUser.email;
        document.getElementById('settingName').textContent = freshUser.name;
        
        // Load Avatar
        const navAvatar = document.getElementById('navAvatar');
        const settingAvatar = document.getElementById('settingAvatar');
        [navAvatar, settingAvatar].forEach(el => {
            if (!el) return;
            el.textContent = freshUser.name.substring(0, 2).toUpperCase();
        });
    }

    // Avatar change triggers
    document.getElementById('settingAvatar')?.addEventListener('click', () => {});

    document.getElementById('saveAdminSettings').addEventListener('click', async () => {
        const name = document.getElementById('adminName').value.trim();
        const email = document.getElementById('adminEmail').value.trim();
        const pass = document.getElementById('adminPass').value;

        if (!name || !email) return;

        await window.api.updateUser(user.user_id, { name, email, password: pass || undefined });
        window.api.currentUser = { ...window.api.currentUser, name, email };
        await refreshCache();
        await loadSettings();

        const btn = document.getElementById('saveAdminSettings');
        btn.textContent = '✓ Saved';
        setTimeout(() => btn.textContent = 'Save Changes', 2000);
    });

    // Initial load
    setLoadingState();
    try {
        await refreshCache();
        loadDashboard();
        loadUsers();
        loadCourses();
    } catch (error) {
        alert(`Failed to load dashboard data: ${error.message}`);
    }
    };

    initAdminPage();
});
