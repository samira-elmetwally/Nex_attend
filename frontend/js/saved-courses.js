/**
 * Saved Courses — enrolled list + downloads only here.
 */
(function () {
  const DEPT_MAP = {
    1: "Computer Science",
    2: "Information Systems",
  };

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const root = document.getElementById("savedCoursesRoot");
    if (!root) return;

    const user = await window.api.getCurrentUser();
    if (!user || user.role !== "Student") {
      window.location.href = "../index.html";
      return;
    }

    root.innerHTML = '<p style="color:var(--text-muted);">Loading your saved courses…</p>';

    try {
      const data = await window.api.getSavedCourses();
      let courses = data.courses || data.savedCourses || [];

      // Fallback demo: if backend not ready, synthesize from enrolled localStorage IDs + getCourses
      if (!courses.length) {
        const rawIds = JSON.parse(localStorage.getItem("enrolledCoursesFallback") || "[]");
        if (Array.isArray(rawIds) && rawIds.length) {
          const { courses: all } = await window.api.getCourses();
          const set = new Set(rawIds.map(Number));
          courses = (all || []).filter((c) => set.has(Number(c.id)));
        }
      }

      if (!courses.length) {
        root.innerHTML =
          '<p style="color:var(--text-muted);">You have no saved courses yet. Enroll from <a href="courses.html" style="color:var(--primary-color);">All Courses</a>.</p>';
        return;
      }

      root.innerHTML = `
        <div class="browse-course-grid">
          ${courses
            .map((course) => {
              const id = Number(course.id ?? course.course_id);
              const deptName =
                DEPT_MAP[course.department_id] || `Dept ${course.department_id ?? "—"}`;
              const name = course.name || course.course_name || "Course";
              const hasFile = !!(course.content_path ?? course.contentPath);
              return `
                <div class="browse-course-card saved-course-card">
                  <div class="browse-course-category">${escapeHtml(deptName)}</div>
                  <h3 class="browse-course-title">${escapeHtml(name)}</h3>
                  <span class="status-enrolled-tag">Status: enrolled</span>
                  <button type="button" class="btn-download-saved dl-saved-btn" data-course-id="${id}"
                    ${hasFile ? "" : "disabled title=\"No file uploaded\""}>
                    Download
                  </button>
                </div>`;
            })
            .join("")}
        </div>`;

      root.querySelectorAll(".dl-saved-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (btn.disabled) {
            alert("No course file is available for this course.");
            return;
          }
          const courseId = Number(btn.dataset.courseId);
          try {
            await window.api.downloadCourse(courseId);
          } catch (e) {
            alert(e.message || "Download failed");
          }
        });
      });
    } catch (e) {
      root.innerHTML = `<p style="color:#c0392b;">${escapeHtml(e.message || "Could not load saved courses")}</p>`;
    }
  });
})();
