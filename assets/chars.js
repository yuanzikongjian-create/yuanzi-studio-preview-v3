/* PREMIUM v1 预览版人物卡轮播。
   与旧版的区别：
   1) 每位人物的卡片是「持久元素」，切换时只改 class（位置/灰度/透明度），CSS 过渡才真正生效 → 交叉淡化；
      旧版每次 render() 都删光重建，0.35s 过渡从未播放。
   2) 说明文字（名字+一句话）先淡出再换字再淡入，高度固定，不跳动。
   3) 弹窗淡入淡出；Esc 关闭；焦点回到触发处；背景不可聚焦的卡片 tabindex=-1。
   数据仍读自 HTML 里的 <ul class="char-data">（li 的 data-img / data-card、h3、p），后续加人物只需加 li。 */
(function () {
  var root = document.querySelector("[data-char-carousel]");
  if (!root) return;
  var list = root.querySelector(".char-data");
  if (!list) return;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var items = [];
  var nodes = list.children;
  for (var n = 0; n < nodes.length; n++) {
    var li = nodes[n];
    if (!li || li.tagName !== "LI") continue;
    var h3 = li.querySelector("h3");
    var p = li.querySelector("p");
    var img = li.getAttribute("data-img") || "";
    var card = li.getAttribute("data-card") || img;
    items.push({
      name: h3 ? h3.textContent.replace(/\s+/g, " ").trim() : "",
      line: p ? p.textContent.replace(/\s+/g, " ").trim() : "",
      img: img,
      card: card,
      alt: li.getAttribute("data-alt") || "",
      sheet: li.getAttribute("data-sheet") || "",
      sheetAlt: li.getAttribute("data-sheet-alt") || ""
    });
  }
  var total = items.length;
  if (!total) return;

  var prevLabel = root.getAttribute("data-prev") || "Previous";
  var nextLabel = root.getAttribute("data-next") || "Next";
  var closeLabel = root.getAttribute("data-close") || "Close";
  var sheetLabel = root.getAttribute("data-sheet") || "Design sheet";
  var stillLabel = root.getAttribute("data-still") || "Back to still";

  var ui = document.createElement("div");
  ui.className = "char-ui";
  var stage = document.createElement("div");
  stage.className = "char-stage";
  var prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "char-nav prev";
  prevBtn.setAttribute("aria-label", prevLabel);
  prevBtn.textContent = "\u2039";
  var nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "char-nav next";
  nextBtn.setAttribute("aria-label", nextLabel);
  nextBtn.textContent = "\u203A";
  ui.appendChild(stage);
  ui.appendChild(prevBtn);
  ui.appendChild(nextBtn);

  var caption = document.createElement("div");
  caption.className = "char-caption";
  caption.setAttribute("aria-live", "polite");
  var capName = document.createElement("h3");
  var capLine = document.createElement("p");
  caption.appendChild(capName);
  caption.appendChild(capLine);

  list.setAttribute("hidden", "");
  root.insertBefore(ui, list.nextSibling);
  root.insertBefore(caption, ui.nextSibling);
  root.classList.add("is-on");

  var index = 0;
  var swiped = false;
  function wrap(k) { return ((k % total) + total) % total; }
  function rel(i) {
    var d = wrap(i - index);
    if (d > total / 2) d -= total;
    return d;
  }

  var slots = items.map(function (item, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "char-slot";
    btn.setAttribute("aria-label", item.name);
    if (item.card) {
      var im = document.createElement("img");
      im.src = item.card;
      im.alt = "";
      im.decoding = "async";
      btn.appendChild(im);
    } else {
      var ph = document.createElement("span");
      ph.className = "char-ph";
      ph.textContent = item.name;
      btn.appendChild(ph);
    }
    btn.addEventListener("click", function () {
      if (swiped) { swiped = false; return; }
      var d = rel(i);
      if (d === 0) openModal(items[i]); else go(d);
    });
    stage.appendChild(btn);
    return btn;
  });

  var capTimer = 0;
  function setCaption(instant) {
    var cur = items[index];
    clearTimeout(capTimer);
    function apply() {
      capName.textContent = cur.name;
      capLine.textContent = cur.line;
      caption.classList.remove("is-swap");
    }
    if (instant || reduce) { apply(); return; }
    caption.classList.add("is-swap");
    capTimer = setTimeout(apply, 280);
  }

  function render(instant) {
    for (var i = 0; i < total; i++) {
      var d = rel(i);
      var s = slots[i];
      var cls = "char-slot";
      var visible = true;
      if (d === 0) cls += " is-center";
      else if (d === -1 && total >= 3) cls += " is-left";
      else if (d === 1 && total >= 2) cls += " is-right";
      else { cls += d < 0 ? " is-out-left" : " is-out-right"; visible = false; }
      s.className = cls;
      s.setAttribute("tabindex", d === 0 ? "0" : "-1");
      if (d === 0) s.setAttribute("aria-current", "true"); else s.removeAttribute("aria-current");
      if (visible) s.removeAttribute("aria-hidden"); else s.setAttribute("aria-hidden", "true");
    }
    var showNav = total > 1;
    prevBtn.hidden = !showNav;
    nextBtn.hidden = !showNav;
    setCaption(instant);
  }

  function go(delta) {
    index = wrap(index + delta);
    render(false);
  }

  prevBtn.addEventListener("click", function () { go(-1); });
  nextBtn.addEventListener("click", function () { go(1); });

  var startX = null, startY = null;
  stage.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    swiped = false;
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (startX == null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    startX = null;
    startY = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      go(dx < 0 ? 1 : -1);
      setTimeout(function () { swiped = false; }, 400);
    }
  });

  var modal = document.createElement("div");
  modal.className = "char-modal";
  modal.hidden = true;
  modal.innerHTML =
    '<div class="char-modal-backdrop" data-close="1"></div>' +
    '<div class="char-modal-box" role="dialog" aria-modal="true" aria-labelledby="char-modal-title">' +
    '<button type="button" class="char-modal-close" data-close="1"></button>' +
    '<div class="char-modal-img"></div>' +
    '<h3 id="char-modal-title"></h3>' +
    '<p></p>' +
    '<button type="button" class="char-sheet-link" hidden></button></div>';
  modal.querySelector(".char-modal-close").setAttribute("aria-label", closeLabel);
  modal.querySelector(".char-modal-close").textContent = "\u00D7";
  document.body.appendChild(modal);
  var lastFocus = null, closeTimer = 0;

  function closeModal() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () { modal.hidden = true; }, reduce ? 0 : 480);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openModal(item) {
    lastFocus = document.activeElement;
    clearTimeout(closeTimer);
    var wrapImg = modal.querySelector(".char-modal-img");
    while (wrapImg.firstChild) wrapImg.removeChild(wrapImg.firstChild);
    var box = modal.querySelector(".char-modal-box");
    var sheetBtn = modal.querySelector(".char-sheet-link");
    box.classList.remove("is-sheet");
    var im = null;
    if (item.img) {
      im = document.createElement("img");
      im.src = item.img;
      im.alt = item.alt || item.name;
      wrapImg.appendChild(im);
    }
    // 设定图：弹窗里的第二入口，在剧照与设定拼板间切换（同一个图片元素，只换 src/alt）
    var showingSheet = false;
    if (im && item.sheet) {
      sheetBtn.hidden = false;
      sheetBtn.textContent = sheetLabel;
      sheetBtn.onclick = function () {
        showingSheet = !showingSheet;
        im.src = showingSheet ? item.sheet : item.img;
        im.alt = showingSheet ? (item.sheetAlt || item.name) : (item.alt || item.name);
        box.classList.toggle("is-sheet", showingSheet);
        sheetBtn.textContent = showingSheet ? stillLabel : sheetLabel;
      };
    } else {
      sheetBtn.hidden = true;
      sheetBtn.onclick = null;
    }
    modal.querySelector("h3").textContent = item.name;
    modal.querySelector("p").textContent = item.line;
    modal.hidden = false;
    void modal.offsetWidth;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    modal.querySelector(".char-modal-close").focus();
  }
  modal.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (!modal.hidden) {
      if (e.key === "Escape") closeModal();
      return;
    }
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  render(true);
})();
