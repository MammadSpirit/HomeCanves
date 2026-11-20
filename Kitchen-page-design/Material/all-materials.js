// all-materials.js - نسخه تست: فقط MDF کاملاً فعال، بقیه ساده

const allMaterials = {
  // 1. MDF - کامل و فعال (رنگ + تکسچر)
  mdf: [
    { name: "سفید یخچالی", code: "#FFFFFF" },
    { name: "گردویی تیره", code: "#8B4513" },
    { name: "آبی آسمانی", code: "#87CEEB" },
    { name: "خاکستری روشن", code: "#D3D3D3" },
    { name: "مشکی مات", code: "#2F2F2F" },
{ name: "سبز کله‌غازی", code: "#006666" },
{ name: "طوسی", code: "#808080" },
{ name: "کرم", code: "#FFF8DC" },

    // تکسچرها
    { name: "بلوط", texture: "https://i.ibb.co/ynKB934M/file-000000003f30720aac5348d91ef1ffb2.png" },
    { name: "طرح چوب ۱۴۷", texture: "https://i.ibb.co/FbczyH3f/image-1780814074274.jpg" },
    { name: "لیون روشن", texture: "https://i.ibb.co/mCFBpLW0/image.png" },
        { name: "9921", texture: "https://i.ibb.co/6RGCs62k/9921.png" },
                { name: "بالتیمور روشن", texture: "https://i.ibb.co/DHdm1RPz/image.png" },
                
                                { name: "نچرال", texture: "https://i.ibb.co/XZpwPQv1/image.png" },
    
                                    { name: "۸۳۵ خاکی", texture: "https://i.ibb.co/Kp7gwLPr/835.png" },
  ],

  // بقیه دسته‌ها موقتاً ساده و بدون انتخاب واقعی (فقط برای ساختار)
  highGloss: [
{ name: "طوسی براق ", texture: "https://i.ibb.co/b50TfMzw/file-00000000dd6c720aaee6c7ff25a06ddf.png" },
 { name: "AGT 4017", texture: "https://i.ibb.co/mrY6XCfG/Agt4017.png" },
  ],

  leteron: [
    { name: "لترون (در آینده)", code: "#AAAAAA" }
  ],

  countertop: [
    { name: "صفحه کابینت (در آینده)", code: "#666666" },
    { name: "1240", texture: "https://i.ibb.co/CCGXCgq/file-0000000010b0720ab45a2c9518a5e5db.png" },
      { name: "4224", texture: "https://i.ibb.co/G44BNPhX/4224.png" },
       { name: "4217", texture: "https://i.ibb.co/tTJmtNGs/4217.png" },
       { name: "4412", texture: "https://i.ibb.co/BHbB8Lxg/4412.png" },
       { name: "4431", texture: "https://i.ibb.co/qM3887y6/file-000000006ec8720ab2be1650b6bd08bf.png" },
       { name: "مشکی طرح سنگ", texture: "https://i.ibb.co/0jCKQvvZ/file-000000000084720ab816d6024d6b869c.png" },
        { name: "4408", texture: "https://i.ibb.co/ddjM956/4408.png" },
        { name: "4409", texture: "https://i.ibb.co/0yK8VD2Z/4409.png" },
                { name: "1050", texture: "https://i.ibb.co/qYRWdn6v/1050.png" },
  ],

  backsplash: [
            { name: "103", texture: "https://i.ibb.co/ZznRjf7j/103.jpg" },
            
  ],
  
   PVC: [
    { name: "پی وی سی سفید", code: "#e2e8f0" }
  ],
  
    Fibr: [
  { name: "سفید پرینتی", code: "#FFFFFF" }
],

};

// برای دسترسی در بقیه فایل‌ها
window.allMaterials = allMaterials;