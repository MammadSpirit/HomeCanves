/* پنل مدیریت بغل‌نما — اندازه + جنس ورق + رنگ + پرداخت سطح */
(function () {
    "use strict";

    var currentUnit = null;
    var manageSide = "left";

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

    function defaultSide(unit) {
        return {
            enabled: false,
            frontOffset: 0,
            width: unitDepth(unit),
            height: unitHeight(unit),
            material: "mdf",
            color: "",
            colorName: "",
            finish: "matte"
        };
    }

    function ensureData(unit) {
        if (!unit) return null;
        if (!unit.sideFacades || typeof unit.sideFacades !== "object") {
            unit.sideFacades = { left: defaultSide(unit), right: defaultSide(unit) };
        }
        var defW = unitDepth(unit);
        var defH = unitHeight(unit);
        ["left", "right"].forEach(function (side) {
            if (!unit.sideFacades[side]) unit.sideFacades[side] = defaultSide(unit);
            var s = unit.sideFacades[side];
            if (typeof s.enabled !== "boolean") s.enabled = !!s.enabled;
            var w = parseFloat(s.width);
            if (s.width == null || isNaN(w) || w <= 0 || Math.abs(w - 1.6) < 0.001) s.width = defW;
            var h = parseFloat(s.height);
            if (s.height == null || isNaN(h) || h <= 0) s.height = defH;
            var fo = parseFloat(s.frontOffset);
            if (s.frontOffset == null || isNaN(fo) || fo < 0) s.frontOffset = 0;
            if (!s.material) s.material = "mdf";
            if (s.color == null) s.color = "";
            if (s.colorName == null) s.colorName = "";
            if (!s.finish) s.finish = "matte";
        });
        return unit.sideFacades;
    }

    function getSelectedUnit() {
        var units = window.closetFrameUnits || [];
        return units.find(function (u) { return u.id === window.selectedClosetFrameId; }) || null;
    }

    function syncUnit() {
        if (!currentUnit) return;
        var units = window.closetFrameUnits || [];
        var idx = units.findIndex(function (u) { return u.id === currentUnit.id; });
        if (idx >= 0) units[idx].sideFacades = currentUnit.sideFacades;
    }

    function refresh3D() {
        try {
            if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.refreshCabinets === "function") {
                Kitchen3D.refreshCabinets();
            }
            if (typeof draw === "function") draw();
        } catch (e) { /* ignore */ }
    }

    function currentSideData() {
        if (!currentUnit) return null;
        var data = ensureData(currentUnit);
        return data[manageSide] || defaultSide(currentUnit);
    }

    function openBaghelNamaManagePanel() {
        try {
            var target = getSelectedUnit();
            if (!target) {
                alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
                return;
            }
            currentUnit = target;
            ensureData(currentUnit);
            manageSide = "left";
            var panel = document.getElementById("closet-baghel-nama-manage-panel");
            if (!panel) {
                console.warn("[BaghelManage] پنل مدیریت هنوز لود نشده.");
                return;
            }
            panel.classList.add("active");
            updateManageUI();
        } catch (e) {
            console.error("[BaghelManage] open:", e);
        }
    }

    function closeBaghelNamaManagePanel() {
        var panel = document.getElementById("closet-baghel-nama-manage-panel");
        if (panel) panel.classList.remove("active");
    }

    function selectBaghelManageSide(side) {
        manageSide = side === "right" ? "right" : "left";
        updateManageUI();
    }

    function updateManageUI() {
        if (!currentUnit) return;
        var data = ensureData(currentUnit);
        var leftOn = !!(data.left && data.left.enabled);
        var rightOn = !!(data.right && data.right.enabled);

        var leftStatus = document.getElementById("baghel-m-left-status");
        var rightStatus = document.getElementById("baghel-m-right-status");
        if (leftStatus) {
            leftStatus.textContent = leftOn ? "فعال" : "غیرفعال";
            leftStatus.style.color = leftOn ? "#22c55e" : "#94a3b8";
        }
        if (rightStatus) {
            rightStatus.textContent = rightOn ? "فعال" : "غیرفعال";
            rightStatus.style.color = rightOn ? "#22c55e" : "#94a3b8";
        }

        var leftRow = document.getElementById("baghel-m-left-row");
        var rightRow = document.getElementById("baghel-m-right-row");
        if (leftRow) {
            leftRow.style.borderColor = manageSide === "left" ? "#0ea5e9" : "#334155";
            leftRow.style.background = manageSide === "left" ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.02)";
        }
        if (rightRow) {
            rightRow.style.borderColor = manageSide === "right" ? "#0ea5e9" : "#334155";
            rightRow.style.background = manageSide === "right" ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.02)";
        }

        var sideLabel = document.getElementById("baghel-m-side-label");
        var matSideLabel = document.getElementById("baghel-m-mat-side-label");
        var sideName = manageSide === "right" ? "راست" : "چپ";
        if (sideLabel) sideLabel.textContent = sideName;
        if (matSideLabel) matSideLabel.textContent = sideName;

        var sideData = data[manageSide] || defaultSide(currentUnit);
        var fInput = document.getElementById("baghel-m-front");
        var wInput = document.getElementById("baghel-m-width");
        var hInput = document.getElementById("baghel-m-height");
        if (fInput) {
            var fo = parseFloat(sideData.frontOffset);
            fInput.value = (!isNaN(fo) && fo >= 0) ? fo : 0;
        }
        if (wInput) wInput.value = parseFloat(sideData.width) || unitDepth(currentUnit);
        if (hInput) hInput.value = parseFloat(sideData.height) || unitHeight(currentUnit);

        var matSel = document.getElementById("baghel-m-material");
        var colorInput = document.getElementById("baghel-m-color");
        var finishSel = document.getElementById("baghel-m-finish");
        if (matSel) matSel.value = sideData.material || "mdf";
        if (colorInput) colorInput.value = sideData.colorName || "";
        if (finishSel) finishSel.value = sideData.finish || "matte";
    }

    function onBaghelManageSizeChange() {
        try {
            if (!currentUnit) return;
            var data = ensureData(currentUnit);
            var side = manageSide === "right" ? "right" : "left";
            data[side] = data[side] || defaultSide(currentUnit);
            var f = parseFloat(document.getElementById("baghel-m-front") && document.getElementById("baghel-m-front").value);
            var w = parseFloat(document.getElementById("baghel-m-width") && document.getElementById("baghel-m-width").value);
            var h = parseFloat(document.getElementById("baghel-m-height") && document.getElementById("baghel-m-height").value);
            if (!isNaN(f) && f >= 0) data[side].frontOffset = f;
            if (!isNaN(w) && w > 0) data[side].width = w;
            if (!isNaN(h) && h > 0) data[side].height = h;
            syncUnit();
            refresh3D();
        } catch (e) {
            console.error("[BaghelManage] size:", e);
        }
    }

    function onBaghelManageMaterialChange(value) {
        try {
            if (!currentUnit) return;
            var data = ensureData(currentUnit);
            var side = manageSide === "right" ? "right" : "left";
            data[side] = data[side] || defaultSide(currentUnit);
            data[side].material = value || "mdf";
            syncUnit();
            refresh3D();
        } catch (e) {
            console.error("[BaghelManage] material:", e);
        }
    }

    function onBaghelManageFinishChange(value) {
        try {
            if (!currentUnit) return;
            var data = ensureData(currentUnit);
            var side = manageSide === "right" ? "right" : "left";
            data[side] = data[side] || defaultSide(currentUnit);
            data[side].finish = value || "matte";
            syncUnit();
            refresh3D();
        } catch (e) {
            console.error("[BaghelManage] finish:", e);
        }
    }

    function openBaghelManageColorPicker() {
        try {
            if (!currentUnit) return;
            var sideData = currentSideData();
            if (!sideData) return;
            var mat = sideData.material || "mdf";
            if (typeof openUniversalModal !== "function") {
                alert("انتخابگر رنگ در دسترس نیست.");
                return;
            }
            openUniversalModal("انتخاب رنگ بغل‌نما", mat, function (selectedColor) {
                if (!selectedColor || !currentUnit) return;
                var data = ensureData(currentUnit);
                var side = manageSide === "right" ? "right" : "left";
                data[side] = data[side] || defaultSide(currentUnit);
                if (selectedColor.texture) {
                    data[side].color = selectedColor.texture;
                } else {
                    data[side].color = selectedColor.code || "";
                }
                data[side].colorName = selectedColor.name || "";
                var colorInput = document.getElementById("baghel-m-color");
                if (colorInput) colorInput.value = data[side].colorName;
                syncUnit();
                refresh3D();
            });
        } catch (e) {
            console.error("[BaghelManage] color:", e);
        }
    }

    window.openBaghelNamaManagePanel = openBaghelNamaManagePanel;
    window.closeBaghelNamaManagePanel = closeBaghelNamaManagePanel;
    window.selectBaghelManageSide = selectBaghelManageSide;
    window.onBaghelManageSizeChange = onBaghelManageSizeChange;
    window.onBaghelManageMaterialChange = onBaghelManageMaterialChange;
    window.onBaghelManageFinishChange = onBaghelManageFinishChange;
    window.openBaghelManageColorPicker = openBaghelManageColorPicker;
})();
