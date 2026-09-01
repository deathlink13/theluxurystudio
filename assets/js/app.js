(function () {
  "use strict";

  const config = window.LUXURY_CONFIG || {};
  const menuButton = document.querySelector(".menu-button");
  const mobilePanel = document.getElementById("mobile-menu");
  const modal = document.getElementById("booking-modal");
  const modalDialog = modal?.querySelector(".booking-modal__dialog");
  const serviceGrid = document.getElementById("booking-service-grid");
  const dateStage = document.getElementById("booking-date-stage");
  const detailsForm = document.getElementById("booking-details-form");
  const successStage = document.getElementById("booking-success-stage");
  const statusBox = document.getElementById("booking-modal-status");
  const selectedServiceBox = document.getElementById("selected-service-box");
  const slotsBox = document.getElementById("booking-slots");
  const slotsHint = document.getElementById("slots-hint");
  const calendarGrid = document.getElementById("booking-calendar-grid");
  const calendarTitle = document.getElementById("booking-calendar-title");
  const downloadButton = document.getElementById("download-booking-ticket");

  const SERVICES = {
    "Corte": { price: 220, duration: 60, image: "assets/images/imagen2.jpg", description: "Corte de precisión y peinado final." },
    "Corte de niño": { price: 220, duration: 40, image: "assets/images/imagen4.jpg", description: "Corte infantil con detalle y comodidad." },
    "Corte y Barba": { price: 330, duration: 60, image: "assets/images/imagen1.jpg", description: "Corte completo con perfilado de barba." },
    "Barba": { price: 200, duration: 40, image: "assets/images/imagen1.jpg", description: "Perfilado, simetría y acabado limpio." },
    "Ceja": { price: 50, duration: 40, image: "assets/images/imagen3.jpg", description: "Diseño y limpieza para un acabado preciso." },
    "Facial": { price: 180, duration: 60, image: "assets/images/imagen3.jpg", description: "Rutina facial para limpiar y revitalizar." },
    "Grecas": { price: 50, duration: 40, image: "assets/images/imagen5.jpg", description: "Diseño de líneas y detalles personalizados." },
    "Paquete Luxury VIP": { price: 500, duration: 60, image: "assets/images/imagen6.jpg", description: "Corte, barba, ceja y facial." },
    "Paquete Luxury": { price: 380, duration: 60, image: "assets/images/imagen2.jpg", description: "Corte, ceja y facial." }
  };

  const state = {
    service: "",
    date: "",
    time: "",
    calendarMonth: startOfMonth(new Date()),
    lastBooking: null,
    requestId: ""
  };

  function toggleMenu(force) {
    if (!menuButton || !mobilePanel) return;
    const open = typeof force === "boolean" ? force : menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    mobilePanel.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  }

  menuButton?.addEventListener("click", () => toggleMenu());
  mobilePanel?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => toggleMenu(false)));

  function formatPrice(value) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(value);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toLocalISO(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  }

  function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
  }

  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function serviceInfo(name) {
    return SERVICES[name] || null;
  }

  function showModalStatus(message, type) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.hidden = !message;
    statusBox.classList.toggle("is-error", type === "error");
  }

  function setStep(step) {
    if (!modal) return;
    modal.querySelectorAll("[data-booking-stage]").forEach((node) => {
      node.hidden = Number(node.dataset.bookingStage) !== step;
    });
    modal.querySelectorAll("[data-step-dot]").forEach((node) => {
      const dot = Number(node.dataset.stepDot);
      node.classList.toggle("is-active", dot === step);
      node.classList.toggle("is-done", dot < step);
    });
    showModalStatus("");
    modalDialog?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetBooking() {
    state.service = "";
    state.date = "";
    state.time = "";
    state.lastBooking = null;
    state.requestId = "";
    state.calendarMonth = startOfMonth(new Date());
    detailsForm?.reset();
    if (slotsBox) slotsBox.innerHTML = "";
    if (slotsHint) slotsHint.textContent = "Selecciona una fecha para consultar horarios disponibles.";
    renderServices();
    renderCalendar();
    setStep(1);
  }

  function openBooking(preselectedService) {
    if (!modal) return;
    toggleMenu(false);
    resetBooking();
    if (preselectedService && SERVICES[preselectedService]) {
      chooseService(preselectedService);
    }
    modal.hidden = false;
    document.body.classList.add("booking-open");
    window.setTimeout(() => modal.querySelector(".booking-modal__close")?.focus(), 40);
  }

  function closeBooking() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("booking-open");
  }

  function renderServices() {
    if (!serviceGrid) return;
    serviceGrid.innerHTML = Object.entries(SERVICES).map(([name, info]) => `
      <button class="booking-service${state.service === name ? " is-selected" : ""}" type="button" data-modal-service="${escapeHtml(name)}">
        <span class="booking-service__image"><img src="${info.image}" alt="" loading="lazy"></span>
        <span class="booking-service__body">
          <span class="booking-service__top"><strong>${escapeHtml(name)}</strong><b>${formatPrice(info.price)}</b></span>
          <small>${escapeHtml(info.description)}</small>
          <span class="booking-service__meta">${info.duration} min</span>
        </span>
      </button>
    `).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function chooseService(name) {
    const info = serviceInfo(name);
    if (!info) return;
    state.service = name;
    state.date = "";
    state.time = "";
    state.calendarMonth = startOfMonth(new Date());
    renderServices();
    renderSelectedService();
    renderCalendar();
    setStep(2);
  }

  function renderSelectedService() {
    if (!selectedServiceBox || !state.service) return;
    const info = serviceInfo(state.service);
    selectedServiceBox.innerHTML = `
      <img src="${info.image}" alt="">
      <span><small>Servicio seleccionado</small><strong>${escapeHtml(state.service)}</strong><em>${formatPrice(info.price)} · ${info.duration} min</em></span>
      <button type="button" data-change-service>Cambiar</button>
    `;
  }

  function renderCalendar() {
    if (!calendarGrid || !calendarTitle) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = addDays(today, 90);
    const month = state.calendarMonth;
    const firstWeekday = (month.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(month);
    calendarTitle.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push('<span class="calendar-day calendar-day--empty"></span>');

    for (let day = 1; day <= daysInMonth; day++) {
      const current = new Date(month.getFullYear(), month.getMonth(), day);
      const iso = toLocalISO(current);
      const disabled = current < today || current > maxDate;
      const selected = state.date === iso;
      const isToday = sameDate(current, today);
      cells.push(`
        <button type="button" class="calendar-day${selected ? " is-selected" : ""}${isToday ? " is-today" : ""}" data-date="${iso}" ${disabled ? "disabled" : ""} aria-label="${current.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}">
          ${day}
        </button>
      `);
    }
    calendarGrid.innerHTML = cells.join("");

    const prev = modal?.querySelector("[data-calendar-prev]");
    const next = modal?.querySelector("[data-calendar-next]");
    const minMonth = startOfMonth(today);
    const maxMonth = startOfMonth(maxDate);
    if (prev) prev.disabled = month <= minMonth;
    if (next) next.disabled = month >= maxMonth;
  }

  function normalizeApiResponse(data) {
    if (!data || typeof data !== "object") return data;
    if (typeof data.ok === "undefined" && typeof data.success !== "undefined") {
      data.ok = Boolean(data.success);
    }
    if (!data.error && data.ok === false && data.message) {
      data.error = data.message;
    }
    return data;
  }

  function useLocalProxy() {
    const expectedPort = String(config.localProxyPort || "4173");
    return Boolean(
      config.localProxyUrl &&
      /^https?:$/.test(window.location.protocol) &&
      window.location.port === expectedPort
    );
  }

  function apiBaseUrl() {
    if (useLocalProxy()) return config.localProxyUrl;
    return config.appsScriptUrl || "";
  }

  function buildApiUrl(base, action, params) {
    const url = new URL(base, window.location.href);
    url.searchParams.set("action", action);
    url.searchParams.set("_", String(Date.now()));
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return url;
  }

  async function fetchJsonGet(action, params) {
    const base = apiBaseUrl();
    if (!base) throw new Error("No pudimos abrir la agenda. Intenta de nuevo.");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(buildApiUrl(base, action, params), {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        redirect: "follow",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`La agenda respondió con código ${response.status}.`);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new Error("La agenda devolvió una respuesta que no se pudo leer.");
      }
      return normalizeApiResponse(data);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  // Respaldo para implementaciones de Apps Script que sí expongan callback JSONP.
  function jsonp(action, params) {
    return new Promise((resolve, reject) => {
      if (!config.appsScriptUrl) {
        reject(new Error("No pudimos abrir la agenda. Intenta de nuevo."));
        return;
      }

      const callbackName = `tls_jsonp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => cleanup(new Error("La agenda tardó demasiado en responder.")), 8000);

      function cleanup(error, data) {
        window.clearTimeout(timeout);
        script.remove();
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        if (error) reject(error); else resolve(normalizeApiResponse(data));
      }

      window[callbackName] = (data) => cleanup(null, data);
      script.onerror = () => cleanup(new Error("No se pudo conectar con la agenda."));

      const url = buildApiUrl(config.appsScriptUrl, action, params);
      url.searchParams.set("callback", callbackName);
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  async function apiGet(action, params) {
    try {
      return await fetchJsonGet(action, params);
    } catch (fetchError) {
      // Cuando usamos el servidor local no hace falta JSONP: el proxy es same-origin.
      if (useLocalProxy()) {
        console.error("Luxury API GET:", fetchError);
        throw new Error("No pudimos consultar la agenda. Intenta de nuevo.");
      }

      try {
        return await jsonp(action, params);
      } catch (jsonpError) {
        console.error("Luxury API GET:", fetchError, jsonpError);
        throw new Error("No pudimos consultar la agenda. Intenta de nuevo.");
      }
    }
  }

  async function loadAvailability(date) {
    if (!state.service || !date || !slotsBox || !slotsHint) return;
    showModalStatus("");
    state.date = date;
    state.time = "";
    renderCalendar();
    slotsBox.innerHTML = '<div class="slot-loading">Consultando agenda…</div>';
    slotsHint.textContent = `Horarios para ${new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}`;

    try {
      const response = await apiGet("availability", { fecha: date, servicio: state.service });
      if (!response?.ok) throw new Error(response?.error || response?.message || "No fue posible consultar los horarios.");
      renderSlots(response.slots || []);
    } catch (error) {
      slotsBox.innerHTML = "";
      showModalStatus(error.message, "error");
      if (!config.appsScriptUrl) {
        slotsHint.textContent = "No pudimos cargar los horarios. Intenta de nuevo.";
      }
    }
  }

  function renderSlots(slots) {
    if (!slotsBox) return;
    const available = slots.filter((slot) => slot.available);
    if (!available.length) {
      slotsBox.innerHTML = '<p class="slots-empty">Ese día ya no tiene cupo disponible. Elige otra fecha.</p>';
      return;
    }

    slotsBox.innerHTML = slots.map((slot) => {
      const selected = state.time === slot.time;
      const availabilityText = slot.available
        ? `${slot.remaining} ${slot.remaining === 1 ? "lugar" : "lugares"}`
        : "Lleno";
      return `
        <button class="time-slot${selected ? " is-selected" : ""}${slot.available ? "" : " is-full"}" type="button" data-time="${slot.time}" ${slot.available ? "" : "disabled"}>
          <strong>${slot.time}</strong><small>${availabilityText}</small>
        </button>
      `;
    }).join("");
  }

  function goToDetails() {
    if (!state.service || !state.date || !state.time) {
      showModalStatus("Selecciona un servicio, una fecha y un horario disponible.", "error");
      return;
    }
    const info = serviceInfo(state.service);
    const summary = document.getElementById("details-booking-summary");
    if (summary) {
      const prettyDate = new Date(`${state.date}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      summary.innerHTML = `<strong>${escapeHtml(state.service)}</strong><span>${prettyDate} · ${state.time}</span><em>${formatPrice(info.price)} · ${info.duration} min</em>`;
    }
    setStep(3);
  }

  function buildPayload(formData) {
    return {
      action: "book",
      requestId: self.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      nombre: String(formData.get("nombre") || "").trim(),
      telefono: String(formData.get("telefono") || "").trim(),
      servicio: state.service,
      fecha: state.date,
      hora: state.time,
      notas: String(formData.get("notas") || "").trim(),
      website: String(formData.get("website") || ""),
      origen: "sitio-web"
    };
  }

  async function readablePost(payload) {
    const base = apiBaseUrl();
    if (!base) throw new Error("No pudimos confirmar la cita. Intenta de nuevo.");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(base, {
        method: "POST",
        cache: "no-store",
        credentials: "omit",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`La agenda respondió con código ${response.status}.`);
      }

      const text = await response.text();
      const data = normalizeApiResponse(JSON.parse(text));
      return data;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function postBooking(payload) {
    if (!config.appsScriptUrl) {
      throw new Error("No pudimos confirmar la cita. Intenta de nuevo.");
    }

    // Con el servidor incluido, POST y respuesta son same-origin y se leen directamente.
    if (useLocalProxy()) {
      return await readablePost(payload);
    }

    // En hosting normal intentamos primero leer la respuesta directa.
    // Si el navegador bloquea la respuesta por CORS, repetimos con el mismo requestId.
    // El backend evita duplicados precisamente por requestId.
    try {
      const direct = await readablePost(payload);
      if (direct && typeof direct === "object") return direct;
    } catch (directError) {
      console.warn("POST directo no legible; usando envío compatible:", directError);
    }

    await fetch(config.appsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    for (let attempt = 0; attempt < 16; attempt++) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      const status = await apiGet("status", { requestId: payload.requestId });
      if (status?.pending) continue;
      return normalizeApiResponse(status);
    }

    throw new Error("No pudimos confirmar la cita. Intenta de nuevo.");
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!detailsForm) return;
    showModalStatus("");

    if (!detailsForm.checkValidity()) {
      detailsForm.reportValidity();
      showModalStatus("Completa los datos marcados antes de confirmar.", "error");
      return;
    }

    const payload = buildPayload(new FormData(detailsForm));
    if (payload.website) return;
    const digits = payload.telefono.replace(/\D/g, "");
    if (digits.length < 10) {
      showModalStatus("Escribe un teléfono de al menos 10 dígitos.", "error");
      detailsForm.elements.telefono.focus();
      return;
    }

    const button = detailsForm.querySelector('button[type="submit"]');
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "Confirmando cita…";
    state.requestId = payload.requestId;

    try {
      const result = await postBooking(payload);
      if (!result?.ok) {
        if (result?.code === "FULL") {
          setStep(2);
          await loadAvailability(state.date);
          showModalStatus("Ese horario acaba de llenarse. Elige otro horario disponible.", "error");
          return;
        }
        throw new Error(result?.error || result?.message || "No fue posible registrar la cita.");
      }
      state.lastBooking = result;
      renderSuccess(result);
      setStep(4);
    } catch (error) {
      showModalStatus(error.message || "No pudimos registrar tu cita.", "error");
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }

  function qrText(booking) {
    return [
      "THE LUXURY STUDIO - CITA CONFIRMADA",
      `Folio: ${booking.folio}`,
      `Nombre: ${booking.nombre}`,
      `Telefono: ${booking.telefono}`,
      `Servicio: ${booking.servicio}`,
      `Fecha: ${booking.fecha}`,
      `Hora: ${booking.hora} - ${booking.horaFin}`,
      `Duracion: ${booking.duracion} min`,
      `Precio: $${booking.precio} MXN`,
      "Estado: CONFIRMADA"
    ].join("\n");
  }

  function renderSuccess(booking) {
    if (!successStage) return;
    const prettyDate = new Date(`${booking.fecha}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    successStage.querySelector("[data-success-folio]").textContent = booking.folio;
    successStage.querySelector("[data-success-name]").textContent = booking.nombre;
    successStage.querySelector("[data-success-service]").textContent = booking.servicio;
    successStage.querySelector("[data-success-date]").textContent = prettyDate;
    successStage.querySelector("[data-success-time]").textContent = `${booking.hora} – ${booking.horaFin}`;
    successStage.querySelector("[data-success-price]").textContent = formatPrice(Number(booking.precio));

    const qrNode = document.getElementById("booking-qr");
    if (qrNode) {
      qrNode.innerHTML = "";
      if (window.QRCode) {
        new window.QRCode(qrNode, {
          text: qrText(booking),
          width: 190,
          height: 190,
          colorDark: "#090909",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M
        });
      } else {
        qrNode.textContent = "QR no disponible";
      }
    }
  }

  function getQrDataUrl() {
    const qrNode = document.getElementById("booking-qr");
    const canvas = qrNode?.querySelector("canvas");
    if (canvas) return canvas.toDataURL("image/png");
    const image = qrNode?.querySelector("img");
    return image?.src || "";
  }

  function downloadTicket() {
    const booking = state.lastBooking;
    if (!booking) return;
    if (!window.jspdf?.jsPDF) {
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });
    const width = doc.internal.pageSize.getWidth();
    doc.setFillColor(9, 9, 9);
    doc.rect(0, 0, width, 45, "F");
    doc.setTextColor(225, 197, 141);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("THE LUXURY STUDIO", 14, 15);
    doc.setTextColor(240, 237, 229);
    doc.setFontSize(22);
    doc.text("Cita confirmada", 14, 29);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Folio ${booking.folio}`, 14, 37);

    doc.setTextColor(25, 25, 25);
    doc.setFontSize(10);
    const rows = [
      ["Nombre", booking.nombre],
      ["Servicio", booking.servicio],
      ["Fecha", booking.fecha],
      ["Horario", `${booking.hora} - ${booking.horaFin}`],
      ["Duración", `${booking.duracion} min`],
      ["Precio", formatPrice(Number(booking.precio))],
      ["Teléfono", booking.telefono]
    ];
    let y = 58;
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 43, y, { maxWidth: 78 });
      y += 9;
    });

    const qr = getQrDataUrl();
    if (qr) doc.addImage(qr, "PNG", 45, 119, 58, 58);
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text("Presenta este QR al llegar. Al escanearlo se muestran los datos de tu cita.", width / 2, 184, { align: "center", maxWidth: 110 });
    doc.text("Av. Repúblicas 94, Portales Sur, Benito Juárez, CDMX", width / 2, 192, { align: "center" });
    doc.save(`Cita-${booking.folio}.pdf`);
  }

  document.addEventListener("click", (event) => {
    const serviceButton = event.target.closest(".select-service");
    if (serviceButton) {
      event.preventDefault();
      openBooking(serviceButton.dataset.service || "");
      return;
    }

    const launcher = event.target.closest('[href="#agendar"], [data-open-booking]');
    if (launcher) {
      event.preventDefault();
      openBooking(launcher.dataset.service || "");
      return;
    }

    const modalService = event.target.closest("[data-modal-service]");
    if (modalService) {
      chooseService(modalService.dataset.modalService);
      return;
    }

    if (event.target.closest("[data-booking-close]")) {
      closeBooking();
      return;
    }

    if (event.target.closest("[data-change-service]")) {
      setStep(1);
      return;
    }

    if (event.target.closest("[data-calendar-prev]")) {
      state.calendarMonth = addMonths(state.calendarMonth, -1);
      renderCalendar();
      return;
    }

    if (event.target.closest("[data-calendar-next]")) {
      state.calendarMonth = addMonths(state.calendarMonth, 1);
      renderCalendar();
      return;
    }

    const day = event.target.closest("[data-date]");
    if (day && !day.disabled) {
      loadAvailability(day.dataset.date);
      return;
    }

    const time = event.target.closest("[data-time]");
    if (time && !time.disabled) {
      state.time = time.dataset.time;
      slotsBox?.querySelectorAll(".time-slot").forEach((node) => node.classList.toggle("is-selected", node.dataset.time === state.time));
      showModalStatus("");
      return;
    }

    if (event.target.closest("[data-to-details]")) {
      goToDetails();
      return;
    }

    if (event.target.closest("[data-back-to-date]")) {
      setStep(2);
      return;
    }

    if (event.target === modal) closeBooking();
  });

  detailsForm?.addEventListener("submit", submitBooking);
  downloadButton?.addEventListener("click", downloadTicket);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modal && !modal.hidden) closeBooking();
      else toggleMenu(false);
    }
  });

  renderServices();
  renderCalendar();

  if (window.location.hash === "#agendar") {
    window.setTimeout(() => openBooking(), 120);
  }
})();
