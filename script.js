// script.js — BestHumanizerAI

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("inputText");
  const charCount = document.getElementById("charCount");

  if (input && charCount) {
    input.addEventListener("input", function () {
      charCount.innerText = input.value.length.toLocaleString() + " characters";
    });
  }
});
