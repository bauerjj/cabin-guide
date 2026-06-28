function toggleMobileMenu() {
  var overlay = document.getElementById("mobileMenuOverlay");
  overlay.classList.toggle("is-open");
  document.body.style.overflow = overlay.classList.contains("is-open") ? "hidden" : "";
}

// Close overlay when tapping outside the sheet
var overlay = document.getElementById("mobileMenuOverlay");
if (overlay) {
  overlay.addEventListener("click", function(e) {
    if (e.target === this) toggleMobileMenu();
  });
}

// FAQ accordion
document.querySelectorAll(".faq-item__question").forEach(function(q) {
  q.addEventListener("click", function() {
    this.closest(".faq-item").classList.toggle("is-open");
  });
});
