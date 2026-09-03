(() => {
  "use strict";

  const gallery = document.querySelector("#galeria");
  if (!gallery) return;

  const imageNodes = Array.from(
    gallery.querySelectorAll(".gallery-grid figure img, .work-showcase__grid figure img")
  );

  if (!imageNodes.length) return;

  const items = imageNodes.map((img, index) => {
    const figure = img.closest("figure");
    const caption = figure?.querySelector("figcaption");
    const captionText = caption
      ? caption.textContent.replace(/\s+/g, " ").trim()
      : (img.alt || `Trabajo ${index + 1}`).trim();

    figure?.classList.add("gallery-viewer-trigger");
    figure?.setAttribute("role", "button");
    figure?.setAttribute("tabindex", "0");
    figure?.setAttribute("aria-label", `Abrir foto ${index + 1} de ${imageNodes.length}: ${captionText}`);

    return {
      src: img.currentSrc || img.src,
      alt: img.alt || captionText,
      caption: captionText,
      thumb: img.currentSrc || img.src,
      trigger: figure
    };
  });

  const viewer = document.createElement("div");
  viewer.className = "apple-gallery-viewer";
  viewer.hidden = true;
  viewer.setAttribute("aria-hidden", "true");
  viewer.innerHTML = `
    <div class="apple-gallery-viewer__backdrop" data-gallery-close></div>
    <div class="apple-gallery-viewer__chrome apple-gallery-viewer__topbar">
      <div class="apple-gallery-viewer__count" aria-live="polite"></div>
      <button class="apple-gallery-viewer__close" type="button" data-gallery-close aria-label="Cerrar galería">×</button>
    </div>

    <div class="apple-gallery-viewer__stage" data-gallery-stage>
      <button class="apple-gallery-viewer__nav apple-gallery-viewer__nav--prev" type="button" data-gallery-prev aria-label="Foto anterior">‹</button>
      <div class="apple-gallery-viewer__image-wrap" data-gallery-image-wrap>
        <img class="apple-gallery-viewer__image" data-gallery-image alt="">
      </div>
      <button class="apple-gallery-viewer__nav apple-gallery-viewer__nav--next" type="button" data-gallery-next aria-label="Foto siguiente">›</button>
    </div>

    <div class="apple-gallery-viewer__bottom">
      <div class="apple-gallery-viewer__caption" data-gallery-caption></div>
      <div class="apple-gallery-viewer__thumbs" data-gallery-thumbs aria-label="Miniaturas de la galería"></div>
    </div>
  `;

  document.body.appendChild(viewer);

  const stage = viewer.querySelector("[data-gallery-stage]");
  const imageWrap = viewer.querySelector("[data-gallery-image-wrap]");
  const mainImage = viewer.querySelector("[data-gallery-image]");
  const count = viewer.querySelector(".apple-gallery-viewer__count");
  const caption = viewer.querySelector("[data-gallery-caption]");
  const thumbs = viewer.querySelector("[data-gallery-thumbs]");
  const prevButton = viewer.querySelector("[data-gallery-prev]");
  const nextButton = viewer.querySelector("[data-gallery-next]");
  const closeButton = viewer.querySelector(".apple-gallery-viewer__close");

  let activeIndex = 0;
  let previouslyFocused = null;
  let dragStartX = null;
  let dragX = 0;
  let isDragging = false;
  let ignoreClickUntil = 0;

  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "apple-gallery-viewer__thumb";
    button.type = "button";
    button.dataset.galleryThumb = String(index);
    button.setAttribute("aria-label", `Ver foto ${index + 1}`);
    button.innerHTML = `<img src="${escapeAttribute(item.thumb)}" alt="" loading="lazy" decoding="async">`;
    thumbs.appendChild(button);
  });

  function escapeAttribute(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function preload(index) {
    const item = items[(index + items.length) % items.length];
    if (!item) return;
    const img = new Image();
    img.src = item.src;
  }

  function updateViewer(index, direction = 0, immediate = false) {
    activeIndex = (index + items.length) % items.length;
    const item = items[activeIndex];

    const apply = () => {
      mainImage.src = item.src;
      mainImage.alt = item.alt;
      count.textContent = `${activeIndex + 1} de ${items.length}`;
      caption.textContent = item.caption;

      thumbs.querySelectorAll(".apple-gallery-viewer__thumb").forEach((thumb, thumbIndex) => {
        const selected = thumbIndex === activeIndex;
        thumb.classList.toggle("is-active", selected);
        thumb.setAttribute("aria-current", selected ? "true" : "false");
      });

      const currentThumb = thumbs.querySelector(`[data-gallery-thumb="${activeIndex}"]`);
      currentThumb?.scrollIntoView({ behavior: immediate ? "auto" : "smooth", block: "nearest", inline: "center" });

      preload(activeIndex + 1);
      preload(activeIndex - 1);
    };

    if (immediate || !direction) {
      imageWrap.classList.remove("is-switching-left", "is-switching-right");
      mainImage.style.transform = "";
      mainImage.style.opacity = "";
      apply();
      return;
    }

    const exitClass = direction > 0 ? "is-switching-left" : "is-switching-right";
    imageWrap.classList.remove("is-switching-left", "is-switching-right");
    imageWrap.classList.add(exitClass);

    window.setTimeout(() => {
      apply();
      imageWrap.classList.remove(exitClass);
      imageWrap.classList.add("is-entering");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => imageWrap.classList.remove("is-entering"));
      });
    }, 145);
  }

  function openViewer(index) {
    previouslyFocused = document.activeElement;
    updateViewer(index, 0, true);
    viewer.hidden = false;
    viewer.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("gallery-viewer-open");
    window.requestAnimationFrame(() => viewer.classList.add("is-open"));
    closeButton.focus({ preventScroll: true });
  }

  function closeViewer() {
    if (viewer.hidden) return;
    viewer.classList.remove("is-open");
    viewer.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("gallery-viewer-open");
    window.setTimeout(() => {
      viewer.hidden = true;
      mainImage.removeAttribute("src");
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    }, 240);
  }

  function next() {
    updateViewer(activeIndex + 1, 1);
  }

  function prev() {
    updateViewer(activeIndex - 1, -1);
  }

  items.forEach((item, index) => {
    item.trigger?.addEventListener("click", () => openViewer(index));
    item.trigger?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openViewer(index);
      }
    });
  });

  viewer.addEventListener("click", (event) => {
    if (Date.now() < ignoreClickUntil) return;

    if (event.target.closest("[data-gallery-close]")) {
      closeViewer();
      return;
    }

    if (event.target.closest("[data-gallery-prev]")) {
      prev();
      return;
    }

    if (event.target.closest("[data-gallery-next]")) {
      next();
      return;
    }

    const thumb = event.target.closest("[data-gallery-thumb]");
    if (thumb) {
      const index = Number(thumb.dataset.galleryThumb);
      if (Number.isInteger(index) && index !== activeIndex) {
        const forward = index > activeIndex ? 1 : -1;
        updateViewer(index, forward);
      }
    }
  });

  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("button")) return;

    dragStartX = event.clientX;
    dragX = 0;
    isDragging = true;
    stage.setPointerCapture?.(event.pointerId);
    imageWrap.classList.add("is-dragging");
  });

  stage.addEventListener("pointermove", (event) => {
    if (!isDragging || dragStartX === null) return;
    dragX = event.clientX - dragStartX;
    const damped = dragX * 0.72;
    const opacity = Math.max(0.58, 1 - Math.abs(dragX) / Math.max(window.innerWidth, 360) * 0.72);
    mainImage.style.transform = `translate3d(${damped}px,0,0) scale(.995)`;
    mainImage.style.opacity = String(opacity);
  });

  function finishDrag() {
    if (!isDragging) return;
    const threshold = Math.min(110, Math.max(58, window.innerWidth * 0.09));
    const moved = Math.abs(dragX) > 8;

    imageWrap.classList.remove("is-dragging");
    mainImage.style.transform = "";
    mainImage.style.opacity = "";
    isDragging = false;
    dragStartX = null;

    if (moved) ignoreClickUntil = Date.now() + 220;

    if (dragX <= -threshold) next();
    else if (dragX >= threshold) prev();

    dragX = 0;
  }

  stage.addEventListener("pointerup", finishDrag);
  stage.addEventListener("pointercancel", finishDrag);

  document.addEventListener("keydown", (event) => {
    if (viewer.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeViewer();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    }
  });
})();
