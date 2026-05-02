/**
 * Main Javascript for common functionalities
 */

document.addEventListener('DOMContentLoaded', () => {
    const initializeApp = async () => {
    // Theme Toggler
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', preferredTheme);
        updateThemeIcon(preferredTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggle) return;
        const icon = themeToggle; // The toggle element is the icon
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Password Toggle Visibility
    const togglePasswords = document.querySelectorAll('.toggle-password');
    togglePasswords.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Check Auth Status on Dashboard pages
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
        const currentUser = await api.getCurrentUser();
        if (!currentUser) {
            window.location.href = '../index.html';
        } else {
            const page = path.split('/').pop();
            if (currentUser.role === 'Student') {
                // Students cannot access admin or lecturer-only pages
                if (page === 'admin.html' || page === 'lecturer.html') {
                    window.location.href = 'student.html';
                }
            } else if (currentUser.role === 'Instructor') {
                // Instructors can only access lecturer.html
                if (page === 'admin.html' || page === 'student.html') {
                    window.location.href = 'lecturer.html';
                }
            } else if (currentUser.role === 'Admin') {
                if (page !== 'admin.html') {
                    window.location.href = 'admin.html';
                }
            }
        }
    }
    };

    initializeApp();
});
