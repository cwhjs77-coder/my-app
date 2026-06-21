const fs   = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// 최소 유효 PNG (1×1 파란색 픽셀)
const minPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

["icon.png", "splash.png", "adaptive-icon.png", "favicon.png"].forEach((f) => {
  const p = path.join(assetsDir, f);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, minPng);
    console.log("생성:", f);
  } else {
    console.log("이미 존재:", f);
  }
});
console.log("assets 준비 완료");
