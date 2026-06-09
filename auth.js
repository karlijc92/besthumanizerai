// auth.js — modal open/close and Supabase auth logic

const SUPABASE_URL = "https://pcsxuloradquxrfeyvab.supabase.co";
const SUPABASE_KEY = "sb_publishable_Trsj0DnJhm46dP3TAKINpw_M1nFhipX";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const navAuthArea = document.getElementById("navAuthArea");

// Open modals
document.getElementById("openLogin").addEventListener("click", () => {
  loginModal.classList.add("active");
});
document.getElementById("openSignup").addEventListener("click", () => {
  signupModal.classList.add("active");
});

// Close modals
document.getElementById("closeLogin").addEventListener("click", () => {
  loginModal.classList.remove("active");
  clearLoginForm();
});
document.getElementById("closeSignup").addEventListener("click", () => {
  signupModal.classList.remove("active");
  clearSignupForm();
});

// Close on overlay click
loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) {
    loginModal.classList.remove("active");
    clearLoginForm();
  }
});
signupModal.addEventListener("click", (e) => {
  if (e.target === signupModal) {
    signupModal.classList.remove("active");
    clearSignupForm();
  }
});

// Switch between modals
document.getElementById("switchToSignup").addEventListener("click", () => {
  loginModal.classList.remove("active");
  clearLoginForm();
  signupModal.classList.add("active");
});
document.getElementById("switchToLogin").addEventListener("click", () => {
  signupModal.classList.remove("active");
  clearSignupForm();
  loginModal.classList.add("active");
});

// Clear forms
function clearLoginForm() {
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("loginError").style.display = "none";
}
function clearSignupForm() {
  document.getElementById("signupName").value = "";
  document.getElementById("signupEmail").value = "";
  document.getElementById("signupPassword").value = "";
  document.getElementById("signupError").style.display = "none";
}

// Update nav after login/logout
function updateNav(user) {
  if (user) {
    navAuthArea.innerHTML = `
      <span style="color:#fff; margin-right:12px;">Hi, ${user.user_metadata?.full_name || user.email}</span>
      <button id="logoutBtn" style="background:#e74c3c;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Log Out</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    });
  }
}

// Check session on page load
window.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) updateNav(session.user);
});

// Login submit
document.getElementById("loginSubmit").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const errorEl = document.getElementById("loginError");

  if (!email || !password) {
    errorEl.textContent = "Please enter your email and password.";
    errorEl.style.display = "block";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = "block";
    return;
  }

  loginModal.classList.remove("active");
  clearLoginForm();
  updateNav(data.user);
});

// Signup submit
document.getElementById("signupSubmit").addEventListener("click", async () => {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const errorEl = document.getElementById("signupError");

  if (!name || !email || !password) {
    errorEl.textContent = "Please fill in all fields.";
    errorEl.style.display = "block";
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    errorEl.style.display = "block";
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });

  if (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = "block";
    return;
  }

  signupModal.classList.remove("active");
  clearSignupForm();
  errorEl.style.display = "none";

  alert("Account created! Please check your email to confirm your account, then log in.");
});
