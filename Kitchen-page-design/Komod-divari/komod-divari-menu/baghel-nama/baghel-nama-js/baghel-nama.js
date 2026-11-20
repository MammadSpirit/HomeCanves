/* بغل‌نما چهارچوب کمد — فقط با کلیک منو اجرا می‌شود */
(function () {
    "use strict";

    var currentBaghelUnit = null;
    var selectedBaghelSide = "left";

    function unitDepth(unit) {
        var d = unit && unit.d != null ? parseFloat(unit.d) : NaN;
        if (isNaN(d) || d <= 0) d = 60;
        return d;
    }
    function unitHeight(unit) {
        var h = unit && unit.h != null ? parseFloat(unit.h) : NaN;
        if (isNaN(h) || h <= 0) h = 100;
        return h;
    }
    function ensureData(unit) {
        if (!unit) return null;
        if (!unit.sideFacades || typeof unit.sideFacades !== "object") {
            unit.sideFacades = {
                left: { enabled: false, width: unitDepth(unit), height: unitHeight(unit) },
                right: { enabled: false, width: unitDepth(unit), height: unitHeight(unit) }
            };
        }
        ["left", "right"].forEach(function (side) {
            if (!unit.sideFacades[side]) {
                unit.sideFacades[side] = { enabled: false, width: unitDepth(unit), height: unitHeight(unit) };
            }
            var s = unit.sideFacades[side];
            var w = parseFloat(s.width);
            if (s.width == null || isNaN(w) || w <= 0 || Math.abs(w - 1.6) < 0.001) {
                s.width = unitDepth(unit);
            }
            var h = parseFloat(s.height);
            if (s.height == null || isNaN(h) || h <= 0) {
                s.height = unitHeight(unit);
            }
        });
        return unit.sideFacades;
    }

    function openBaghelNamaPanel() {
        try {
            var units = window.closetFrameUnits || [];
            var target = units.find(function (u) { return u.id === window.selectedClosetFrameId; });
            if (!target) {
                alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
                return;
            }
            currentBaghelUnit = target;
            ensureData(currentBaghelUnit);
            selectedBaghelSide = "left";
            var leftRadio = document.querySelector('input[name="baghel-nama-side"][value="left"]');
            if (leftRadio) leftRadio.checked = true;

            var panel = document.getElementById("closet-baghel-nama-panel");
            if (!panel) {
                console.warn("[BaghelNama] پنل هنوز لود نشده.");
                return;
            }
            panel.classList.add("active");
            updateUI();
        } catch (e) {
            console.error("[BaghelNama] open:", e);
        }
    }

    function closeBaghelNamaPanel() {
        var panel = document.getElementById("closet-baghel-nama-panel");
        if (panel) panel.classList.remove("active");
    }

    function onBaghelNamaSideChange() {
        var checked = document.querySelector('input[name="baghel-nama-side"]:checked');
        selectedBaghelSide = checked ? checked.value : "left";
        updateUI();
    }

    function updateUI() {
        if (!currentBaghelUnit) return;
        var data = ensureData(currentBaghelUnit);
        var leftOn = !!(data.left && data.left.enabled);
        var rightOn = !!(data.right && data.right.enabled);

        var leftStatus = document.getElementById("baghel-left-status");
        var rightStatus = document.getElementById("baghel-right-status");
        if (leftStatus) {
            leftStatus.textContent = leftOn ? "فعال" : "غیرفعال";
            leftStatus.style.color = leftOn ? "#22c55e" : "#94a3b8";
        }
        if (rightStatus) {
            rightStatus.textContent = rightOn ? "فعال" : "غیرفعال";
            rightStatus.style.color = rightOn ? "#22c55e" : "#94a3b8";
        }

        var leftLabel = document.getElementById("baghel-side-left-label");
        var rightLabel = document.getElementById("baghel-side-right-label");
        if (leftLabel) {
            leftLabel.style.borderColor = selectedBaghelSide === "left" ? "#0ea5e9" : "#334155";
            leftLabel.style.background = selectedBaghelSide === "left" ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.02)";
        }
        if (rightLabel) {
            rightLabel.style.borderColor = selectedBaghelSide === "right" ? "#0ea5e9" : "#334155";
            rightLabel.style.background = selectedBaghelSide === "right" ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.02)";
        }
    }

    function toggleBaghelNamaForSelectedSide(enabled) {
        try {
            if (!currentBaghelUnit) {
                alert("چهارچوب انتخاب نشده است.");
                return;
            }
            var data = ensureData(currentBaghelUnit);
            var side = selectedBaghelSide === "right" ? "right" : "left";
            data[side] = data[side] || {};
            data[side].enabled = !!enabled;
            if (enabled) {
                var w = parseFloat(data[side].width);
                if (isNaN(w) || w <= 0 || Math.abs(w - 1.6) < 0.001) data[side].width = unitDepth(currentBaghelUnit);
                var h = parseFloat(data[side].height);
                if (isNaN(h) || h <= 0) data[side].height = unitHeight(currentBaghelUnit);
            }

            var units = window.closetFrameUnits || [];
            var idx = units.findIndex(function (u) { return u.id === currentBaghelUnit.id; });
            if (idx >= 0) units[idx].sideFacades = currentBaghelUnit.sideFacades;

            updateUI();
            if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.refreshCabinets === "function") {
                Kitchen3D.refreshCabinets();
            }
            if (typeof draw === "function") draw();
        } catch (e) {
            console.error("[BaghelNama] toggle:", e);
        }
    }

    window.openBaghelNamaPanel = openBaghelNamaPanel;
    window.closeBaghelNamaPanel = closeBaghelNamaPanel;
    window.onBaghelNamaSideChange = onBaghelNamaSideChange;
    window.toggleBaghelNamaForSelectedSide = toggleBaghelNamaForSelectedSide;
})();
