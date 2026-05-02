/**
 * Student dashboard (overview only — browse/enroll lives on courses.html).
 */
document.addEventListener("DOMContentLoaded", () => {
  const initDashboard = async () => {
    const user = await window.api.getCurrentUser();
    if (!user || user.role !== "Student") {
      window.location.href = "../index.html";
      return;
    }

    const dateOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const currentDateEl = document.getElementById("currentDate");
    if (currentDateEl)
      currentDateEl.textContent = new Date().toLocaleDateString("en-US", dateOptions);

    if (user) {
      const userNameEl = document.getElementById("userName");
      const userDeptEl = document.getElementById("userDept");
      const deptMap = { 1: "Computer Science", 2: "Information Systems" };

      if (userNameEl) userNameEl.textContent = user.name;
      if (userDeptEl)
        userDeptEl.textContent = deptMap[user.department_id] || `Dept ${user.department_id ?? "—"}`;

      const avatarEls = [
        document.getElementById("navAvatar"),
        document.getElementById("userAvatar"),
      ];
      avatarEls.forEach((el) => {
        if (!el || el.querySelector("img")) return;
        el.textContent = user.name.substring(0, 2).toUpperCase();
      });

      [
        ["profName", user.name],
        ["profEmail", user.email],
        ["profDept", deptMap[user.department_id] || user.department_id],
        ["profLevel", user.level ?? "—"],
      ].forEach(([id, val]) => {
        const input = document.getElementById(id);
        if (input) input.value = val;
      });

      document.getElementById("logoutBtn")?.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) window.api.logout();
      });
    }

    const notifToggle = document.getElementById("notifToggle");
    const notifDropdown = document.getElementById("notifDropdown");
    const notifBadge = document.getElementById("notifBadge");
    const notifList = document.getElementById("notifList");

    if (notifToggle && notifDropdown && notifList) {
      const entries = [
        { text: "Use All Courses to enroll. Saved Courses holds downloads.", time: "Tip" },
        { text: "Welcome to NexAttend, Student portal.", time: "Now" },
      ];
      notifList.innerHTML = entries
        .map(
          (n) =>
            `<div class="notif-item">${n.text}<span class="notif-time"><i class="fa-regular fa-clock"></i> ${n.time}</span></div>`
        )
        .join("");
      if (notifBadge && entries.length) {
        notifBadge.textContent = String(entries.length);
        notifBadge.style.display = "block";
      }
      notifToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        notifDropdown.style.display =
          notifDropdown.style.display === "block" ? "none" : "block";
        if (notifBadge) notifBadge.style.display = "none";
      });
      document.addEventListener("click", (e) => {
        if (
          !notifDropdown.contains(e.target) &&
          e.target !== notifToggle &&
          !notifToggle.contains?.(e.target)
        ) {
          notifDropdown.style.display = "none";
        }
      });
    }

    const dashStats = document.getElementById("dashStatsGrid");
    const previewWrap = document.getElementById("dashboardCoursePreview");

    async function hydrateOverview() {
      let totalAvailable = "—";
      let enrolledCount = "—";

      try {
        const [courseRes, savedRes] = await Promise.all([
          window.api.getCourses(),
          window.api.getSavedCourses(),
        ]);
        const all = courseRes.courses || [];
        totalAvailable = all.length;

        let saved = savedRes.courses || [];
        if (!saved.length) {
          const rawIds = JSON.parse(localStorage.getItem("enrolledCoursesFallback") || "[]");
          if (Array.isArray(rawIds) && rawIds.length) {
            const want = new Set(rawIds.map(Number));
            saved = all.filter((c) => want.has(Number(c.id)));
          }
        }
        enrolledCount = saved.length;

        if (dashStats && dashStats.dataset.simple === "1") {
          dashStats.innerHTML = `
            <div class="stat-card">
              <i class="fa-solid fa-book-open"></i>
              <h3>Available courses</h3>
              <p>${totalAvailable}</p>
            </div>
            <div class="stat-card">
              <i class="fa-regular fa-bookmark"></i>
              <h3>Your enrollments</h3>
              <p>${enrolledCount}</p>
            </div>`;
        }

        if (previewWrap && all.length) {
          const slice = all.slice(0, 6);
          previewWrap.innerHTML = slice
            .map((course) => {
              const deptName =
                { 1: "Computer Science", 2: "Information Systems" }[course.department_id] ||
                "Course";
              return `
                <div class="course-card">
                  <div class="course-img" style="background: linear-gradient(135deg, var(--primary-color), #6a0088);"></div>
                  <div class="course-info">
                    <div class="category">${escapeHtml(deptName)}</div>
                    <h3>${escapeHtml(course.name || "Untitled")}</h3>
                    <div class="course-meta">
                      <span>${escapeHtml(course.instructor_name || "Instructor TBA")}</span>
                    </div>
                  </div>
                </div>`;
            })
            .join("");
        }
      } catch (_) {
        if (dashStats && dashStats.dataset.simple === "1") {
          dashStats.innerHTML =
            '<p style="grid-column:1/-1;color:var(--text-muted);">Statistics load when the catalog API is reachable.</p>';
        }
      }
    }

    function escapeHtml(str) {
      const d = document.createElement("div");
      d.textContent = str;
      return d.innerHTML;
    }

    const continueLearning = document.getElementById("continueLearningList");
    if (continueLearning) {
      continueLearning.innerHTML = `
        <div class="learning-item">
          <div class="learning-info">
            <div class="learning-icon"><i class="fa-regular fa-bookmark"></i></div>
            <div class="learning-text">
              <h4>Saved Courses</h4>
              <p>Open materials & downloads</p>
            </div>
          </div>
          <a href="saved-courses.html" style="font-size:12px;color:var(--primary-color);font-weight:700;text-decoration:none;">View →</a>
        </div>
        <div class="learning-item">
          <div class="learning-info">
            <div class="learning-icon"><i class="fa-solid fa-layer-group"></i></div>
            <div class="learning-text">
              <h4>All Courses</h4>
              <p>Browse by department</p>
            </div>
          </div>
          <a href="courses.html" style="font-size:12px;color:var(--primary-color);font-weight:700;text-decoration:none;">View →</a>
        </div>
        <div class="learning-item">
          <div class="learning-info">
            <div class="learning-icon"><i class="fa-solid fa-qrcode"></i></div>
            <div class="learning-text">
              <h4>Attendance</h4>
              <p>Submit session token</p>
            </div>
          </div>
          <a href="attendance.html" style="font-size:12px;color:var(--primary-color);font-weight:700;text-decoration:none;">View →</a>
        </div>`;
    }

    await hydrateOverview();
  };

  initDashboard();
});
