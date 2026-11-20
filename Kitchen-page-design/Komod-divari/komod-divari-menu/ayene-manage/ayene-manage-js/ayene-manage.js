// پنل مدیریت ایینه — کمد دیواری
(function () {
    "use strict";

    var currentUnit = null;


    var FRAME_THICKNESS_AY = 5.5;

    function renderAyeneManageFramePreview(svgId, unit) {
        var svg = document.getElementById(svgId);
        if (!svg || !unit) return;
        var parts = unit.parts || [];
        if (!parts.length) {
            svg.innerHTML = '<text x="50%" y="50%" fill="#94a3b8" font-size="13" font-family="Tahoma" text-anchor="middle" dominant-baseline="middle">قطعات چهارچوب یافت نشد</text>';
            return;
        }

        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        parts.forEach(function (part) {
            var pW = part.orientation === "horizontal" ? part.length : FRAME_THICKNESS_AY;
            var pH = part.orientation === "vertical" ? part.length : FRAME_THICKNESS_AY;
            minX = Math.min(minX, part.x);
            maxX = Math.max(maxX, part.x + pW);
            minY = Math.min(minY, part.y);
            maxY = Math.max(maxY, part.y + pH);
        });
        if (!isFinite(minX)) {
            minX = 0; maxX = 100; minY = 0; maxY = 100;
        }

        var pad = 18;
        var boundX = minX - pad;
        var boundY = -(maxY + pad);
        var boundWidth = (maxX - minX) + pad * 2;
        var boundHeight = (maxY - minY) + pad * 2;
        svg.setAttribute("viewBox", boundX + " " + boundY + " " + boundWidth + " " + boundHeight);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        var html = ""
            + "<defs>"
            + '<pattern id="ayeneMGrid" width="10" height="10" patternUnits="userSpaceOnUse">'
            + '<path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" stroke-width="0.5"/>'
            + "</pattern>"
            + '<linearGradient id="ayeneMWood" x1="0%" y1="0%" x2="100%" y2="100%">'
            + '<stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1e293b"/>'
            + "</linearGradient>"
            + '<linearGradient id="ayeneMMirrorGrad" x1="0%" y1="0%" x2="100%" y2="100%">'
            + '<stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.85"/>'
            + '<stop offset="50%" stop-color="#38bdf8" stop-opacity="0.7"/>'
            + '<stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.9"/>'
            + "</linearGradient>"
            + "</defs>"
            + '<rect x="' + boundX + '" y="' + boundY + '" width="' + boundWidth + '" height="' + boundHeight + '" fill="url(#ayeneMGrid)"/>'
            + '<line x1="' + boundX + '" y1="0" x2="' + (boundX + boundWidth) + '" y2="0" stroke="#22c55e" stroke-width="1.2" stroke-dasharray="3"/>';

        parts.forEach(function (part) {
            var pW = part.orientation === "horizontal" ? part.length : FRAME_THICKNESS_AY;
            var pH = part.orientation === "vertical" ? part.length : FRAME_THICKNESS_AY;
            var rx = part.x;
            var ry = -(part.y + pH);
            html += '<rect x="' + rx + '" y="' + ry + '" width="' + pW + '" height="' + pH + '"'
                + ' fill="url(#ayeneMWood)" stroke="#64748b" stroke-width="1" rx="1.5"/>';
        });

        // ایینه
        var data = unit.ayene || {};
        var mw = parseFloat(data.width) || 40;
        var mh = parseFloat(data.height) || 120;
        var placement = data.placement || "front";
        var frameW = maxX - minX;
        var frameH = maxY - minY;
        var mx, my;

        if (placement === "side-left") {
            mx = minX - mw - 2;
            my = minY + Math.max(0, (frameH - mh) / 2);
        } else if (placement === "side-right") {
            mx = maxX + 2;
            my = minY + Math.max(0, (frameH - mh) / 2);
        } else if (placement === "inside") {
            mx = minX + Math.max(0, (frameW - mw) / 2);
            my = minY + Math.max(0, (frameH - mh) / 2);
        } else {
            // front — مرکز چهارچوب
            mx = minX + Math.max(0, (frameW - mw) / 2);
            my = minY + Math.max(0, (frameH - mh) / 2);
        }

        var mirrorOpacity = data.enabled === false ? 0.25 : 0.85;
        var mry = -(my + mh);
        html += '<rect x="' + mx + '" y="' + mry + '" width="' + mw + '" height="' + mh + '"'
            + ' fill="url(#ayeneMMirrorGrad)" stroke="#38bdf8" stroke-width="2" rx="2" opacity="' + mirrorOpacity + '"/>';
        html += '<text x="' + (mx + mw / 2) + '" y="' + (mry + mh / 2) + '"'
            + ' fill="#e0f2fe" font-size="9" font-weight="bold" font-family="Tahoma"'
            + ' text-anchor="middle" dominant-baseline="middle" opacity="' + mirrorOpacity + '">ایینه</text>';

        if (data.enabled === false) {
            html += '<text x="' + (boundX + boundWidth / 2) + '" y="' + (boundY + 12) + '"'
                + ' fill="#f87171" font-size="10" font-family="Tahoma" text-anchor="middle">غیرفعال</text>';
        }

        svg.innerHTML = html;
    }

    function getSelectedUnit() {
        var units = window.closetFrameUnits || [];
        return units.find(function (u) { return u.id === window.selectedClosetFrameId; }) || null;
    }

    function unitWidth(unit) {
        var w = parseFloat(unit && (unit.width != null ? unit.width : unit.w));
        return (!isNaN(w) && w > 0) ? w : 100;
    }

    function unitHeight(unit) {
        var h = parseFloat(unit && (unit.height != null ? unit.height : unit.h));
        return (!isNaN(h) && h > 0) ? h : 220;
    }

    function ensureData(unit) {
        if (!unit) return null;
        if (!unit.ayene || typeof unit.ayene !== "object") {
            unit.ayene = {
                enabled: false,
                placement: "front",
                width: Math.min(40, unitWidth(unit)),
                height: Math.min(120, unitHeight(unit))
            };
        }
        var a = unit.ayene;
        if (a.placement == null) a.placement = "front";
        if (a.width == null || isNaN(parseFloat(a.width))) a.width = 40;
        if (a.height == null || isNaN(parseFloat(a.height))) a.height = 120;
        if (a.enabled == null) a.enabled = false;
        return a;
    }

    function placementLabel(p) {
        if (p === "inside") return "داخل کمد";
        if (p === "side-left") return "بغل چپ";
        if (p === "side-right") return "بغل راست";
        return "جلوی چهارچوب";
    }

    function refresh3D() {
        try {
            if (window.Kitchen3D && typeof window.Kitchen3D.renderClosetFrameUnit === "function") {
                window.Kitchen3D.renderClosetFrameUnit();
            } else if (window.Kitchen3D && typeof window.Kitchen3D.refreshCabinets === "function") {
                window.Kitchen3D.refreshCabinets();
            }
        } catch (e) {}
        try {
            if (window.KitchenBabylon && typeof window.KitchenBabylon.refreshCabinets === "function") {
                window.KitchenBabylon.refreshCabinets();
            }
        } catch (e) {}
        try {
            if (typeof window.drawRoom === "function") window.drawRoom();
            else if (typeof window.draw === "function") window.draw();
        } catch (e) {}
    }

    function updateManageUI() {
        if (!currentUnit) return;
        var data = ensureData(currentUnit);

        var info = document.getElementById("ayene-m-unit-info");
        if (info) {
            info.textContent = "چهارچوب #" + (currentUnit.id != null ? currentUnit.id : "-") +
                " — " + unitWidth(currentUnit) + " × " + unitHeight(currentUnit) + " cm";
        }

        var status = document.getElementById("ayene-m-status-text");
        if (status) {
            if (data.enabled) {
                status.style.color = "#4ade80";
                status.textContent = "فعال — " + placementLabel(data.placement) +
                    " — " + data.width + "×" + data.height + " cm";
            } else {
                status.style.color = "#94a3b8";
                status.textContent = "غیرفعال / بدون ایینه فعال";
            }
        }

        var radio = document.querySelector('input[name="ayene-m-placement"][value="' + (data.placement || "front") + '"]');
        if (radio) radio.checked = true;

        var wEl = document.getElementById("ayene-m-width");
        var hEl = document.getElementById("ayene-m-height");
        if (wEl) wEl.value = data.width;
        if (hEl) hEl.value = data.height;
        if (currentUnit) renderAyeneManageFramePreview("ayene-m-preview-svg", currentUnit);
    }

    function openAyeneManagePanel() {
        try {
            var target = getSelectedUnit();
            if (!target) {
                alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
                return;
            }
            currentUnit = target;
            ensureData(currentUnit);
            var panel = document.getElementById("closet-ayene-manage-panel");
            if (!panel) {
                console.warn("[AyeneManage] پنل هنوز لود نشده.");
                return;
            }
            panel.classList.add("active");
            updateManageUI();
            renderAyeneManageFramePreview("ayene-m-preview-svg", currentUnit);
        } catch (e) {
            console.error("[AyeneManage] open:", e);
        }
    }

    function closeAyeneManagePanel() {
        var panel = document.getElementById("closet-ayene-manage-panel");
        if (panel) panel.classList.remove("active");
    }

    function onAyeneManagePlacementChange() {
        if (!currentUnit) return;
        var data = ensureData(currentUnit);
        var checked = document.querySelector('input[name="ayene-m-placement"]:checked');
        data.placement = checked ? checked.value : "front";
        updateManageUI();
    }

    function onAyeneManageDimChange() {
        if (!currentUnit) return;
        var data = ensureData(currentUnit);
        var wEl = document.getElementById("ayene-m-width");
        var hEl = document.getElementById("ayene-m-height");
        var w = parseFloat(wEl && wEl.value);
        var h = parseFloat(hEl && hEl.value);
        if (!isNaN(w) && w > 0) data.width = w;
        if (!isNaN(h) && h > 0) data.height = h;
        updateManageUI();
    }

    function setAyeneManageEnabled(on) {
        if (!currentUnit) {
            alert("لطفاً ابتدا یک چهارچوب کمد دیواری را انتخاب کنید.");
            return;
        }
        var data = ensureData(currentUnit);
        data.enabled = !!on;
        onAyeneManagePlacementChange();
        onAyeneManageDimChange();
        updateManageUI();
        refresh3D();
    }

    function removeAyeneFromUnit() {
        if (!currentUnit) return;
        if (!confirm("ایینه این چهارچوب حذف شود؟")) return;
        currentUnit.ayene = {
            enabled: false,
            placement: "front",
            width: 40,
            height: 120
        };
        updateManageUI();
        refresh3D();
    }

    function applyAyeneManageSettings() {
        if (!currentUnit) {
            alert("لطفاً ابتدا یک چهارچوب کمد دیواری را انتخاب کنید.");
            return;
        }
        ensureData(currentUnit);
        onAyeneManagePlacementChange();
        onAyeneManageDimChange();
        updateManageUI();
        refresh3D();
        closeAyeneManagePanel();
    }

    window.openAyeneManagePanel = openAyeneManagePanel;
    window.closeAyeneManagePanel = closeAyeneManagePanel;
    window.onAyeneManagePlacementChange = onAyeneManagePlacementChange;
    window.onAyeneManageDimChange = onAyeneManageDimChange;
    window.setAyeneManageEnabled = setAyeneManageEnabled;
    window.removeAyeneFromUnit = removeAyeneFromUnit;
    window.applyAyeneManageSettings = applyAyeneManageSettings;
})();
