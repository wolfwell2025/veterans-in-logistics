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

  // ---------- UTM capture ----------
  // Saves utm_* params from the landing URL, carries them onto internal
  // links (join, sponsor, founders), and fills hidden form fields.
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var UTM_STORE = "vil_utm";

  function readUtm() {
    var stored = {};
    try {
      stored = JSON.parse(sessionStorage.getItem(UTM_STORE) || "{}") || {};
    } catch (err) {
      stored = {};
    }
    var params = new URLSearchParams(window.location.search);
    var fresh = {};
    var hasFresh = false;
    UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) {
        fresh[k] = v.slice(0, 120);
        hasFresh = true;
      }
    });
    var utm = hasFresh ? fresh : stored;
    if (hasFresh) {
      try {
        sessionStorage.setItem(UTM_STORE, JSON.stringify(utm));
      } catch (err) {
        /* storage blocked */
      }
    }
    return utm;
  }

  var utm = readUtm();

  function decorateLinks() {
    if (!Object.keys(utm).length) return;
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto|tel|javascript):/i.test(href)) return;
      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (err) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (!/\.html$|\/$/.test(url.pathname)) return;
      Object.keys(utm).forEach(function (k) {
        if (!url.searchParams.has(k)) url.searchParams.set(k, utm[k]);
      });
      a.setAttribute("href", url.href);
    });
  }
  decorateLinks();

  function fillHidden(form) {
    UTM_KEYS.forEach(function (k) {
      var el = form.elements.namedItem(k);
      if (el && utm[k]) el.value = utm[k];
    });
    var page = form.elements.namedItem("page");
    if (page) page.value = window.location.href.split("#")[0];
    var heard = form.querySelector("[data-utm-prefill]");
    if (heard && utm.utm_source && !heard.value) {
      var src = utm.utm_source.toLowerCase();
      var aliases = { ig: "instagram", fb: "facebook", li: "linkedin", twitter: "x", yt: "youtube", tt: "tiktok", google: "search", bing: "search" };
      src = aliases[src] || src;
      var match = Array.prototype.find.call(heard.options, function (o) {
        return o.value && o.value.toLowerCase() === src;
      });
      if (match) {
        heard.value = match.value;
      } else {
        heard.value = "Other";
        var other = form.elements.namedItem("heard_from_other");
        if (other && !other.value) other.value = utm.utm_source;
      }
    }
  }

  // ---------- Form submission (FormSubmit.co backend, mailto fallback) ----------
  var CONTACT = "contact@veteransinlogistics.org";

  function groupLabel(form, name) {
    var group = form.querySelector('[data-required-group="' + name + '"]');
    var id = group && group.getAttribute("aria-labelledby");
    var label = id && document.getElementById(id);
    return label ? label.textContent.replace("*", "").trim() : name;
  }

  function validate(form) {
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    var groups = form.querySelectorAll("[data-required-group]");
    for (var i = 0; i < groups.length; i++) {
      var name = groups[i].getAttribute("data-required-group");
      if (!checkedValues(form, name).length) {
        alert("Please choose at least one option for: " + groupLabel(form, name));
        groups[i].querySelector("input").focus();
        return false;
      }
    }
    if (form.id === "join-form" && !val(form, "resume_url") && !val(form, "linkedin")) {
      alert("Please share a link to your resume or your LinkedIn URL.");
      return false;
    }
    if (form.id === "sponsor-form" && !val(form, "jd_url") && !val(form, "jd_text")) {
      alert("Please share a careers page or job link, or paste the job description.");
      return false;
    }
    return true;
  }

  function buildPayload(form) {
    var data = new FormData();
    var seenGroups = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === "checkbox" && form.querySelectorAll('[name="' + el.name + '"]').length > 1) {
        if (seenGroups[el.name]) return;
        seenGroups[el.name] = true;
        data.append(el.name, checkedValues(form, el.name).join(", "));
        return;
      }
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) return;
      if (el.type === "file") {
        if (el.files && el.files[0]) data.append(el.name, el.files[0], el.files[0].name);
        return;
      }
      if (el.tagName === "BUTTON") return;
      data.append(el.name, el.value);
    });
    var who = val(form, "full_name") || val(form, "company_name") || val(form, "email");
    var subject = (form.getAttribute("data-subject") || "VIL submission") + ": " + who;
    data.set("_subject", subject);
    data.append("submitted_at", new Date().toISOString());
    return { data: data, subject: subject };
  }

  function summaryLines(payload) {
    var lines = [];
    payload.data.forEach(function (v, k) {
      if (k.charAt(0) === "_" || v === "") return;
      if (typeof v !== "string") v = "(file: " + v.name + ", please attach)";
      lines.push(k.replace(/_/g, " ") + ": " + v);
    });
    return lines;
  }

  function showError(form, payload) {
    var box = form.querySelector(".form-error");
    var mailto = buildMailto(payload.subject, summaryLines(payload));
    if (box) {
      box.innerHTML = "";
      box.appendChild(document.createTextNode("We could not send your form just now. "));
      var a = document.createElement("a");
      a.href = mailto;
      a.textContent = "Email it to " + CONTACT + " instead";
      box.appendChild(a);
      box.appendChild(document.createTextNode(", or try again in a minute."));
      box.classList.add("is-visible");
    }
    window.location.href = mailto;
  }

  function wireForm(form, success) {
    fillHidden(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var honey = form.elements.namedItem("_honey");
      if (honey && honey.value) return; // bot
      if (!validate(form)) return;
      var payload = buildPayload(form);
      var btn = form.querySelector('button[type="submit"]');
      var errBox = form.querySelector(".form-error");
      if (errBox) errBox.classList.remove("is-visible");
      if (btn) btn.disabled = true;
      var endpoint = form.getAttribute("action").replace("formsubmit.co/", "formsubmit.co/ajax/");
      fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: payload.data,
        // The host sends no referrer by default; FormSubmit needs the page URL.
        referrer: window.location.origin + window.location.pathname,
        referrerPolicy: "no-referrer-when-downgrade",
      })
        .then(function (res) {
          return res.json().catch(function () {
            return {};
          }).then(function (json) {
            if (!res.ok || String(json.success) !== "true") throw new Error(json.message || "Send failed");
            return json;
          });
        })
        .then(function () {
          form.reset();
          fillHidden(form);
          showSuccess(form.closest(".form-card"), success.title, success.body, null, null);
        })
        .catch(function () {
          showError(form, payload);
        })
        .then(function () {
          if (btn) btn.disabled = false;
        });
    });
  }

  var joinForm = document.getElementById("join-form");
  if (joinForm) {
    wireForm(joinForm, {
      title: "Profile received",
      body: [
        "Thank you. Your profile is with the Veterans in Logistics team.",
        "A person reviews every profile before any outreach. We will contact you by email when we have a fit. Careers, not placements.",
      ],
    });
  }

  var sponsorForm = document.getElementById("sponsor-form");
  if (sponsorForm) {
    wireForm(sponsorForm, {
      title: "Submission received",
      body: [
        "Thank you. Your hiring details are with the Veterans in Logistics team.",
        "We will follow up by email. We review both sides before any introductions.",
      ],
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
