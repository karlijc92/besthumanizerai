// auth.js — modal open/close and auth logic

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

// Login submit — placeholder until Supabase is connected
document.getElementById("loginSubmit").addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const errorEl = document.getElementById("loginError");

  if (!email || !password) {
    errorEl.textContent = "Please enter your email and password.";
    errorEl.style.display = "block";
    return;
  }

  // Placeholder — replace with Supabase call next step
  errorEl.textContent = "Login coming soon. Supabase integration next.";
  errorEl.style.display = "block";
});

// Signup submit — placeholder until Supabase is connected
document.getElementById("signupSubmit").addEventListener("click", () => {
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

  // Placeholder — replace with Supabase call next step
  errorEl.textContent = "Signup coming soon. Supabase integration next.";
  errorEl.style.display = "block";
});
