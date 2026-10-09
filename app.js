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
let currentPage = "dashboard";

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
    els.emptyTitle.textContent = filtering ? "No matching records." : "No records yet.";
    els.emptyCopy.textContent = filtering
      ? "Try a different company, ID, license, or status."
      : "Records will appear here once they are added.";
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
    ? `conic-gradient(var(--accent) 0 ${activeSweep}deg, oklch(0.78 0.02 270) ${activeSweep}deg 360deg)`
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

const PAGE_META = {
  dashboard: {
    title: "Dashboard",
    lead: "Customer totals, recent activity, and status mix.",
    section: ""
  },
  customers: {
    title: "Customers",
    lead: "Maintain customer records, contacts, and banking status.",
    section: "Customer Management"
  },
  services: {
    title: "Services",
    lead: "Maintain the services offered to customers.",
    section: "Masters"
  },
  documents: {
    title: "Document Types",
    lead: "Maintain document types, storage folders, and expiry rules.",
    section: "Masters"
  }
};

function showPage(page) {
  const next = PAGE_META[page] ? page : "dashboard";
  const meta = PAGE_META[next];
  currentPage = next;
  $("page-dashboard").hidden = next !== "dashboard";
  $("page-customers").hidden = next !== "customers";
  $("page-services").hidden = next !== "services";
  $("page-documents").hidden = next !== "documents";
  document.querySelectorAll(".nav-item").forEach((item) => {
    const active = item.dataset.page === next;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  $("page-title").textContent = meta.title;
  $("page-lead").textContent = meta.lead;
  document.title = `${meta.title} · Banking CMD`;
  $("crumb-section").textContent = meta.section;
  $("crumb-section").hidden = !meta.section;
  $("crumb-sep").hidden = !meta.section;
  $("crumb-sep-current").hidden = false;
  $("crumb-current").textContent = meta.title;
  const searchWrap = els.search.closest(".search");
  const slot = document.querySelector(`#page-${next} .search-slot`);
  if (slot) {
    slot.appendChild(searchWrap);
    searchWrap.hidden = false;
  } else {
    searchWrap.hidden = true;
  }
  const searchLabel = next === "services"
    ? "Search code or name..."
    : next === "documents"
      ? "Search code, name, folder..."
      : "Search code, name, contact...";
  els.search.placeholder = searchLabel;
  $("search-label").textContent = searchLabel;
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

const SERVICE_KEY = "banking-cmd-services-v1";
const SERVICE_SEED = [
  {
    code: "SER-001",
    name: "SME Loan",
    description: "Loan facility for small and medium enterprises.",
    status: "Active"
  }
];

const serviceEls = {
  rows: $("service-rows"),
  count: $("service-count"),
  empty: $("service-empty"),
  emptyTitle: $("service-empty-title"),
  emptyCopy: $("service-empty-copy"),
  statusFilter: $("service-status-filter"),
  dialog: $("service-dialog"),
  form: $("service-form"),
  title: $("service-dialog-title"),
  sub: $("service-dialog-sub"),
  saveBtn: $("service-save-btn"),
  cancelBtn: $("service-cancel-btn")
};

let services = loadServices();
let editingServiceCode = null;

function loadServices() {
  try {
    const raw = localStorage.getItem(SERVICE_KEY);
    if (!raw) return SERVICE_SEED.map((row) => ({ ...row }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((row) => row && row.code && row.name)) {
      return SERVICE_SEED.map((row) => ({ ...row }));
    }
    return parsed.map((row) => ({
      code: row.code,
      name: row.name,
      description: row.description || "",
      status: row.status === "Inactive" ? "Inactive" : "Active"
    }));
  } catch {
    return SERVICE_SEED.map((row) => ({ ...row }));
  }
}

function saveServices() {
  localStorage.setItem(SERVICE_KEY, JSON.stringify(services));
}

function nextServiceCode() {
  const max = services.reduce((highest, row) => {
    const n = Number(String(row.code).replace(/\D/g, "")) || 0;
    return Math.max(highest, n);
  }, 0);
  return `SER-${String(max + 1).padStart(3, "0")}`;
}

function filteredServices() {
  const query = currentPage === "services" ? els.search.value.trim().toLowerCase() : "";
  const status = serviceEls.statusFilter.value;
  return services.filter((row) => {
    const haystack = `${row.code} ${row.name} ${row.description}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = !status || row.status === status;
    return matchesQuery && matchesStatus;
  });
}

function renderServices() {
  const rows = filteredServices();
  serviceEls.count.textContent = `${services.length} record${services.length === 1 ? "" : "s"}`;
  serviceEls.rows.innerHTML = "";
  const showEmpty = rows.length === 0;
  serviceEls.empty.hidden = !showEmpty;
  if (showEmpty) {
    const filtering = (currentPage === "services" && els.search.value.trim()) || serviceEls.statusFilter.value;
    serviceEls.emptyTitle.textContent = filtering ? "No matching records." : "No records yet.";
    serviceEls.emptyCopy.textContent = filtering
      ? "Try a different service name, code, or status."
      : "Records will appear here once they are added.";
  }
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="id-cell"></td>
      <td class="name-main"></td>
      <td class="desc-cell"></td>
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
    cells[0].textContent = row.code;
    cells[1].textContent = row.name;
    cells[2].textContent = row.description;
    const pill = cells[3].querySelector(".pill");
    pill.textContent = row.status;
    pill.classList.add(statusClass(row.status));
    cells[4].querySelector('[data-action="view"]').addEventListener("click", () => openServiceForm(row.code, "view"));
    cells[4].querySelector('[data-action="edit"]').addEventListener("click", () => openServiceForm(row.code, "edit"));
    serviceEls.rows.appendChild(tr);
  });
}

function clearServiceErrors() {
  serviceEls.form.querySelectorAll(".field").forEach((field) => field.classList.remove("is-invalid"));
  serviceEls.form.querySelectorAll(".error").forEach((node) => {
    node.textContent = "";
  });
}

function showServiceErrors(errors) {
  Object.entries(errors).forEach(([name, message]) => {
    const input = serviceEls.form.elements[name];
    const error = serviceEls.form.querySelector(`[data-for="${name}"]`);
    if (input) input.closest(".field")?.classList.add("is-invalid");
    if (error) error.textContent = message;
  });
  const first = serviceEls.form.querySelector(".is-invalid input, .is-invalid textarea");
  first?.focus();
}

function setServiceMode(mode) {
  const viewing = mode === "view";
  serviceEls.dialog.dataset.mode = mode;
  serviceEls.form.querySelectorAll("input, textarea").forEach((control) => {
    if (control.name === "code") {
      control.readOnly = true;
      control.disabled = false;
      return;
    }
    control.disabled = viewing;
  });
  serviceEls.saveBtn.hidden = viewing;
  serviceEls.cancelBtn.textContent = viewing ? "Close" : "Cancel";
}

function openServiceForm(code, mode) {
  clearServiceErrors();
  const existing = code ? services.find((row) => row.code === code) : null;
  const resolved = existing ? mode : "add";
  editingServiceCode = resolved === "edit" ? existing.code : null;
  serviceEls.title.textContent =
    resolved === "view" ? "View service" : resolved === "edit" ? "Edit service" : "Add service";
  serviceEls.sub.textContent =
    resolved === "view"
      ? "Service details are read-only."
      : resolved === "edit"
        ? "Update the service details and save."
        : "Service code is assigned automatically.";
  serviceEls.saveBtn.textContent = resolved === "edit" ? "Save changes" : "Save service";
  const record = existing || {
    code: nextServiceCode(),
    name: "",
    description: "",
    status: "Active"
  };
  serviceEls.form.elements.code.value = record.code;
  serviceEls.form.elements.name.value = record.name;
  serviceEls.form.elements.description.value = record.description;
  serviceEls.form.elements.status.value = record.status === "Inactive" ? "Inactive" : "Active";
  setServiceMode(resolved);
  if (!serviceEls.dialog.open) serviceEls.dialog.showModal();
  if (resolved !== "view") serviceEls.form.elements.name.focus();
}

function closeServiceForm() {
  serviceEls.dialog.close();
  editingServiceCode = null;
}

function onServiceSubmit(event) {
  event.preventDefault();
  if (serviceEls.dialog.dataset.mode === "view") return;
  clearServiceErrors();
  const data = new FormData(serviceEls.form);
  const record = {
    code: String(data.get("code") || "").trim(),
    name: String(data.get("name") || "").trim(),
    description: String(data.get("description") || "").trim(),
    status: String(data.get("status") || "").trim()
  };
  const errors = {};
  if (!record.name) errors.name = "Enter the service name.";
  if (!record.status) errors.status = "Select a status.";
  const duplicate = services.some(
    (row) => row.code !== record.code && row.name.toLowerCase() === record.name.toLowerCase()
  );
  if (record.name && duplicate) errors.name = "This service name is already in use.";
  if (Object.keys(errors).length) {
    showServiceErrors(errors);
    return;
  }
  if (editingServiceCode) {
    services = services.map((row) => (row.code === editingServiceCode ? record : row));
    showToast("Service updated.");
  } else {
    services = [record, ...services];
    showToast("Service added.");
  }
  saveServices();
  closeServiceForm();
  renderServices();
}

const DOCUMENT_KEY = "banking-cmd-document-types-v1";
const DOCUMENT_SEED = [
  { code: "DOC-TL", name: "Trade License", folderKey: "trade-license", expiryApplicable: "Yes", status: "Active" },
  { code: "DOC-MOA", name: "MOA", folderKey: "moa", expiryApplicable: "No", status: "Active" },
  { code: "DOC-PASSPORT", name: "Passport", folderKey: "passport", expiryApplicable: "Yes", status: "Active" },
  { code: "DOC-EID", name: "Emirates ID", folderKey: "emirates-id", expiryApplicable: "Yes", status: "Active" },
  { code: "DOC-BANK", name: "Bank Statement", folderKey: "bank-statements", expiryApplicable: "No", status: "Active" },
  { code: "DOC-AUDITED", name: "Audited Financials", folderKey: "audited-financials", expiryApplicable: "No", status: "Active" },
  { code: "DOC-VAT", name: "VAT Certificate", folderKey: "vat", expiryApplicable: "Yes", status: "Active" },
  { code: "DOC-FACILITY", name: "Facility Letter", folderKey: "facility-letters", expiryApplicable: "No", status: "Active" },
  { code: "DOC-AGREEMENT", name: "Agreement", folderKey: "agreements", expiryApplicable: "No", status: "Active" },
  { code: "DOC-CREDIT", name: "Credit Report", folderKey: "credit-reports", expiryApplicable: "No", status: "Active" }
];

const documentEls = {
  rows: $("document-rows"),
  count: $("document-count"),
  empty: $("document-empty"),
  emptyTitle: $("document-empty-title"),
  emptyCopy: $("document-empty-copy"),
  statusFilter: $("document-status-filter"),
  dialog: $("document-dialog"),
  form: $("document-form"),
  title: $("document-dialog-title"),
  sub: $("document-dialog-sub"),
  saveBtn: $("document-save-btn"),
  cancelBtn: $("document-cancel-btn")
};

let documentTypes = loadDocuments();
let editingDocumentCode = null;

function loadDocuments() {
  try {
    const raw = localStorage.getItem(DOCUMENT_KEY);
    if (!raw) return DOCUMENT_SEED.map((row) => ({ ...row }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((row) => row && row.code && row.name && row.folderKey)) {
      return DOCUMENT_SEED.map((row) => ({ ...row }));
    }
    return parsed.map((row) => ({
      code: String(row.code).trim().toUpperCase(),
      name: row.name,
      folderKey: String(row.folderKey).trim().toLowerCase(),
      expiryApplicable: row.expiryApplicable === "No" ? "No" : "Yes",
      status: row.status === "Inactive" ? "Inactive" : "Active"
    }));
  } catch {
    return DOCUMENT_SEED.map((row) => ({ ...row }));
  }
}

function saveDocuments() {
  localStorage.setItem(DOCUMENT_KEY, JSON.stringify(documentTypes));
}

function filteredDocuments() {
  const query = currentPage === "documents" ? els.search.value.trim().toLowerCase() : "";
  const status = documentEls.statusFilter.value;
  return documentTypes.filter((row) => {
    const haystack = `${row.code} ${row.name} ${row.folderKey} ${row.expiryApplicable}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = !status || row.status === status;
    return matchesQuery && matchesStatus;
  });
}

function renderDocuments() {
  const rows = filteredDocuments();
  documentEls.count.textContent = `${documentTypes.length} record${documentTypes.length === 1 ? "" : "s"}`;
  documentEls.rows.innerHTML = "";
  const showEmpty = rows.length === 0;
  documentEls.empty.hidden = !showEmpty;
  if (showEmpty) {
    const filtering = (currentPage === "documents" && els.search.value.trim()) || documentEls.statusFilter.value;
    documentEls.emptyTitle.textContent = filtering ? "No matching records." : "No records yet.";
    documentEls.emptyCopy.textContent = filtering
      ? "Try a different name, code, folder key, or status."
      : "Records will appear here once they are added.";
  }
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="id-cell"></td>
      <td class="name-main"></td>
      <td class="key-cell"></td>
      <td><span class="pill"></span></td>
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
    cells[0].textContent = row.code;
    cells[1].textContent = row.name;
    cells[2].textContent = row.folderKey;
    const expiry = cells[3].querySelector(".pill");
    expiry.textContent = row.expiryApplicable;
    expiry.classList.add(row.expiryApplicable === "Yes" ? "pill-active" : "pill-inactive");
    const pill = cells[4].querySelector(".pill");
    pill.textContent = row.status;
    pill.classList.add(statusClass(row.status));
    cells[5].querySelector('[data-action="view"]').addEventListener("click", () => openDocumentForm(row.code, "view"));
    cells[5].querySelector('[data-action="edit"]').addEventListener("click", () => openDocumentForm(row.code, "edit"));
    documentEls.rows.appendChild(tr);
  });
}

function clearDocumentErrors() {
  documentEls.form.querySelectorAll(".field").forEach((field) => field.classList.remove("is-invalid"));
  documentEls.form.querySelectorAll(".error").forEach((node) => {
    node.textContent = "";
  });
}

function showDocumentErrors(errors) {
  Object.entries(errors).forEach(([name, message]) => {
    const input = documentEls.form.elements[name];
    const error = documentEls.form.querySelector(`[data-for="${name}"]`);
    const control = input && input.length && !input.tagName ? input[0] : input;
    if (control) control.closest(".field")?.classList.add("is-invalid");
    if (error) error.textContent = message;
  });
  const first = documentEls.form.querySelector(".is-invalid input, .is-invalid textarea, .is-invalid select");
  first?.focus();
}

function setDocumentMode(mode) {
  const viewing = mode === "view";
  documentEls.dialog.dataset.mode = mode;
  documentEls.form.querySelectorAll("input").forEach((control) => {
    control.disabled = viewing;
  });
  documentEls.saveBtn.hidden = viewing;
  documentEls.cancelBtn.textContent = viewing ? "Close" : "Cancel";
}

function openDocumentForm(code, mode) {
  clearDocumentErrors();
  const existing = code ? documentTypes.find((row) => row.code === code) : null;
  const resolved = existing ? mode : "add";
  editingDocumentCode = resolved === "edit" ? existing.code : null;
  documentEls.title.textContent =
    resolved === "view" ? "View document type" : resolved === "edit" ? "Edit document type" : "Add document type";
  documentEls.sub.textContent =
    resolved === "view"
      ? "Document type details are read-only."
      : resolved === "edit"
        ? "Update the document type and save."
        : "Define how this document is stored and whether it expires.";
  documentEls.saveBtn.textContent = resolved === "edit" ? "Save changes" : "Save document type";
  const record = existing || {
    code: "",
    name: "",
    folderKey: "",
    expiryApplicable: "Yes",
    status: "Active"
  };
  documentEls.form.elements.name.value = record.name;
  documentEls.form.elements.code.value = record.code;
  documentEls.form.elements.folderKey.value = record.folderKey;
  documentEls.form.elements.expiryApplicable.value = record.expiryApplicable === "No" ? "No" : "Yes";
  documentEls.form.elements.status.value = record.status === "Inactive" ? "Inactive" : "Active";
  setDocumentMode(resolved);
  if (!documentEls.dialog.open) documentEls.dialog.showModal();
  if (resolved !== "view") documentEls.form.elements.name.focus();
}

function closeDocumentForm() {
  documentEls.dialog.close();
  editingDocumentCode = null;
}

function onDocumentSubmit(event) {
  event.preventDefault();
  if (documentEls.dialog.dataset.mode === "view") return;
  clearDocumentErrors();
  const data = new FormData(documentEls.form);
  const record = {
    code: String(data.get("code") || "").trim().toUpperCase(),
    name: String(data.get("name") || "").trim(),
    folderKey: String(data.get("folderKey") || "").trim().toLowerCase(),
    expiryApplicable: String(data.get("expiryApplicable") || "").trim(),
    status: String(data.get("status") || "").trim()
  };
  const errors = {};
  if (!record.name) errors.name = "Enter the document type name.";
  if (!record.code) errors.code = "Enter the document code.";
  else if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(record.code)) errors.code = "Use letters, numbers, and hyphens.";
  if (!record.folderKey) errors.folderKey = "Enter the S3 folder key.";
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.folderKey)) errors.folderKey = "Use lowercase letters, numbers, and hyphens.";
  if (record.expiryApplicable !== "Yes" && record.expiryApplicable !== "No") errors.expiryApplicable = "Select whether expiry applies.";
  if (!record.status) errors.status = "Select a status.";
  const others = documentTypes.filter((row) => row.code !== editingDocumentCode);
  if (record.name && others.some((row) => row.name.toLowerCase() === record.name.toLowerCase())) {
    errors.name = "This document type name is already in use.";
  }
  if (record.code && others.some((row) => row.code === record.code)) {
    errors.code = "This document code is already in use.";
  }
  if (record.folderKey && others.some((row) => row.folderKey === record.folderKey)) {
    errors.folderKey = "This S3 folder key is already in use.";
  }
  if (Object.keys(errors).length) {
    showDocumentErrors(errors);
    return;
  }
  if (editingDocumentCode) {
    documentTypes = documentTypes.map((row) => (row.code === editingDocumentCode ? record : row));
    showToast("Document type updated.");
  } else {
    documentTypes = [record, ...documentTypes];
    showToast("Document type added.");
  }
  saveDocuments();
  closeDocumentForm();
  renderDocuments();
}

els.addBtn.addEventListener("click", () => openForm(null, "add"));
$("dashboard-add").addEventListener("click", () => openForm(null, "add"));
$("view-all-customers").addEventListener("click", () => openCustomers(""));
document.querySelectorAll(".hero-card").forEach((card) => {
  card.addEventListener("click", () => openCustomers(card.dataset.status || ""));
});
$("crumb-home").addEventListener("click", () => showPage("dashboard"));
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (els.search.value) {
      els.search.value = "";
      render();
      renderServices();
      renderDocuments();
    }
    showPage(item.dataset.page);
  });
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
  if (currentPage === "services") {
    renderServices();
    return;
  }
  if (currentPage === "documents") {
    renderDocuments();
    return;
  }
  if (els.search.value.trim() && $("page-customers").hidden) showPage("customers");
  render();
});
els.statusFilter.addEventListener("change", render);
serviceEls.statusFilter.addEventListener("change", renderServices);
$("add-service-btn").addEventListener("click", () => openServiceForm(null, "add"));
$("close-service-dialog").addEventListener("click", closeServiceForm);
serviceEls.cancelBtn.addEventListener("click", closeServiceForm);
serviceEls.form.addEventListener("submit", onServiceSubmit);
serviceEls.dialog.addEventListener("cancel", () => {
  editingServiceCode = null;
});
documentEls.statusFilter.addEventListener("change", renderDocuments);
$("add-document-btn").addEventListener("click", () => openDocumentForm(null, "add"));
$("close-document-dialog").addEventListener("click", closeDocumentForm);
documentEls.cancelBtn.addEventListener("click", closeDocumentForm);
documentEls.form.addEventListener("submit", onDocumentSubmit);
documentEls.dialog.addEventListener("cancel", () => {
  editingDocumentCode = null;
});

els.dialog.addEventListener("cancel", () => {
  editingId = null;
});

initLookups();
render();
renderServices();
renderDocuments();
const startHash = location.hash.slice(1);
const startPage = PAGE_META[startHash] ? startHash : "dashboard";
showPage(startPage);
