
function refreshBabylonPillars() {
    try {
        if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
            if (typeof window.KitchenBabylon.refreshPillars === 'function') {
                window.KitchenBabylon.refreshPillars();
            } else if (typeof window.KitchenBabylon._renderPillars === 'function') {
                window.KitchenBabylon._renderPillars();
            }
        }
    } catch (e) {}
}
// pillars.js - مدیریت ستون‌ها (نسخه نهایی با لیست انتخابگر)

/**
 * بروزرسانی لیست ستون‌ها در باکس پنل (مشابه بین‌کابینتی)
 */
function renderPillarsList() {
    const container = document.getElementById("pillars-list-container");
    if (!container) return;

    if (pillars.length === 0) {
        container.innerHTML = '<div style="color:#64748b; text-align:center; padding:10px; font-size:12px;">هیچ ستونی ساخته نشده است</div>';
        return;
    }

    let html = "";
    pillars.forEach((p, index) => {
        const isSelected = p.id === selectedPillarId;
        // استایل آیتم‌ها مشابه لیست بین‌کابینتی
        const bg = isSelected ? "#3b82f6" : "#2d3748";
        const border = isSelected ? "1px solid #60a5fa" : "1px solid #4a5568";
        
        html += `
            <div onclick="selectPillar(${p.id})" style="
                background: ${bg}; 
                border: ${border};
                color: white;
                padding: 8px 12px;
                margin-bottom: 6px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                transition: all 0.2s;
            ">
                <span>ستون شماره ${index + 1}</span>
                <span style="opacity: 0.7; font-size: 10px;">${p.w} × ${p.d} cm</span>
            </div>
        `;
    });
    container.innerHTML = html;
}


function addPillar() {
  let id = pillars.length > 0 ? pillars[pillars.length - 1].id + 1 : 1;
  let newPillar = { 
    id: id, 
    x: room.w / 4, 
    y: room.d / 4, 
    w: 30.0, 
    d: 30.0 
  };
  
  pillars.push(newPillar);
  if (typeof refreshBabylonPillars === 'function') refreshBabylonPillars();
  selectPillar(id);
  renderPillarsList(); // بروزرسانی لیست بعد از افزودن
}

function selectPillar(id) {
  selectedPillarId = id;
  selectedId = -1;

  ["door-editor-btn", "countertop-editor-btn", "color-editor-btn"].forEach((btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = true;
  });

  const p = pillars.find((x) => x.id === id);
  if (p) {
    if(document.getElementById("pillar-x")) document.getElementById("pillar-x").value = p.x.toFixed(1);
    if(document.getElementById("pillar-y")) document.getElementById("pillar-y").value = p.y.toFixed(1);
    if(document.getElementById("pillar-width")) document.getElementById("pillar-width").value = p.w.toFixed(1);
    if(document.getElementById("pillar-depth")) document.getElementById("pillar-depth").value = p.d.toFixed(1);
    
    // نام کلاس اصلاح شد
    const delBtn = document.querySelector(".pillar-delete-btn");
    if(delBtn) delBtn.style.display = "flex";
  }

  renderPillarsList(); 
    if (typeof updateToolbarPositionInputs === 'function') updateToolbarPositionInputs();
  draw();
}


function openPillarEditorPanel() {
  const panel = document.getElementById("pillar-editor-panel");
  if (!panel) return;

  panel.classList.add("active");
  renderPillarsList(); 

  const delBtn = document.querySelector(".pillar-delete-btn"); // نام کلاس اصلاح شد

  if (selectedPillarId !== -1) {
    const p = pillars.find((x) => x.id === selectedPillarId);
    if (p) {
      document.getElementById("pillar-x").value = p.x.toFixed(1);
      document.getElementById("pillar-y").value = p.y.toFixed(1);
      document.getElementById("pillar-width").value = p.w.toFixed(1);
      document.getElementById("pillar-depth").value = p.d.toFixed(1);
      
      if(delBtn) delBtn.style.display = "flex"; // نمایش دکمه
    }
  } else {
    // اگر هیچ ستونی انتخاب نشده، دکمه باید مخفی باشد
    if(delBtn) delBtn.style.display = "none";
  }
}


function applyPillarChanges() {
  if (selectedPillarId === -1) return;
  const p = pillars.find((x) => x.id === selectedPillarId);
  if (!p) return;

  p.x = parseFloat(document.getElementById("pillar-x").value) || 0;
  p.y = parseFloat(document.getElementById("pillar-y").value) || 0;
  p.w = parseFloat(document.getElementById("pillar-width").value) || 30;
  p.d = parseFloat(document.getElementById("pillar-depth").value) || 30;

  draw();
  renderPillarsList(); // آپدیت ابعاد در لیست
  if (typeof refreshBabylonPillars === 'function') refreshBabylonPillars();
  if (window.Kitchen3D && typeof Kitchen3D.renderPillars === 'function') {
    try {
      // پاکسازی ستون‌های قبلی Three در صورت باز بودن نما
      if (Kitchen3D.scene) {
        const toRem = [];
        Kitchen3D.scene.traverse(function (o) {
          if (o.userData && o.userData.isPillar) toRem.push(o);
        });
        toRem.forEach(function (o) {
          if (o.parent) o.parent.remove(o);
          else Kitchen3D.scene.remove(o);
        });
        Kitchen3D.renderPillars();
      }
    } catch (e) {}
  }
  alert("تغییرات ثبت شد.");
}

function deleteSelectedPillar() {
  if (selectedPillarId === -1) return;
  if (!confirm("آیا از حذف این ستون مطمئن هستید؟")) return;

  pillars = pillars.filter((p) => p.id !== selectedPillarId);
  selectedPillarId = -1;
  
  draw();
  renderPillarsList(); 
  
  ["pillar-x", "pillar-y", "pillar-width", "pillar-depth"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
  
  // نام کلاس اصلاح شد
  const delBtn = document.querySelector(".pillar-delete-btn");
  if(delBtn) delBtn.style.display = "none";
}


function closePillarEditorPanel() {
  document.getElementById("pillar-editor-panel").classList.remove("active");
}
