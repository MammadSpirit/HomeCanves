

function addClosetFrameDefault() {
    const DEFAULT_SIZE = 100; // 🌟 عرض و ارتفاع پیش‌فرض (سانتی‌متر)
window.selectedClosetFrameId = null;
    currentClosetFrameParts = [
        { id: 1, name: "دیواره چپ", length: DEFAULT_SIZE - (FRAME_THICKNESS * 2), orientation: "vertical", x: 0, y: FRAME_THICKNESS, origin: "bottom" },
        { id: 2, name: "دیواره راست", length: DEFAULT_SIZE - (FRAME_THICKNESS * 2), orientation: "vertical", x: DEFAULT_SIZE - FRAME_THICKNESS, y: FRAME_THICKNESS, origin: "bottom" },
        { id: 3, name: "کف چهارچوب", length: DEFAULT_SIZE, orientation: "horizontal", x: 0, y: 0, origin: "left" },
        { id: 4, name: "سقف چهارچوب", length: DEFAULT_SIZE, orientation: "horizontal", x: 0, y: DEFAULT_SIZE - FRAME_THICKNESS, origin: "left" }
    ];

    selectedPartId = null;

    // مستقیم اعمال و اضافه به صحنه، بدون باز کردن پنل
    applyClosetFrameSettings();
}

window.addClosetFrameDefault = addClosetFrameDefault;