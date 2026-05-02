/**
 * Student Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const initStudentPage = async () => {
    const user = await window.api.getCurrentUser();
    if (!user || user.role !== 'Student') {
        window.location.href = '../index.html';
        return;
    }
    
    // Set Date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDateEl = document.getElementById('currentDate');
    if(currentDateEl) currentDateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // Populate User Info
    if (user) {
        const userNameEl = document.getElementById('userName');
        const userDeptEl = document.getElementById('userDept');
        const profNameEl = document.getElementById('profName');
        const profEmailEl = document.getElementById('profEmail');
        const profDeptEl = document.getElementById('profDept');
        const profLevelEl = document.getElementById('profLevel');

        if(userNameEl) userNameEl.textContent = user.name;
        if(userDeptEl) userDeptEl.textContent = `Department ID: ${user.department_id}`;

        // Load avatar (saved photo or initials)
        const avatarEls = [document.getElementById('navAvatar'), document.getElementById('userAvatar')];
        avatarEls.forEach(el => {
            if (!el) return;
            el.textContent = user.name.substring(0, 2).toUpperCase();
        });

        // Populate Profile
        if(profNameEl) profNameEl.value = user.name;
        if(profEmailEl) profEmailEl.value = user.email;
        if(profDeptEl) profDeptEl.value = user.department_id;
        if(profLevelEl) profLevelEl.value = user.level || 'N/A';
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to logout?')) {
                window.api.logout();
            }
        });
    }

    // Notifications Logic
    const notifToggle = document.getElementById('notifToggle');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifBadge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');

    if (notifToggle && notifDropdown) {
        // Mock Notifications Data
        const mockNotifs = [
            { id: 1, text: 'Admin: System maintenance at 12:00 AM.', time: '1 hour ago' },
            { id: 2, text: 'Dr Hassan: Your Database Systems lecture is starting soon.', time: '3 hours ago' },
            { id: 3, text: 'Admin: Welcome to NexAttend Smart Platform!', time: '1 day ago' }
        ];

        // Populate list
        if (notifList) {
            notifList.innerHTML = mockNotifs.map(n => `
                <div class="notif-item">
                    ${n.text}
                    <span class="notif-time"><i class="fa-regular fa-clock"></i> ${n.time}</span>
                </div>
            `).join('');
        }

        // Update badge
        if (notifBadge && mockNotifs.length > 0) {
            notifBadge.textContent = mockNotifs.length;
            notifBadge.style.display = 'block';
        }

        // Toggle dropdown
        notifToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.style.display = notifDropdown.style.display === 'block' ? 'none' : 'block';
            if (notifBadge) notifBadge.style.display = 'none'; // Clear badge on read
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!notifDropdown.contains(e.target) && e.target !== notifToggle) {
                notifDropdown.style.display = 'none';
            }
        });
    }

    // Navigation is now handled by standard HTML links across separate pages.

    // Mock API Fetching logic
    async function loadCourses() {
        const grid = document.getElementById('coursesGrid');
        if(!grid) return; // Exit if new layout is used
        grid.innerHTML = '';

        try {
            const [{ courses }, { attendance }, { sessions }] = await Promise.all([
                window.api.getCourses(),
                window.api.getAttendanceByStudent(user.user_id),
                window.api.getSessions()
            ]);
            const myCourses = courses;
            const myAttendance = attendance.filter(a => a.student_id === user.user_id);

            if(myCourses.length === 0) {
                grid.innerHTML = '<p class="text-muted">No courses found for your department.</p>';
                return;
            }

            myCourses.forEach(course => {
            // Calculate attendance stats for this course
            const courseSessions = sessions.filter(s => s.course_id === course.id);
            const attendedCount = myAttendance.filter(a => courseSessions.some(cs => cs.id === a.session_id && a.status === 'Present')).length;
            const totalLectures = courseSessions.length;
            const percentage = totalLectures > 0 ? Math.round((attendedCount / totalLectures) * 100) : 0;

            const card = document.createElement('div');
            card.className = 'course-card';
            card.innerHTML = `
                <div class="course-header">
                    <div>
                        <div class="course-title">${course.name}</div>
                        <div class="text-secondary" style="font-size: 0.875rem;">Instructor: ${course.instructor_name || 'N/A'}</div>
                    </div>
                    <i class="fa-solid fa-book text-primary" style="font-size: 1.5rem;"></i>
                </div>
                <div class="course-stats">
                    <div class="stat">
                        <div class="stat-value">${totalLectures}</div>
                        <div class="stat-label">Total Lectures</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" style="color: ${percentage >= 75 ? 'var(--secondary-color)' : 'var(--danger-color)'}">${percentage}%</div>
                        <div class="stat-label">Attendance Rate</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
                    <button class="btn-primary enroll-course-btn" data-course-id="${course.id}" style="flex:1; border:none; border-radius:8px; padding:8px; background:var(--primary-color); color:#fff; cursor:pointer;">
                        Enroll/View
                    </button>
                    ${course.content_path ? `<button type="button" class="btn-outline download-course-btn" data-course-id="${course.id}" style="flex:1; border-radius:8px; padding:8px; cursor:pointer;">Download material</button>` : ""}
                </div>
            `;
            grid.appendChild(card);
        });

        grid.querySelectorAll('.enroll-course-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const courseId = Number(btn.dataset.courseId);
                const enrolled = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
                if (!enrolled.includes(courseId)) {
                    enrolled.push(courseId);
                    localStorage.setItem('enrolledCourses', JSON.stringify(enrolled));
                }
                alert('Course is available in your dashboard now.');
            });
        });

        grid.querySelectorAll('.download-course-btn').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const courseId = Number(btn.dataset.courseId);
                try {
                    await window.api.downloadCourse(courseId);
                } catch (err) {
                    alert(err.message || 'Download failed');
                }
            });
        });
        } catch (error) {
            grid.innerHTML = `<p class="text-muted">${error.message}</p>`;
        }
    }

    async function loadAttendance() {
        const tbodyTable = document.querySelector('#attendanceTable tbody');
        if(!tbodyTable) return;
        const tbody = tbodyTable;
        tbody.innerHTML = '';

        try {
            const [{ attendance }, { sessions }, { courses }] = await Promise.all([
                window.api.getAttendanceByStudent(user.user_id),
                window.api.getSessions(),
                window.api.getCourses()
            ]);

            if(attendance.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No attendance records found.</td></tr>';
                return;
            }

        // Sort descending by check_in time
        attendance.sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));

        attendance.forEach(record => {
            const session = sessions.find(s => s.id === record.session_id);
            const course = courses.find(c => c.id === session?.course_id);
            
            const tr = document.createElement('tr');
            
            // Format datetime
            const dateObj = new Date(record.check_in_time);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString();

            tr.innerHTML = `
                <td><strong>${course ? course.name : 'Unknown Course'}</strong></td>
                <td>${dateStr}</td>
                <td>${timeStr}</td>
                <td><span class="badge ${record.status === 'Present' ? 'badge-present' : 'badge-absent'}">${record.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${error.message}</td></tr>`;
        }
    }

    // Mock Scanning
    const mockScanBtn = document.getElementById('mockScanBtn');
    if(mockScanBtn) {
        mockScanBtn.addEventListener('click', async () => {
            const token = document.getElementById('manualQrInput').value.trim().toUpperCase();
            if(!token) {
                alert('Please enter a valid QR token.');
                return;
            }

            try {
                await window.api.verifySessionToken({
                    studentId: user.user_id,
                    token
                });
            
                const btn = document.getElementById('mockScanBtn');
                const originalText = btn.textContent;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Success!';
                btn.style.background = '#00a65a';
            
                setTimeout(async () => {
                    alert('Attendance recorded successfully!');
                    if(document.getElementById('manualQrInput')) document.getElementById('manualQrInput').value = '';
                    btn.innerHTML = originalText;
                    btn.style.background = 'var(--primary-color)';
                
                    const attendanceTab = document.querySelector('.nav-item[data-target="attendance"]');
                    if(attendanceTab) attendanceTab.click();
                    await loadAttendance();
                }, 500);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Initial load
    await loadCourses();
    await loadAttendance();
    };

    initStudentPage();
});
