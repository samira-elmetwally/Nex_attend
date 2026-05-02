/**
 * Student report — lightweight overview from existing APIs.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("studentReportRoot");
  if (!root) return;

  const user = await window.api.getCurrentUser();
  if (!user || user.role !== "Student") {
    window.location.href = "../index.html";
    return;
  }

  root.innerHTML = '<p style="color:var(--text-muted);">Loading report…</p>';

  try {
    const [{ courses }, attData, { sessions }, savedData] = await Promise.all([
      window.api.getCourses(),
      window.api.getAttendance(),
      window.api.getSessions(),
      window.api.getSavedCourses(),
    ]);

    const attendanceRows = attData.attendance || [];
    const presentCount = attendanceRows.filter((a) => a.status === "Present").length;
    const enrolledCount = (savedData.courses || []).length;

    root.innerHTML = `
      <div class="stats-container" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); margin-bottom:24px;">
        <div class="stat-card"><i class="fa-solid fa-book-open"></i><h3>Courses listed</h3><p>${courses?.length ?? 0}</p></div>
        <div class="stat-card"><i class="fa-regular fa-bookmark"></i><h3>Enrolled</h3><p>${enrolledCount}</p></div>
        <div class="stat-card"><i class="fa-solid fa-calendar-check"></i><h3>Attendance marks</h3><p>${attendanceRows.length}</p></div>
        <div class="stat-card"><i class="fa-solid fa-check"></i><h3>Present</h3><p>${presentCount}</p></div>
        <div class="stat-card"><i class="fa-solid fa-clock"></i><h3>Sessions (all)</h3><p>${(sessions || []).length}</p></div>
      </div>
      <p style="color:var(--text-muted); font-size:14px; max-width:640px; line-height:1.5;">
        This page summarizes your activity. For check-ins, use <strong>Attendance</strong>. For course files, use <strong>Saved Courses</strong>.
      </p>`;
  } catch (e) {
    root.innerHTML = `<p style="color:#c0392b;">${String(e.message || e)}</p>`;
  }
});
