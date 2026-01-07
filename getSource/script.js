function openSource() {
  const s = document.getElementById("url").value.trim();
  if (!s) return;

  let u;
  try {
    u = new URL(s);
  } catch {
    alert("URLが不正です");
    return;
  }

  if (!["http:", "https:"].includes(u.protocol)) {
    alert("http / https のみ対応しています");
    return;
  }

  window.open("view-source:" + u.href, "_blank", "noopener");
}

document.getElementById("open").addEventListener("click", openSource);
document.getElementById("url").addEventListener("keydown", e => {
  if (e.key === "Enter") openSource();
});