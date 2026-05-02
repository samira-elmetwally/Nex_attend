/**
 * All Courses (browse + enroll). Used by courses.html only.
 * Depends: api.js, student-common.js (optional but recommended).
 */
(function () {
  const DEPT_META = [
    { id: 1, title: "Computer Science" },
    { id: 2, title: "Information Systems" },
  ];

  function departmentTitle(departmentId) {
    const m = DEPT_META.find((d) => d.id === Number(departmentId));
    return m ? m.title : "Other departments";
  }

  /** Group courses under known departments first (1, 2), then bucket remaining as Other. */
  function groupCourses(courses) {
    const buckets = new Map();
    for (const c of courses || []) {
      const key = DEPT_META.some((d) => d.id === Number(c.department_id))
        ? Number(c.department_id)
        : "other";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(c);
    }

    const order = [...DEPT_META.map((d) => d.id), "other"];
    return order.filter((k) => buckets.has(k)).map((k) => ({
      key: k,
      title: typeof k === "number" ? departmentTitle(k) : "Other departments",
      courses: buckets.get(k),
    }));
  }

  function renderCard(course, enrolledSet) {
    const id = Number(course.id);
    const deptName = departmentTitle(course.department_id);
    const enrolled = enrolledSet.has(id);
    return `
      <div class="browse-course-card">
        <div class="browse-course-category">${deptName}</div>
        <h3 class="browse-course-title">${escapeHtml(course.name || "Untitled course")}</h3>
        <p class="browse-course-instructor">
          <i class="fa-solid fa-chalkboard-user"></i>
          ${escapeHtml(course.instructor_name || "Instructor TBA")}
        </p>
        <button type="button" class="btn-enroll-browse enroll-btn-browse"
          data-course-id="${id}" ${enrolled ? "disabled" : ""}>
          ${enrolled ? "Enrolled" : "Enroll"}
        </button>
      </div>`;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  async function enrolledIdSet() {
    try {
      const data = await window.api.getSavedCourses();
      const list = data.courses || data.savedCourses || [];
      const fromApi = new Set(list.map((c) => Number(c.id ?? c.course_id)));
      if (fromApi.size) return fromApi;
    } catch (_) {
      /* fall through */
    }
    try {
      const raw = JSON.parse(localStorage.getItem("enrolledCoursesFallback") || "[]");
      return new Set(Array.isArray(raw) ? raw.map(Number) : []);
    } catch (_) {
      return new Set();
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const root = document.getElementById("allCoursesRoot");
    if (!root) return;

    const user = await window.api.getCurrentUser();
    if (!user || user.role !== "Student") {
      window.location.href = "../index.html";
      return;
    }

    root.innerHTML = '<p style="color:var(--text-muted);">Loading courses…</p>';

    let courses;
    let savedIds;
    try {
      const [courseRes, saved] = await Promise.all([
        window.api.getCourses(),
        enrolledIdSet(),
      ]);
      courses = courseRes.courses || [];
      savedIds = saved;
    } catch (e) {
      root.innerHTML = `<p style="color:var(--danger-color, #c00);">${escapeHtml(e.message || "Could not load courses")}</p>`;
      return;
    }

    if (!courses.length) {
      root.innerHTML = '<p style="color:var(--text-muted);">No courses available yet.</p>';
      return;
    }

    const groups = groupCourses(courses);
    root.innerHTML = groups
      .map((g) => {
        const cards = g.courses.map((c) => renderCard(c, savedIds)).join("");
        return `
          <h3 class="course-category-heading">${escapeHtml(g.title)}</h3>
          <div class="browse-course-grid">${cards}</div>`;
      })
      .join("");

    root.querySelectorAll(".enroll-btn-browse").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const courseId = Number(btn.dataset.courseId);
        if (!courseId || btn.disabled) return;
        btn.disabled = true;
        try {
          await window.api.enrollCourse(courseId);
          btn.textContent = "Enrolled";
        } catch (err) {
          btn.disabled = false;
          alert(err.message || "Could not enroll");
        }
      });
    });
  });
})();
