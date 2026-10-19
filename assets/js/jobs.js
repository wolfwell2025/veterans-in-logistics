/* Veterans in Logistics: jobs page and MOS lookup. Data: data/jobs.json, data/meta.json, data/mos.json */
(function () {
  "use strict";

  var PAGE_SIZE = 20;
  var STATES = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
    DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
    IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
    NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
    NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
    RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
    VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico"
  };
  var CAT_LABELS = {
    driving_cdl: "Driving / CDL", maintenance_technician: "Maintenance / Technician", warehouse_dock: "Warehouse / Dock",
    dispatch_operations: "Dispatch / Operations", brokerage_sales: "Brokerage / Sales", tech_data: "Tech / Data",
    management: "Management", other: "Other"
  };
  var CAT_ORDER = ["driving_cdl", "maintenance_technician", "warehouse_dock", "dispatch_operations", "brokerage_sales", "tech_data", "management", "other"];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function fmtUpdated(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago", timeZoneName: "short" });
  }

  function utmQuery() {
    try {
      var u = JSON.parse(sessionStorage.getItem("vil_utm") || "{}");
      var p = new URLSearchParams();
      Object.keys(u).forEach(function (k) { p.set(k, u[k]); });
      return p.toString();
    } catch (e) {
      return "";
    }
  }

  function joinUrl(extra) {
    var p = new URLSearchParams(utmQuery());
    Object.keys(extra || {}).forEach(function (k) { if (extra[k]) p.set(k, extra[k]); });
    var q = p.toString();
    return "join.html" + (q ? "?" + q : "");
  }

  function jobCard(j, badge) {
    var li = el("li", "job-card");
    var top = el("div", "job-top");
    var h = el("h3", "job-title");
    var a = el("a", null, j.title);
    a.href = j.url;
    a.target = "_blank";
    a.rel = "noopener";
    h.appendChild(a);
    top.appendChild(h);
    if (badge) top.appendChild(el("span", "tag tag-green", badge));
    li.appendChild(top);
    li.appendChild(el("p", "job-employer", j.employer));
    var meta = el("p", "job-meta");
    meta.appendChild(el("span", null, j.location || "United States"));
    if (j.posted) meta.appendChild(el("span", null, "Posted " + fmtDate(j.posted)));
    li.appendChild(meta);
    var tags = el("div", "job-tags");
    tags.appendChild(el("span", "tag", CAT_LABELS[j.category] || "Other"));
    if (j.cdl) tags.appendChild(el("span", "tag tag-green", "CDL"));
    if (j.remote) tags.appendChild(el("span", "tag", "Remote"));
    li.appendChild(tags);
    var apply = el("a", "job-apply", "Apply at " + j.employer + " ↗");
    apply.href = j.url;
    apply.target = "_blank";
    apply.rel = "noopener";
    apply.setAttribute("aria-label", "Apply for " + j.title + " at " + j.employer + " (opens employer site)");
    li.appendChild(apply);
    return li;
  }

  function inlineCta() {
    var li = el("li", "job-card job-cta");
    li.appendChild(el("h3", "job-title", "Want a person to find the right fit?"));
    li.appendChild(el("p", null, "Share your service background once. We match you with employers hiring for your skills."));
    var a = el("a", "btn btn-green", "Get Matched →");
    a.href = joinUrl();
    li.appendChild(a);
    return li;
  }

  /* ---------------- Jobs page ---------------- */
  function initJobs() {
    var list = document.getElementById("job-list");
    if (!list) return;
    var form = document.getElementById("job-filters");
    var countEl = document.getElementById("results-count");
    var pager = document.getElementById("pager");
    var updated = document.getElementById("jobs-updated");
    var source = document.getElementById("jobs-source");
    var socNote = document.getElementById("soc-note");
    var all = [];
    var page = 1;
    var socFilter = null;

    function readState() {
      var p = new URLSearchParams(location.search);
      form.q.value = p.get("q") || "";
      form.cat.value = p.get("cat") || "";
      form.state.value = p.get("state") || "";
      form.emp.value = p.get("emp") || "";
      form.cdl.checked = p.get("cdl") === "1";
      form.remote.checked = p.get("remote") === "1";
      page = Math.max(1, parseInt(p.get("page") || "1", 10) || 1);
      socFilter = p.get("soc") ? p.get("soc").split(",").filter(Boolean) : null;
    }

    function writeState() {
      var p = new URLSearchParams(location.search);
      [["q", form.q.value.trim()], ["cat", form.cat.value], ["state", form.state.value], ["emp", form.emp.value],
       ["cdl", form.cdl.checked ? "1" : ""], ["remote", form.remote.checked ? "1" : ""], ["page", page > 1 ? String(page) : ""],
       ["soc", socFilter ? socFilter.join(",") : ""]].forEach(function (kv) {
        if (kv[1]) p.set(kv[0], kv[1]); else p.delete(kv[0]);
      });
      var q = p.toString();
      history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
    }

    function filtered() {
      var q = form.q.value.trim().toLowerCase();
      var words = q ? q.split(/\s+/) : [];
      var cat = form.cat.value, st = form.state.value, emp = form.emp.value;
      var cdl = form.cdl.checked, remote = form.remote.checked;
      return all.filter(function (j) {
        if (cat && j.category !== cat) return false;
        if (st && j.state !== st) return false;
        if (emp && j.employer !== emp) return false;
        if (cdl && !j.cdl) return false;
        if (remote && !j.remote) return false;
        if (socFilter && !(j.onet && socFilter.indexOf(j.onet.slice(0, 7)) !== -1)) return false;
        if (words.length) {
          var hay = j._hay;
          for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
        }
        return true;
      });
    }

    function render() {
      var rows = filtered();
      var pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      if (page > pages) page = pages;
      var start = (page - 1) * PAGE_SIZE;
      var slice = rows.slice(start, start + PAGE_SIZE);
      countEl.textContent = rows.length
        ? rows.length.toLocaleString() + (rows.length === 1 ? " job" : " jobs") + (rows.length > PAGE_SIZE ? " · showing " + (start + 1) + " to " + (start + slice.length) : "")
        : "No jobs match these filters.";
      var frag = document.createDocumentFragment();
      slice.forEach(function (j, i) {
        frag.appendChild(jobCard(j));
        if (i === 9 && slice.length > 12) frag.appendChild(inlineCta());
      });
      if (!slice.length) frag.appendChild(inlineCta());
      list.innerHTML = "";
      list.appendChild(frag);
      pager.innerHTML = "";
      if (pages > 1) {
        var prev = el("button", "btn btn-outline-light btn-sm", "← Prev");
        prev.type = "button";
        prev.disabled = page <= 1;
        prev.addEventListener("click", function () { page--; update(true); });
        var next = el("button", "btn btn-outline-light btn-sm", "Next →");
        next.type = "button";
        next.disabled = page >= pages;
        next.addEventListener("click", function () { page++; update(true); });
        pager.appendChild(prev);
        pager.appendChild(el("span", "pager-label", "Page " + page + " of " + pages));
        pager.appendChild(next);
      }
      writeState();
    }

    function update(scroll) {
      render();
      if (scroll) document.querySelector(".results-bar").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    var t;
    form.addEventListener("input", function (e) {
      page = 1;
      clearTimeout(t);
      t = setTimeout(render, e.target.type === "search" ? 150 : 0);
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); page = 1; render(); });
    document.getElementById("f-clear").addEventListener("click", function () {
      form.reset();
      socFilter = null;
      socNote.hidden = true;
      page = 1;
      render();
    });

    Promise.all([getJSON("data/jobs.json"), getJSON("data/meta.json").catch(function () { return null; })])
      .then(function (res) {
        all = res[0].jobs || [];
        all.forEach(function (j) {
          j._hay = (j.title + " " + j.employer + " " + (j.location || "") + " " + (j.city || "")).toLowerCase();
        });
        var meta = res[1];
        var cats = {}, states = {}, emps = {};
        all.forEach(function (j) {
          cats[j.category] = (cats[j.category] || 0) + 1;
          if (j.state) states[j.state] = (states[j.state] || 0) + 1;
          emps[j.employer] = (emps[j.employer] || 0) + 1;
        });
        CAT_ORDER.forEach(function (c) {
          if (cats[c]) form.cat.appendChild(new Option(CAT_LABELS[c] + " (" + cats[c] + ")", c));
        });
        Object.keys(states).sort(function (a, b) { return (STATES[a] || a).localeCompare(STATES[b] || b); }).forEach(function (s) {
          form.state.appendChild(new Option((STATES[s] || s) + " (" + states[s] + ")", s));
        });
        Object.keys(emps).sort().forEach(function (e) {
          form.emp.appendChild(new Option(e + " (" + emps[e] + ")", e));
        });
        var when = fmtUpdated((meta && meta.updated_at) || res[0].updated_at);
        updated.textContent = all.length.toLocaleString() + " open roles from " + Object.keys(emps).length + " employers" + (when ? " · Updated " + when : "");
        if (source) source.textContent = "Listings come from public job feeds on each employer's own careers site and refresh daily. Veterans in Logistics is not the employer and does not process applications. Categories and CDL flags are based on job titles and descriptions and may not be exact.";
        readState();
        if (socFilter) {
          socNote.hidden = false;
          socNote.textContent = "Showing jobs that line up with the civilian occupations for your military code. ";
          var clr = el("a", null, "Show all jobs");
          clr.href = "jobs.html";
          socNote.appendChild(clr);
        }
        render();
      })
      .catch(function () {
        updated.textContent = "Jobs could not load right now. Please try again in a minute.";
        countEl.textContent = "";
      });
  }

  /* ---------------- MOS lookup ---------------- */
  function initMos() {
    var form = document.getElementById("mos-form");
    if (!form) return;
    var out = document.getElementById("mos-result");
    var mos = null, jobs = null;
    var loading = Promise.all([getJSON("data/mos.json"), getJSON("data/jobs.json")]).then(function (r) {
      mos = r[0];
      jobs = r[1].jobs || [];
    });

    function norm(s) { return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }

    function findCodes(branch, input) {
      var rows = mos.codes.filter(function (r) { return r[0] === branch; });
      var n = norm(input);
      if (!n) return { exact: [], options: [] };
      var exact = rows.filter(function (r) { return norm(r[1]) === n; });
      if (!exact.length && /X/.test(n)) {
        var rx = new RegExp("^" + n.replace(/X/g, "\\d") + "$");
        exact = rows.filter(function (r) { return rx.test(norm(r[1])); });
      }
      if (exact.length) return { exact: exact, options: [] };
      var words = input.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });
      var options = rows.filter(function (r) {
        var t = r[2].toLowerCase();
        return norm(r[1]).indexOf(n) === 0 || (words.length && words.every(function (w) { return t.indexOf(w) !== -1; }));
      }).slice(0, 12);
      return { exact: [], options: options };
    }

    function showResult(branch, rows, typed) {
      out.innerHTML = "";
      var socs = {}, cats = {};
      rows.forEach(function (r) {
        r[3].forEach(function (c) {
          socs[c.slice(0, 7)] = true;
          var o = mos.onet[c];
          if (o) cats[o[1]] = true;
        });
      });
      var socList = Object.keys(socs);
      var card = el("div", "mos-card");
      var codeLabel = rows.length === 1 ? rows[0][1] : typed.toUpperCase();
      var title = rows.length === 1 ? rows[0][2] : rows.map(function (r) { return r[1]; }).slice(0, 6).join(", ");
      card.appendChild(el("p", "section-label", branch + " · " + codeLabel));
      card.appendChild(el("h2", "mos-title", title));
      card.appendChild(el("p", "mos-sub", "Lines up with these civilian occupations:"));
      var ul = el("ul", "onet-list");
      var seen = {};
      rows.forEach(function (r) {
        r[3].forEach(function (c) {
          if (seen[c] || !mos.onet[c]) return;
          seen[c] = true;
          var li = el("li");
          li.appendChild(el("span", "onet-title", mos.onet[c][0]));
          li.appendChild(el("span", "tag", CAT_LABELS[mos.onet[c][1]] || ""));
          ul.appendChild(li);
        });
      });
      card.appendChild(ul);
      out.appendChild(card);

      var direct = jobs.filter(function (j) { return j.onet && socs[j.onet.slice(0, 7)]; });
      var directSet = {};
      direct.forEach(function (j) { directSet[j.url] = true; });
      var related = jobs.filter(function (j) { return !directSet[j.url] && cats[j.category]; });
      var head = el("div", "results-bar");
      head.appendChild(el("p", "results-count",
        direct.length.toLocaleString() + " live jobs match directly" + (related.length ? " · " + related.length.toLocaleString() + " more in related categories" : "")));
      out.appendChild(head);
      var list = el("ol", "job-list");
      direct.slice(0, 8).forEach(function (j) { list.appendChild(jobCard(j, "Direct match")); });
      related.slice(0, Math.max(0, 8 - Math.min(direct.length, 8))).forEach(function (j) { list.appendChild(jobCard(j, "Related")); });
      if (!direct.length && !related.length) list.appendChild(el("li", "job-card", "No live openings match this code right now. New jobs are added daily."));
      out.appendChild(list);
      var actions = el("div", "mos-actions");
      if (direct.length) {
        var all = el("a", "btn btn-outline-light", "See all " + direct.length.toLocaleString() + " matching jobs →");
        all.href = "jobs.html?soc=" + encodeURIComponent(socList.join(","));
        actions.appendChild(all);
      }
      out.appendChild(actions);
      var cta = el("div", "cta-card");
      var txt = el("div");
      txt.appendChild(el("h2", null, "Get matched as " + branch + " " + codeLabel + "."));
      txt.appendChild(el("p", null, "We start your profile with this code. A person reviews it and introduces you to employers hiring for these roles."));
      cta.appendChild(txt);
      var go = el("a", "btn btn-green btn-lg", "Get Matched →");
      go.href = joinUrl({ branch: branch, mos_code: codeLabel, mos_title: rows.length === 1 ? rows[0][2] : "" });
      cta.appendChild(go);
      out.appendChild(cta);
    }

    function lookup() {
      var branch = form.branch.value;
      var typed = form.code.value.trim();
      if (!typed) return;
      var p = new URLSearchParams(location.search);
      p.set("branch", branch);
      p.set("code", typed);
      history.replaceState(null, "", location.pathname + "?" + p.toString());
      loading.then(function () {
        var res = findCodes(branch, typed);
        if (res.exact.length) return showResult(branch, res.exact, typed);
        out.innerHTML = "";
        var box = el("div", "mos-card");
        if (res.options.length) {
          box.appendChild(el("p", "mos-sub", "Pick your code:"));
          var opts = el("div", "check-group");
          res.options.forEach(function (r) {
            var b = el("button", "check-pill", r[1] + " · " + r[2]);
            b.type = "button";
            b.addEventListener("click", function () { form.code.value = r[1]; lookup(); });
            opts.appendChild(b);
          });
          box.appendChild(opts);
        } else {
          box.appendChild(el("h2", "mos-title", "No logistics match for " + typed + " in the " + branch + " list."));
          box.appendChild(el("p", "mos-sub", "This lookup only includes codes that the O*NET crosswalk ties to logistics occupations. Your experience may still fit. Browse all jobs or tell us about yourself and a person will review it."));
          var acts = el("div", "mos-actions");
          var a1 = el("a", "btn btn-outline-light", "Browse all jobs →");
          a1.href = "jobs.html";
          var a2 = el("a", "btn btn-green", "Get Matched →");
          a2.href = joinUrl({ branch: branch, mos_code: typed.toUpperCase() });
          acts.appendChild(a1);
          acts.appendChild(a2);
          box.appendChild(acts);
        }
        out.appendChild(box);
      }).catch(function () {
        out.textContent = "The lookup could not load right now. Please try again in a minute.";
      });
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); lookup(); });
    var p = new URLSearchParams(location.search);
    if (p.get("branch")) form.branch.value = p.get("branch");
    if (p.get("code")) { form.code.value = p.get("code"); lookup(); }
  }

  initJobs();
  initMos();
})();
