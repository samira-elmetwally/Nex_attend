/**
 * Authentication logic (Login/Register)
 */

document.addEventListener('DOMContentLoaded', () => {
    const bootstrapAuthPage = async () => {
    // If already logged in, redirect
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('frontend/')) {
        const user = await window.api.getCurrentUser();
        if (user) {
            if (user.role === 'Student') window.location.href = 'pages/student.html';
            else if (user.role === 'Instructor') window.location.href = 'pages/lecturer.html';
            else if (user.role === 'Admin') window.location.href = 'pages/admin.html';
        }
    }

    // Tabs switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            tabBtns.forEach(b => b.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active-form'));

            // Add active class
            btn.classList.add('active');
            const targetForm = document.getElementById(`${btn.dataset.tab}Form`);
            if (targetForm) targetForm.classList.add('active-form');
        });
    });

    // Login Form Submit
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const btn = loginForm.querySelector('button[type="submit"]');
            
            // Loading state
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
            loginError.classList.add('hidden');

            try {
                const res = await window.api.login(email, password);
                if (res.user.role === 'Student') window.location.href = 'pages/student.html';
                else if (res.user.role === 'Instructor') window.location.href = 'pages/lecturer.html';
                else if (res.user.role === 'Admin') window.location.href = 'pages/admin.html';
            } catch (err) {
                loginError.textContent = err.message;
                loginError.classList.remove('hidden');
                
                // Reset button
                btn.disabled = false;
                btn.innerHTML = 'Log In';
            }
        });
    }

    // Register Form Submit
    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const phone = document.getElementById('regPhone').value;
            const roleSelect = document.getElementById('role');
            if (!roleSelect) {
                registerError.textContent = 'Role selection is missing from the form.';
                registerError.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = 'Sign Up';
                return;
            }
            const role = roleSelect.value;
            const departmentId = Number(document.getElementById('regDept').value);
            const password = document.getElementById('regPassword').value;
            
            const btn = registerForm.querySelector('button[type="submit"]');
            
            // Loading state
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';
            registerError.classList.add('hidden');

            try {
                const res = await window.api.register({
                    name,
                    email,
                    role,
                    departmentId,
                    password,
                    level: null,
                    phone
                });
                
                alert(res.message || 'Registration successful. Please login.');
                if (typeof switchForm === 'function') switchForm('login');
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginPassword').value = password;
            } catch (err) {
                registerError.textContent = err.message;
                registerError.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Sign Up';
            }
        });
    }
    };

    bootstrapAuthPage();
});
