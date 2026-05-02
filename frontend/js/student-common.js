/**
 * Shared sidebar chrome for student portal pages (logout, avatar, notifications).
 * Include after api.js and main.js.
 */
document.addEventListener("DOMContentLoaded", () => {
  const STUDENT_PAGES = [
    "student.html",
    "courses.html",
    "saved-courses.html",
    "attendance.html",
    "report.html",
    "settings.html",
  ];
  const page = window.location.pathname.split("/").pop() || "";
  if (!STUDENT_PAGES.includes(page)) return;

  const initChrome = async () => {
    const user = await window.api.getCurrentUser();
    if (!user || user.role !== "Student") {
      window.location.href = "../index.html";
      return;
    }

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      if (confirm("Are you sure you want to logout?")) window.api.logout();
    });

    const navAvatar = document.getElementById("navAvatar");
    if (navAvatar && !navAvatar.querySelector("img")) {
      navAvatar.textContent = user.name.substring(0, 2).toUpperCase();
    }

    const notifToggle = document.getElementById("notifToggle");
    const notifDropdown = document.getElementById("notifDropdown");
    const notifBadge = document.getElementById("notifBadge");
    const notifList = document.getElementById("notifList");

    if (notifToggle && notifDropdown && notifList) {
      const entries = [
        { text: "Welcome to NexAttend — browse All Courses and save what you enroll in.", time: "Now" },
        { text: "Tip: Downloads are available only from Saved Courses.", time: "Tip" },
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
          !notifToggle.contains(e.target)
        ) {
          notifDropdown.style.display = "none";
        }
      });
    }
  };

  void initChrome();
});
