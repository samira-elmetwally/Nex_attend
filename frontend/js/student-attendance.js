/**
 * Student attendance: verify session token + show history.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const pageRoot = document.getElementById("attendancePageRoot");
  if (!pageRoot) return;

  const user = await window.api.getCurrentUser();
  if (!user || user.role !== "Student") {
    window.location.href = "../index.html";
    return;
  }

  const tokenInput = document.getElementById("sessionTokenInput");
  const submitBtn = document.getElementById("submitTokenBtn");
  const msgEl = document.getElementById("tokenFeedback");
  const tbody = document.querySelector("#attendanceHistoryTable tbody");

  async function loadHistory() {
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><td colspan="4" style="color:var(--text-muted);">Loading…</td></tr>';
    try {
      const data = await window.api.getAttendance();
      const rows = data.attendance || [];
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="4" style="color:var(--text-muted);">No attendance records yet.</td></tr>';
        return;
      }

      const [{ sessions }, { courses }] = await Promise.all([
        window.api.getSessions(),
        window.api.getCourses(),
      ]);
      const sessList = sessions || [];
      const courseList = courses || [];

      tbody.innerHTML = rows
        .map((r) => {
          const sess = sessList.find((s) => s.id === r.session_id);
          const course = courseList.find((c) => c.id === sess?.course_id);
          const dateObj = r.check_in_time ? new Date(r.check_in_time) : null;
          const dateStr = dateObj ? dateObj.toLocaleDateString() : "—";
          const timeStr = dateObj ? dateObj.toLocaleTimeString() : "—";
          const courseName = course?.name || "—";
          const statusClass =
            r.status === "Present" ? "status-complete" : "status-ongoing";
          return `<tr>
            <td><strong>${escapeHtml(courseName)}</strong></td>
            <td>${escapeHtml(dateStr)}</td>
            <td>${escapeHtml(timeStr)}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(r.status || "—")}</span></td>
          </tr>`;
        })
        .join("");
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:#c0392b;">${escapeHtml(e.message || "Failed to load")}</td></tr>`;
    }
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  submitBtn?.addEventListener("click", async () => {
    const token = (tokenInput?.value || "").trim();
    if (!token) {
      if (msgEl) msgEl.textContent = "Enter the session token from your instructor.";
      return;
    }
    if (msgEl) msgEl.textContent = "";
    submitBtn.disabled = true;
    try {
      await window.api.verifyToken(token);
      if (msgEl) {
        msgEl.style.color = "#00a65a";
        msgEl.textContent = "Attendance recorded successfully.";
      }
      if (tokenInput) tokenInput.value = "";
      await loadHistory();
    } catch (err) {
      if (msgEl) {
        msgEl.style.color = "#c0392b";
        msgEl.textContent = err.message || "Verification failed";
      }
    } finally {
      submitBtn.disabled = false;
    }
  });

  await loadHistory();
});
