/**
 * Lecturer Dashboard Logic - NexAttend
 */

document.addEventListener('DOMContentLoaded', () => {
    const initLecturerPage = async () => {
    const user = await window.api.getCurrentUser();
    if (!user || user.role !== 'Instructor') {
        window.location.href = '../index.html';
        return;
    }

    const deptMap = { 0: 'Administration', 1: 'Computer Science', 2: 'Information Systems' };
    let cache = { users: [], courses: [], sessions: [], attendance: [] };

    async function refreshCache() {
        const [usersRes, coursesRes, sessionsRes] = await Promise.all([
            window.api.getUsers(),
            window.api.getCourses(),
            window.api.getSessions(),
        ]);
        cache.users = usersRes.users;
        cache.courses = coursesRes.courses;
        cache.sessions = sessionsRes.sessions;

        const attendanceLists = await Promise.all(
            cache.sessions.map((s) => window.api.getAttendanceBySession(s.id).catch(() => ({ attendance: [] })))
        );
        cache.attendance = attendanceLists.flatMap((r) => r.attendance || []);
    }

    document.getElementById('lecturerName').textContent = user.name.split(' ')[0];
    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar) navAvatar.textContent = user.name.substring(0, 2).toUpperCase();

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
                if (item.dataset.view === 'dashboard') void loadDashboard();
                if (item.dataset.view === 'courses') loadCourses();
                if (item.dataset.view === 'qr') loadQrCourses();
                if (item.dataset.view === 'attendance') loadAttendance();
                if (item.dataset.view === 'settings') loadSettings();
            }
        });
    });

    // ── Logout ──────────────────────────────────────────
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) window.api.logout();
    });

    // ── Notifications ────────────────────────────────────
    const notifToggle = document.getElementById('notifToggle');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifBadge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');

    const notifs = [
        { text: 'Admin: Platform update scheduled for Sunday.', time: '2 hours ago' },
        { text: 'System: 3 students have low attendance this week.', time: '5 hours ago' },
        { text: 'Admin: Welcome to NexAttend!', time: '1 day ago' }
    ];

    notifList.innerHTML = notifs.map(n =>
        `<div class="notif-item">${n.text}<span class="notif-time"><i class="fa-regular fa-clock"></i> ${n.time}</span></div>`
    ).join('');
    notifBadge.textContent = notifs.length;
    notifBadge.style.display = 'block';

    notifToggle.addEventListener('click', e => {
        e.stopPropagation();
        notifDropdown.style.display = notifDropdown.style.display === 'block' ? 'none' : 'block';
        notifBadge.style.display = 'none';
    });
    document.addEventListener('click', e => {
        if (!notifDropdown.contains(e.target) && e.target !== notifToggle)
            notifDropdown.style.display = 'none';
    });

    // ── Helpers ──────────────────────────────────────────
    function getMyCourses() {
        return cache.courses.filter(c => c.instructor_id === user.user_id);
    }

    function getSessions() {
        return cache.sessions;
    }

    function getAttendance() {
        return cache.attendance;
    }

    function getUsers() {
        return cache.users;
    }

    // ── DASHBOARD ────────────────────────────────────────
    async function loadDashboard() {
        const courses = getMyCourses();
        const sessions = getSessions().filter(s => courses.some(c => c.id === s.course_id));
        const attendance = getAttendance().filter(a => sessions.some(s => s.id === a.session_id));
        const students = getUsers().filter(u => u.role === 'Student');
        try {
            const stats = await window.api.getInstructorDashboard();
            document.getElementById('statCourses').textContent = stats.totalCourses ?? 0;
            document.getElementById('statStudents').textContent = stats.totalStudents ?? 0;
            document.getElementById('statSessions').textContent = stats.sessionsToday ?? 0;
            document.getElementById('statAvg').textContent = Number(stats.avgAttendance ?? 0).toFixed(1);
        } catch (error) {
            // Fallback to local cache if dashboard endpoint fails.
            document.getElementById('statCourses').textContent = courses.length;
            document.getElementById('statStudents').textContent = students.length;
            const today = new Date().toISOString().slice(0, 10);
            const todaySessions = sessions.filter(s => s.date && s.date.startsWith(today));
            document.getElementById('statSessions').textContent = todaySessions.length;
            document.getElementById('statAvg').textContent = sessions.length ? (attendance.length / sessions.length).toFixed(1) : '0.0';
        }

        // Recent attendance table
        const tbody = document.querySelector('#dashRecentTable tbody');
        tbody.innerHTML = '';
        const recent = attendance.slice(-5).reverse();
        recent.forEach(a => {
            const sess = sessions.find(s => s.id === a.session_id);
            const course = courses.find(c => c.id === sess?.course_id);
            const student = students.find(u => u.id === a.student_id);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student ? student.name : 'Unknown'}</td>
                <td>${course ? course.name : 'N/A'}</td>
                <td>${a.check_in ? a.check_in.slice(0, 10) : ''}</td>
                <td><span class="badge badge-${a.status === 'Present' ? 'present' : 'absent'}">${a.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
        if (!recent.length) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No attendance records yet.</td></tr>';

        // Active sessions
        const activeDiv = document.getElementById('dashActiveSessions');
        const active = sessions.filter(s => s.is_active);
        if (active.length === 0) {
            activeDiv.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">No active sessions right now.</p>';
        } else {
            activeDiv.innerHTML = active.map(s => {
                const course = courses.find(c => c.id === s.course_id);
                return `<div style="padding:12px;background:var(--hover-bg);border-radius:12px;margin-bottom:10px;">
                    <div style="font-weight:bold;color:var(--text-main);">${course ? course.name : 'Course'}</div>
                    <div style="font-size:13px;color:var(--primary-color);margin-top:4px;"><i class="fa-solid fa-key"></i> Token: <strong>${s.token}</strong></div>
                </div>`;
            }).join('');
        }
    }

    // ── COURSES ──────────────────────────────────────────
    function loadCourses() {
        const courses = getMyCourses();
        const sessions = getSessions();
        const attendance = getAttendance();
        const grid = document.getElementById('coursesGrid');
        grid.innerHTML = '';

        if (!courses.length) {
            grid.innerHTML = '<p style="color:var(--text-muted);">No courses assigned to you.</p>';
            return;
        }

        courses.forEach(course => {
            const courseSessions = sessions.filter(s => s.course_id === course.id);
            const attended = attendance.filter(a => courseSessions.some(s => s.id === a.session_id)).length;
            const card = document.createElement('div');
            card.className = 'course-card';
            card.innerHTML = `
                <h3>${course.name}</h3>
                <p>Department: ${deptMap[course.department_id] || 'Unknown'}</p>
                <div class="meta">
                    <span><i class="fa-solid fa-calendar" style="color:var(--primary-color);"></i> ${courseSessions.length} Sessions</span>
                    <span><i class="fa-solid fa-users" style="color:var(--primary-color);"></i> ${attended} Check-ins</span>
                </div>
                <div style="display:flex;gap:10px;margin-top:15px;">
                    <button class="btn-primary" style="flex:1;font-size:12px;padding:8px;" onclick="window.switchToView('qr', ${course.id})">
                        <i class="fa-solid fa-qrcode"></i> QR
                    </button>
                    <button class="btn-outline" style="flex:1;font-size:12px;padding:8px;" onclick="window.switchToView('attendance', ${course.id})">
                        <i class="fa-solid fa-users"></i> View
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    document.getElementById('addCourseBtn')?.addEventListener('click', async () => {
        const courseNameEl = document.getElementById('newCourseName');
        const deptEl = document.getElementById('newCourseDepartment');
        const fileEl = document.getElementById('newCourseFile');
        const courseName = courseNameEl.value.trim();
        const departmentId = Number(deptEl.value);
        const file = fileEl && fileEl.files && fileEl.files[0];

        if (!courseName) {
            alert('Course name is required.');
            return;
        }
        if (!file) {
            alert('Please attach a course file (.zip, .pdf, or .docx).');
            return;
        }

        const formData = new FormData();
        formData.append('courseName', courseName);
        formData.append('departmentId', String(departmentId));
        formData.append('file', file);

        try {
            await window.api.createCourse(formData);
            courseNameEl.value = '';
            if (fileEl) fileEl.value = '';
            await refreshCache();
            loadCourses();
            await loadDashboard();
            loadQrCourses();
            alert('Course added successfully.');
        } catch (error) {
            alert(error.message);
        }
    });

    // Global switcher for inline buttons
    window.switchToView = (viewName, courseId) => {
        const item = document.querySelector(`.nav-item[data-view="${viewName}"]`);
        if (item) {
            item.click();
            if (courseId) {
                if (viewName === 'qr') {
                    document.getElementById('qrCourse').value = courseId;
                } else if (viewName === 'attendance') {
                    document.getElementById('filterCourse').value = courseId;
                    // Trigger change manually to reload table
                    document.getElementById('filterCourse').dispatchEvent(new Event('change'));
                }
            }
        }
    };

    // ── QR GENERATOR ─────────────────────────────────────
    let qrCountdownTimer = null;

    function loadQrCourses() {
        const courses = getMyCourses();
        const sel = document.getElementById('qrCourse');
        sel.innerHTML = '<option value="">-- Choose Course --</option>';
        courses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            sel.appendChild(opt);
        });
    }

    document.getElementById('generateQrBtn').addEventListener('click', async () => {
        const courseId = parseInt(document.getElementById('qrCourse').value);
        if (!courseId) { alert('Please select a course.'); return; }

        const timeLimit = parseInt(document.getElementById('qrTimeLimit').value) || 0;
        const studentLimit = parseInt(document.getElementById('qrStudentLimit').value) || 0;

        try {
            const created = await window.api.createSession({
                courseId,
                sessionDate: new Date().toISOString(),
            });
            await refreshCache();
            const sid = created.session.id ?? created.session.session_id;
            const token = created.session.qr_token;
            const createdSession = cache.sessions.find(s => s.id === sid) || {
                id: sid,
                course_id: created.session.course_id,
            };
            showQrResult(token, createdSession, timeLimit, studentLimit);
        } catch (error) {
            alert(error.message);
        }
    });

    function showQrResult(token, session, timeLimit, studentLimit) {
        const box = document.getElementById('qrResultBox');
        box.style.display = 'block';

        document.getElementById('qrTokenDisplay').textContent = token;

        let meta = [];
        meta.push(timeLimit > 0 ? `<i class="fa-regular fa-clock"></i> Expires in ${timeLimit} min` : '<i class="fa-regular fa-clock"></i> No time limit');
        meta.push(studentLimit > 0 ? `<i class="fa-solid fa-users"></i> Max ${studentLimit} students` : '<i class="fa-solid fa-users"></i> Unlimited students');
        document.getElementById('qrMetaInfo').innerHTML = meta.join('&nbsp;&nbsp;|&nbsp;&nbsp;');

        // Draw QR-like visual using canvas
        drawQrVisual(token);

        // Countdown
        if (qrCountdownTimer) clearInterval(qrCountdownTimer);
        const countdownEl = document.getElementById('qrCountdown');
        if (timeLimit > 0) {
            let remaining = timeLimit * 60;
            const update = () => {
                const m = Math.floor(remaining / 60);
                const s = remaining % 60;
                countdownEl.textContent = `⏱ Session expires in: ${m}:${s.toString().padStart(2, '0')}`;
                if (remaining <= 0) {
                    clearInterval(qrCountdownTimer);
                    countdownEl.textContent = '❌ Session expired.';
                    closeSession(session.id);
                }
                remaining--;
            };
            update();
            qrCountdownTimer = setInterval(update, 1000);
        } else {
            countdownEl.textContent = '✅ Session active – no time limit.';
        }
    }

    function drawQrVisual(token) {
        const canvas = document.getElementById('qrCanvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Simple deterministic pixel pattern from token
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        const cellSize = size / 20;
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                const charCode = token.charCodeAt((i + j * 7) % token.length) || 65;
                if ((charCode + i * j) % 3 !== 0) {
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(j * cellSize, i * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }

        // Draw finder patterns
        const drawFinder = (x, y) => {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x, y, cellSize * 7, cellSize * 7);
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
        };
        drawFinder(0, 0);
        drawFinder(size - cellSize * 7, 0);
        drawFinder(0, size - cellSize * 7);

        const dataUrl = canvas.toDataURL();
        document.getElementById('qrVisual').innerHTML = `<img src="${dataUrl}" style="width:160px;height:160px;border-radius:8px;border:3px solid var(--primary-color);">`;
    }

    async function closeSession(sessionId) {
        await window.api.closeSession(sessionId);
        await refreshCache();
    }

    document.getElementById('closeSessionBtn').addEventListener('click', async () => {
        const sessions = getSessions();
        const courses = getMyCourses();
        const active = sessions.find(s => s.is_active && courses.some(c => c.id === s.course_id));
        if (active) {
            await closeSession(active.id);
            document.getElementById('qrCountdown').textContent = '🔒 Session closed by instructor.';
            document.getElementById('closeSessionBtn').disabled = true;
            document.getElementById('closeSessionBtn').textContent = 'Session Closed';
            if (qrCountdownTimer) clearInterval(qrCountdownTimer);
        }
    });

    document.getElementById('copyTokenBtn').addEventListener('click', () => {
        const token = document.getElementById('qrTokenDisplay').textContent;
        navigator.clipboard.writeText(token).then(() => {
            const btn = document.getElementById('copyTokenBtn');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Token', 2000);
        });
    });

    document.getElementById('downloadQrBtn').addEventListener('click', () => {
        const img = document.querySelector('#qrVisual img');
        if (!img) return;
        const a = document.createElement('a');
        a.href = img.src;
        a.download = 'NexAttend_QR_' + document.getElementById('qrTokenDisplay').textContent + '.png';
        a.click();
    });

    // ── ATTENDANCE ────────────────────────────────────────
    function loadAttendance(courseFilter = '', sessionFilter = '') {
        const courses = getMyCourses();
        const sessions = getSessions().filter(s => courses.some(c => c.id === s.course_id));
        const attendance = getAttendance();
        const users = getUsers();

        // Populate filter dropdowns (once)
        const filterCourse = document.getElementById('filterCourse');
        if (filterCourse.options.length <= 1) {
            courses.forEach(c => {
                const o = document.createElement('option');
                o.value = c.id; o.textContent = c.name;
                filterCourse.appendChild(o);
            });
            filterCourse.addEventListener('change', () => loadAttendance(filterCourse.value, document.getElementById('filterSession').value));
        }

        const filterSession = document.getElementById('filterSession');
        if (filterSession.options.length <= 1) {
            sessions.forEach(s => {
                const course = courses.find(c => c.id === s.course_id);
                const o = document.createElement('option');
                o.value = s.id; o.textContent = `${course?.name || ''} – ${s.date?.slice(0, 10) || 'N/A'}`;
                filterSession.appendChild(o);
            });
            filterSession.addEventListener('change', () => loadAttendance(filterCourse.value, filterSession.value));
        }

        const tbody = document.querySelector('#attendanceTable tbody');
        tbody.innerHTML = '';

        let filtered = attendance.filter(a => {
            const sess = sessions.find(s => s.id === a.session_id);
            if (!sess) return false;
            if (courseFilter && sess.course_id !== parseInt(courseFilter)) return false;
            if (sessionFilter && a.session_id !== parseInt(sessionFilter)) return false;
            return true;
        });

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No attendance records found.</td></tr>';
            return;
        }

        filtered.sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
        filtered.forEach(a => {
            const sess = sessions.find(s => s.id === a.session_id);
            const course = courses.find(c => c.id === sess?.course_id);
            const student = users.find(u => u.id === a.student_id);
            const dateObj = new Date(a.check_in);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${student ? student.name : 'Unknown #' + a.student_id}</strong></td>
                <td>${course ? course.name : 'N/A'}</td>
                <td>${dateObj.toLocaleDateString()}</td>
                <td>${dateObj.toLocaleTimeString()}</td>
                <td><span class="badge badge-${a.status === 'Present' ? 'present' : 'absent'}">${a.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ── SETTINGS ─────────────────────────────────────────
    async function loadSettings() {
        const freshUser = await window.api.getCurrentUser();
        document.getElementById('settingFullName').value = freshUser.name || '';
        document.getElementById('settingEmail').value = freshUser.email || '';
        document.getElementById('settingPhone').value = freshUser.phone || '';
        document.getElementById('settingDept').value = deptMap[freshUser.department_id] || 'Unknown';
        document.getElementById('settingName').textContent = freshUser.name;

        const avatarEl = document.getElementById('settingAvatar');
        if (avatarEl) avatarEl.textContent = freshUser.name.substring(0, 2).toUpperCase();
    }

    // Avatar change
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarEditIcon = document.getElementById('avatarEditIcon');
    const avatarFileInput = document.getElementById('avatarFileInput');
    const settingAvatarEl = document.getElementById('settingAvatar');

    [changeAvatarBtn, avatarEditIcon, settingAvatarEl].forEach(el => {
        el?.addEventListener('click', () => avatarFileInput?.click());
    });

    avatarFileInput?.addEventListener('change', () => {});

    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
        const newName = document.getElementById('settingFullName').value.trim();
        const newEmail = document.getElementById('settingEmail').value.trim();
        const newPhone = document.getElementById('settingPhone').value.trim();
        const newPass = document.getElementById('settingNewPass').value;
        const confirmPass = document.getElementById('settingConfirmPass').value;

        if (!newName || !newEmail) { alert('Name and Email are required.'); return; }
        if (newPass && newPass !== confirmPass) { alert('Passwords do not match!'); return; }

        try {
            await window.api.updateUser(user.user_id, { name: newName, email: newEmail, phone: newPhone, password: newPass || undefined });
            window.api.currentUser = { ...window.api.currentUser, name: newName, email: newEmail, phone: newPhone };
            document.getElementById('settingName').textContent = newName;
            document.getElementById('lecturerName').textContent = newName.split(' ')[0];
        } catch (error) {
            alert(error.message);
            return;
        }

        const btn = document.getElementById('saveSettingsBtn');
        btn.textContent = '✓ Saved!';
        btn.style.background = '#00a65a';
        setTimeout(() => { btn.textContent = 'Save Changes'; btn.style.background = 'var(--primary-color)'; }, 2500);
    });

    // ── INIT ─────────────────────────────────────────────
    await refreshCache();
    await loadDashboard();
    };

    initLecturerPage();
});
