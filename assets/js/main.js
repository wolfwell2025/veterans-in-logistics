(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function val(form, name) {
    var el = form.elements.namedItem(name);
    if (!el) return "";
    if (el instanceof RadioNodeList) {
      var checked = Array.prototype.find.call(el, function (n) {
        return n.checked;
      });
      return checked ? checked.value : "";
    }
    return (el.value || "").trim();
  }

  function checkedValues(form, name) {
    return Array.prototype.filter
      .call(form.querySelectorAll('[name="' + name + '"]'), function (el) {
        return el.checked;
      })
      .map(function (el) {
        return el.value;
      });
  }

  function buildMailto(subject, lines) {
    var body = lines.filter(Boolean).join("\n");
    return (
      "mailto:contact@veteransinlogistics.org" +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function showSuccess(card, title, paragraphs, summary, attachNote) {
    var panel = card.querySelector(".success-panel");
    if (!panel) return;
    panel.innerHTML = "";
    var h = document.createElement("h3");
    h.textContent = title;
    panel.appendChild(h);
    paragraphs.forEach(function (t) {
      var p = document.createElement("p");
      p.textContent = t;
      panel.appendChild(p);
    });
    if (attachNote) {
      var callout = document.createElement("div");
      callout.className = "attach-callout";
      callout.textContent = attachNote;
      panel.appendChild(callout);
    }
    if (summary) {
      var pre = document.createElement("pre");
      pre.className = "summary-pre";
      pre.textContent = summary;
      panel.appendChild(pre);
    }
    var again = document.createElement("button");
    again.type = "button";
    again.className = "btn btn-outline-light";
    again.textContent = "Submit another";
    again.addEventListener("click", function () {
      card.classList.remove("is-submitted");
      panel.classList.remove("is-visible");
      panel.innerHTML = "";
    });
    panel.appendChild(again);
    card.classList.add("is-submitted");
    panel.classList.add("is-visible");
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Veteran resume / join form
  var joinForm = document.getElementById("join-form");
  if (joinForm) {
    joinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.target;
      var roles = checkedValues(form, "preferred_roles");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!roles.length) {
        alert("Please select at least one preferred role.");
        return;
      }
      var fileInput = form.elements.namedItem("resume");
      var fileName =
        fileInput && fileInput.files && fileInput.files[0]
          ? fileInput.files[0].name
          : "(none selected)";

      var lines = [
        "Veteran resume / profile request",
        "--------------------------------",
        "Full name: " + val(form, "full_name"),
        "Email: " + val(form, "email"),
        "Phone: " + (val(form, "phone") || "n/a"),
        "Branch / service: " + val(form, "branch"),
        "MOS or rating: " + val(form, "mos"),
        "Years of service: " + val(form, "years_of_service"),
        "Preferred roles: " + (roles.length ? roles.join(", ") : "n/a"),
        "Locations willing to work: " + val(form, "locations"),
        "CDL: " + (val(form, "cdl") || "n/a"),
        "Clearance: " + (val(form, "clearance") || "n/a"),
        "LinkedIn: " + (val(form, "linkedin") || "n/a"),
        "Resume file (attach manually): " + fileName,
        "Note: " + (val(form, "note") || "n/a"),
      ];

      var summary = lines.join("\n");
      var mailto = buildMailto("Veteran resume request: " + val(form, "full_name"), lines);
      window.location.href = mailto;

      var card = form.closest(".form-card");
      showSuccess(
        card,
        "Request ready",
        [
          "Your details were packaged into an email to contact@veteransinlogistics.org. If your email client opened, review and send.",
          "We will follow up after reviewing your profile. Careers, not placements.",
        ],
        summary,
        "IMPORTANT: Email cannot attach files automatically. Please attach your resume (" +
          fileName +
          ") in the email client before sending. PDF, DOC, or DOCX preferred."
      );

      try {
        localStorage.setItem(
          "vil_join_draft",
          JSON.stringify({
            savedAt: new Date().toISOString(),
            fields: {
              full_name: val(form, "full_name"),
              email: val(form, "email"),
              phone: val(form, "phone"),
              branch: val(form, "branch"),
              mos: val(form, "mos"),
              years_of_service: val(form, "years_of_service"),
              preferred_roles: roles,
              locations: val(form, "locations"),
              cdl: val(form, "cdl"),
              clearance: val(form, "clearance"),
              linkedin: val(form, "linkedin"),
              note: val(form, "note"),
              resume_filename: fileName,
            },
          })
        );
      } catch (err) {
        /* ignore storage errors */
      }
    });
  }

  // Sponsor / JD form
  var sponsorForm = document.getElementById("sponsor-form");
  if (sponsorForm) {
    sponsorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.target;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!val(form, "jd_url") && !val(form, "jd_text")) {
        alert("Please provide a job description URL or paste the JD text.");
        return;
      }
      var veteranFriendly = form.elements.namedItem("veteran_friendly");
      var lines = [
        "Company job description / sponsor interest",
        "------------------------------------------",
        "Company: " + val(form, "company_name"),
        "Contact name: " + val(form, "contact_name"),
        "Contact email: " + val(form, "contact_email"),
        "Role title: " + val(form, "role_title"),
        "Location: " + val(form, "location"),
        "JD URL: " + (val(form, "jd_url") || "n/a"),
        "JD text: " + (val(form, "jd_text") || "n/a"),
        "Veteran-friendly role: " +
          (veteranFriendly && veteranFriendly.checked ? "Yes" : "No"),
        "Sponsor interest notes: " + (val(form, "sponsor_notes") || "n/a"),
      ];
      var summary = lines.join("\n");
      window.location.href = buildMailto(
        "Sponsor / JD: " + val(form, "company_name") + " / " + val(form, "role_title"),
        lines
      );
      // Note: subject above has em dash in code path for email subject - user said user-facing text.
      // Fix: avoid em dash in subject too for consistency.
      showSuccess(
        form.closest(".form-card"),
        "Submission ready",
        [
          "Your job details were packaged into an email to contact@veteransinlogistics.org. If your email client opened, review and send.",
          "Our team reviews submissions before any outreach. Thank you for investing in veteran talent.",
        ],
        summary,
        null
      );
    });
  }

  // Founders interest form
  var foundersForm = document.getElementById("founders-form");
  if (foundersForm) {
    foundersForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.target;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var lines = [
        "Founding membership interest",
        "----------------------------",
        "Full name: " + val(form, "full_name"),
        "Email: " + val(form, "email"),
        "Organization: " + (val(form, "organization") || "n/a"),
        "Role / title: " + (val(form, "title") || "n/a"),
        "How you want to engage: " + (val(form, "engagement") || "n/a"),
        "Note: " + (val(form, "note") || "n/a"),
      ];
      var summary = lines.join("\n");
      window.location.href = buildMailto(
        "Founding membership interest: " + val(form, "full_name"),
        lines
      );
      showSuccess(
        form.closest(".form-card"),
        "Interest recorded",
        [
          "Your founding seat interest was packaged into an email to contact@veteransinlogistics.org. If your email client opened, review and send.",
          "Only 25 founding seats exist. We will follow up with next steps.",
        ],
        summary,
        null
      );
    });
  }
})();
