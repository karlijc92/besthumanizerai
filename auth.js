// auth.js — modal open/close and Supabase auth logic

const SUPABASE_URL = "https://pcsxuloradquxrfeyvab.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjc3h1bG9yYWRxdXhyZmV5dmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTg4MDcsImV4cCI6MjA5NjU3NDgwN30.eZZ3EzSUWkgbajUGCgyrWIQ-PfipXjrZVLZc3VKcFD8";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const navAuthArea = document.getElementById("navAuthArea");

document.getElementById("openLogin")?.addEventListener("click", () => {
  loginModal.classList.add("active");
});
document.getElementById("openSignup")?.addEventListener("click", () => {
  signupModal.classList.add("active");
});

document.getElementById("closeLogin")?.addEventListener("click", () => {
  loginModal.classList.remove("active");
  clearLoginForm();
});
document.getElementById("closeSignup")?.addEventListener("click", () => {
  signupModal.classList.remove("active");
  clearSignupForm();
});

loginModal?.addEventListener("click", (e) => {
  if (e.target === loginModal) {
    loginModal.classList.remove("active");
    clearLoginForm();
  }
});
signupModal?.addEventListener("click", (e) => {
  if (e.target === signupModal) {
    signupModal.classList.remove("active");
    clearSignupForm();
  }
});

document.getElementById("switchToSignup")?.addEventListener("click", () => {
  loginModal.classList.remove("active");
  clearLoginForm();
  signupModal.classList.add("active");
});
document.getElementById("switchToLogin")?.addEventListener("click", () => {
  signupModal.classList.remove("active");
  clearSignupForm();
  loginModal.classList.add("active");
});

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

function updateNav(user) {
  if (user) {
    navAuthArea.innerHTML = `
      <a href="account.html" style="color:#111827; font-size:14px; font-weight:600; text-decoration:none; margin-right:12px;">My Account</a>
      <button id="logoutBtn" class="nav-btn-logout">Log Out</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    });
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) updateNav(session.user);
});

document.getElementById("loginSubmit")?.addEventListener("click", async () => {
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

document.getElementById("signupSubmit")?.addEventListener("click", async () => {
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

  if (data.session) {
    // Confirmation is off — user is already logged in, profile row created by DB trigger
    updateNav(data.user);
    if (typeof updateAcctBar === "function") updateAcctBar();
  } else {
    // Only happens if email confirmation gets turned back on later
    alert("Account created! Please check your email to confirm your account, then log in.");
  }
});
