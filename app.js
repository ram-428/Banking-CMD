const STORAGE_KEY = "banking-cmd-customers-v2";

const MANAGERS = ["Sara Al Maktoum", "James Okonkwo", "Priya Nair", "Omar Farouk"];

const REQUIREMENTS = [
  "Current Account",
  "Trade Finance",
  "Working Capital Finance",
  "Term Loan",
  "Cash Management",
  "Treasury Services",
  "Letters of Credit",
  "Bank Guarantee"
];

const CUSTOMER_TYPES = [
  "Individual",
  "Company",
  "Sole Proprietorship",
  "Partnership",
  "Government / Organization"
];

const SEED = [
  {
    id: "CUST-1001",
    customerType: "Company",
    companyName: "Horizon Trading LLC",
    tradeLicenseNumber: "TL-88421",
    contactPerson: "Layla Hassan",
    mobile: "+971 50 441 2201",
    email: "layla.hassan@horizon-trading.example",
    bankingRequirement: "Trade Finance",
    relationshipManager: "Sara Al Maktoum",
    status: "Active"
  },
  {
    id: "CUST-1002",
    customerType: "Sole Proprietorship",
    companyName: "Cedar Foods LLC",
    tradeLicenseNumber: "TL-22018",
    contactPerson: "Amina Rahman",
    mobile: "+971 55 902 1184",
    email: "amina.rahman@cedar-foods.example",
    bankingRequirement: "Working Capital Finance",
    relationshipManager: "Priya Nair",
    status: "Active"
  },
  {
    id: "CUST-1003",
    customerType: "Partnership",
    companyName: "Northline Logistics Ltd",
    tradeLicenseNumber: "TL-55190",
    contactPerson: "Daniel Crowe",
    mobile: "+971 52 330 7740",
    email: "daniel.crowe@northline.example",
    bankingRequirement: "Letters of Credit",
    relationshipManager: "Omar Farouk",
    status: "Inactive"
  }
];

const $ = (id) => document.getElementById(id);

const els = {
  rows: $("customer-rows"),
  count: $("record-count"),
  empty: $("empty-state"),
  emptyTitle: $("empty-title"),
  emptyCopy: $("empty-copy"),
  search: $("search"),
  statusFilter: $("status-filter"),
  addBtn: $("add-btn"),
  dialog: $("customer-dialog"),
  form: $("customer-form"),
  title: $("dialog-title"),
  sub: $("dialog-sub"),
  saveBtn: $("save-btn"),
  cancelBtn: $("cancel-btn"),
  toast: $("toast")
};

let customers = load();
let editingId = null;
let toastTimer = 0;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED.map((row) => ({ ...row }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((row) => row && row.companyName)) {
      return SEED.map((row) => ({ ...row }));
    }
    if (!parsed.some((row) => row.customerType)) {
      return SEED.map((row) => ({ ...row }));
    }
    return parsed.map((row) => ({
      ...row,
      customerType: row.customerType || "",
      status: row.status === "Inactive" ? "Inactive" : "Active"
    }));
  } catch {
    return SEED.map((row) => ({ ...row }));
  }
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

function nextId() {
  const max = customers.reduce((highest, row) => {
    const n = Number(String(row.id).replace(/\D/g, "")) || 0;
    return Math.max(highest, n);
  }, 1000);
  return `CUST-${String(max + 1).padStart(4, "0")}`;
}

function fillSelect(select, options, placeholder, selected) {
  select.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = placeholder;
  select.appendChild(blank);
  options.forEach((option) => {
    const node = document.createElement("option");
    node.value = option;
    node.textContent = option;
    select.appendChild(node);
  });
  select.value = options.includes(selected) ? selected : "";
}

function initLookups() {
  fillSelect($("relationship-manager"), MANAGERS, "Select relationship manager", "");
  fillSelect($("banking-requirement"), REQUIREMENTS, "Select banking requirement", "");
}

function statusClass(status) {
  if (status === "Active") return "pill-active";
  return "pill-inactive";
}

function filtered() {
  const query = els.search.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  return customers.filter((row) => {
    const haystack = `${row.id} ${row.companyName} ${row.customerType} ${row.tradeLicenseNumber} ${row.contactPerson} ${row.email} ${row.mobile} ${row.relationshipManager}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = !status || row.status === status;
    return matchesQuery && matchesStatus;
  });
}

function render() {
  const rows = filtered();
  els.count.textContent = `${customers.length} record${customers.length === 1 ? "" : "s"}`;
  els.rows.innerHTML = "";

  const showEmpty = rows.length === 0;
  els.empty.hidden = !showEmpty;
  if (showEmpty) {
    const filtering = els.search.value.trim() || els.statusFilter.value;
    els.emptyTitle.textContent = filtering ? "No matching customers" : "No customers yet";
    els.emptyCopy.textContent = filtering
      ? "Try a different company, ID, license, or status."
      : "Add the first customer to start the registry.";
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="id-cell"></td>
      <td class="name-main"></td>
      <td></td>
      <td></td>
      <td></td>
      <td class="nowrap"></td>
      <td></td>
      <td></td>
      <td><span class="pill"></span></td>
      <td class="col-actions">
        <button type="button" class="row-btn" data-action="view" aria-label="View">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4-6.5-4-6.5-4z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="1.8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
        </button>
        <button type="button" class="row-btn" data-action="edit" aria-label="Edit">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.2 3.2 12.8 6.8 5.5 14.1H2v-3.5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        </button>
      </td>`;
    const cells = tr.children;
    cells[0].textContent = row.id;
    cells[1].textContent = row.companyName;
    cells[2].textContent = row.customerType || "";
    cells[3].textContent = row.tradeLicenseNumber;
    cells[4].textContent = row.contactPerson;
    cells[5].textContent = row.mobile;
    cells[6].textContent = row.email;
    cells[7].textContent = row.relationshipManager;
    const pill = cells[8].querySelector(".pill");
    pill.textContent = row.status;
    pill.classList.add(statusClass(row.status));
    cells[9].querySelector('[data-action="view"]').addEventListener("click", () => openForm(row.id, "view"));
    cells[9].querySelector('[data-action="edit"]').addEventListener("click", () => openForm(row.id, "edit"));
    els.rows.appendChild(tr);
  });
  renderDashboard();
}

function renderDashboard() {
  const count = (status) => customers.filter((row) => row.status === status).length;
  const active = count("Active");
  const inactive = count("Inactive");
  const total = customers.length;
  $("stat-total").textContent = String(total);
  $("stat-active").textContent = String(active);

  const recent = $("recent-list");
  const latest = customers.slice(0, 4);
  recent.innerHTML = "";
  $("recent-empty").hidden = latest.length > 0;
  latest.forEach((row) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-item";
    const initials = row.companyName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();
    button.innerHTML = `<span class="avatar-sm"></span><span><strong></strong><small></small></span><span class="pill"></span>`;
    button.querySelector(".avatar-sm").textContent = initials || "C";
    button.querySelector("strong").textContent = row.companyName;
    button.querySelector("small").textContent = row.relationshipManager;
    const pill = button.querySelector(".pill");
    pill.textContent = row.status;
    pill.classList.add(statusClass(row.status));
    button.addEventListener("click", () => openForm(row.id, "view"));
    recent.appendChild(button);
  });

  const max = Math.max(active, inactive, 1);
  const barHost = $("status-bars");
  barHost.innerHTML = "";
  [
    ["Active", active, "bar-navy"],
    ["Inactive", inactive, "bar-orange"]
  ].forEach(([label, value, tone]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bar-col";
    button.innerHTML = `<span class="bar-track"><span class="bar-fill ${tone}"></span></span><strong></strong><span></span>`;
    button.querySelector(".bar-fill").style.height = `${Math.round((value / max) * 100)}%`;
    button.querySelector("strong").textContent = String(value);
    button.lastElementChild.textContent = label;
    button.addEventListener("click", () => openCustomers(label));
    barHost.appendChild(button);
  });

  const safe = total || 1;
  const activeSweep = (active / safe) * 360;
  $("status-donut").style.background = total
    ? `conic-gradient(var(--navy) 0 ${activeSweep}deg, var(--accent) ${activeSweep}deg 360deg)`
    : "oklch(0.9 0.01 265)";

  const legend = $("status-legend");
  legend.innerHTML = "";
  [
    ["Active", active, "swatch-navy"],
    ["Inactive", inactive, "swatch-orange"]
  ].forEach(([label, value, swatch]) => {
    const item = document.createElement("li");
    const percent = total ? Math.round((value / total) * 100) : 0;
    item.innerHTML = `<span class="swatch ${swatch}"></span><span></span>`;
    item.lastElementChild.textContent = `${percent}% ${label}`;
    legend.appendChild(item);
  });
}

function showPage(page) {
  const next = page === "customers" ? "customers" : "dashboard";
  $("page-dashboard").hidden = next !== "dashboard";
  $("page-customers").hidden = next !== "customers";
  document.querySelectorAll(".nav-item").forEach((item) => {
    const active = item.dataset.page === next;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  const pageName = next === "dashboard" ? "Dashboard" : "Customers";
  $("page-title").textContent = pageName;
  document.title = `${pageName} · Banking CMD`;
  if (location.hash !== `#${next}`) history.replaceState(null, "", `#${next}`);
  document.querySelector(".shell").classList.remove("is-nav-open");
  window.scrollTo(0, 0);
}

function openCustomers(status) {
  els.statusFilter.value = status || "";
  render();
  showPage("customers");
}

function clearErrors() {
  els.form.querySelectorAll(".field").forEach((field) => field.classList.remove("is-invalid"));
  els.form.querySelectorAll(".error").forEach((node) => {
    node.textContent = "";
  });
}

function showErrors(errors) {
  Object.entries(errors).forEach(([name, message]) => {
    const input = els.form.elements[name];
    const error = els.form.querySelector(`[data-for="${name}"]`);
    if (input) input.closest(".field")?.classList.add("is-invalid");
    if (error) error.textContent = message;
  });
  const first = els.form.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea");
  first?.focus();
}

function readForm() {
  const data = new FormData(els.form);
  const value = (key) => String(data.get(key) || "").trim();
  return {
    id: value("id"),
    customerType: value("customerType"),
    companyName: value("companyName"),
    tradeLicenseNumber: value("tradeLicenseNumber"),
    contactPerson: value("contactPerson"),
    mobile: value("mobile"),
    email: value("email"),
    bankingRequirement: value("bankingRequirement"),
    relationshipManager: value("relationshipManager"),
    status: value("status")
  };
}

function validate(record) {
  const errors = {};
  const required = {
    customerType: "Select a customer type.",
    companyName: "Enter the company name.",
    tradeLicenseNumber: "Enter the trade license number.",
    contactPerson: "Enter the contact person.",
    mobile: "Enter the mobile number.",
    email: "Enter the email address.",
    bankingRequirement: "Select a banking requirement.",
    relationshipManager: "Select a relationship manager.",
    status: "Select a status."
  };
  Object.entries(required).forEach(([key, message]) => {
    if (!record[key]) errors[key] = message;
  });
  const digits = record.mobile.replace(/\D/g, "");
  if (record.mobile && (digits.length < 8 || digits.length > 15)) {
    errors.mobile = "Enter a mobile number with 8 to 15 digits.";
  }
  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    errors.email = "Enter a valid email address.";
  }
  const duplicate = customers.some(
    (row) =>
      row.id !== record.id &&
      row.tradeLicenseNumber.toLowerCase() === record.tradeLicenseNumber.toLowerCase()
  );
  if (record.tradeLicenseNumber && duplicate) {
    errors.tradeLicenseNumber = "This trade license number is already in use.";
  }
  return errors;
}

function setMode(mode) {
  const viewing = mode === "view";
  els.dialog.dataset.mode = mode;
  els.form.querySelectorAll("input, select").forEach((control) => {
    if (control.name === "id") {
      control.readOnly = true;
      control.disabled = false;
      return;
    }
    control.disabled = viewing;
  });
  els.saveBtn.hidden = viewing;
  els.cancelBtn.textContent = viewing ? "Close" : "Cancel";
}

function blankRecord() {
  return {
    id: nextId(),
    customerType: "",
    companyName: "",
    tradeLicenseNumber: "",
    contactPerson: "",
    mobile: "",
    email: "",
    bankingRequirement: "",
    relationshipManager: "",
    status: "Active"
  };
}

function openForm(id, mode) {
  clearErrors();
  const existing = id ? customers.find((row) => row.id === id) : null;
  const resolved = existing ? mode : "add";
  editingId = resolved === "edit" ? existing.id : null;

  els.title.textContent =
    resolved === "view" ? "View customer" : resolved === "edit" ? "Edit customer" : "Add customer";
  els.sub.textContent =
    resolved === "view"
      ? "Customer details are read-only."
      : resolved === "edit"
        ? "Update the customer details and save."
        : "Customer ID is assigned automatically.";
  els.saveBtn.textContent = resolved === "edit" ? "Save changes" : "Save customer";

  const record = existing || blankRecord();
  els.form.elements.id.value = record.id;
  els.form.elements.customerType.value = CUSTOMER_TYPES.includes(record.customerType)
    ? record.customerType
    : "";
  els.form.elements.companyName.value = record.companyName;
  els.form.elements.tradeLicenseNumber.value = record.tradeLicenseNumber;
  els.form.elements.contactPerson.value = record.contactPerson;
  els.form.elements.mobile.value = record.mobile;
  els.form.elements.email.value = record.email;
  els.form.elements.bankingRequirement.value = REQUIREMENTS.includes(record.bankingRequirement)
    ? record.bankingRequirement
    : "";
  els.form.elements.relationshipManager.value = MANAGERS.includes(record.relationshipManager)
    ? record.relationshipManager
    : "";
  els.form.elements.status.value = record.status === "Inactive" ? "Inactive" : "Active";

  setMode(resolved);
  if (!els.dialog.open) els.dialog.showModal();
  if (resolved === "add") els.form.elements.companyName.focus();
  else if (resolved === "edit") els.form.elements.companyName.focus();
}

function closeForm() {
  els.dialog.close();
  editingId = null;
}

function onSubmit(event) {
  event.preventDefault();
  if (els.dialog.dataset.mode === "view") return;
  clearErrors();
  const record = readForm();
  const errors = validate(record);
  if (Object.keys(errors).length) {
    showErrors(errors);
    return;
  }
  if (editingId) {
    customers = customers.map((row) => (row.id === editingId ? record : row));
    showToast("Customer updated.");
  } else {
    customers = [record, ...customers];
    showToast("Customer added.");
  }
  saveStore();
  closeForm();
  render();
}

function showToast(message) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2200);
}

els.addBtn.addEventListener("click", () => openForm(null, "add"));
$("dashboard-add").addEventListener("click", () => openForm(null, "add"));
$("view-all-customers").addEventListener("click", () => openCustomers(""));
document.querySelectorAll(".hero-card").forEach((card) => {
  card.addEventListener("click", () => openCustomers(card.dataset.status || ""));
});
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => showPage(item.dataset.page));
});
$("menu-toggle").addEventListener("click", () => {
  document.querySelector(".shell").classList.add("is-nav-open");
});
$("nav-scrim").addEventListener("click", () => {
  document.querySelector(".shell").classList.remove("is-nav-open");
});

const collapseBtn = $("collapse-sidebar");
const shell = document.querySelector(".shell");
function setCollapsed(collapsed) {
  shell.classList.toggle("is-collapsed", collapsed);
  collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  collapseBtn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
}
if (localStorage.getItem("banking-cmd-sidebar") === "collapsed") setCollapsed(true);
collapseBtn.addEventListener("click", () => {
  const collapsed = !shell.classList.contains("is-collapsed");
  setCollapsed(collapsed);
  localStorage.setItem("banking-cmd-sidebar", collapsed ? "collapsed" : "open");
});
$("close-dialog").addEventListener("click", closeForm);
els.cancelBtn.addEventListener("click", closeForm);
els.form.addEventListener("submit", onSubmit);
els.search.addEventListener("input", () => {
  if (els.search.value.trim() && $("page-customers").hidden) showPage("customers");
  render();
});
els.statusFilter.addEventListener("change", render);

els.dialog.addEventListener("cancel", () => {
  editingId = null;
});

initLookups();
render();
showPage(location.hash === "#customers" ? "customers" : "dashboard");
