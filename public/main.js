async function fetchAllowlist() {
  const el = document.getElementById("allowlist");
  try {
    const res = await fetch("/allowlist");
    const data = await res.json();
    el.textContent = `İzinli alan adları: ${data.allowlist.join(", ")}`;
  } catch {
    el.textContent = "İzinli alan adları yüklenemedi.";
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const url = document.getElementById("url").value.trim();
  const attest = document.getElementById("attest").checked;
  const msg = document.getElementById("msg");

  msg.textContent = "İşleniyor...";

  try {
    const res = await fetch("/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rights-attestation": attest ? "true" : "false"
      },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      msg.textContent = err.error || "Hata oluştu.";
      return;
    }

    // Response bir akış olduğu için doğrudan link yaratıyoruz
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "attachment; filename=download";
    const match = /filename="?([^"]+)"?/i.exec(cd);
    const filename = match ? match[1] : "download";

    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(dlUrl);

    msg.textContent = "İndirme başladı.";
  } catch (e) {
    console.error(e);
    msg.textContent = "İndirme sırasında hata oluştu.";
  }
}

fetchAllowlist();
document.getElementById("form").addEventListener("submit", handleSubmit);
async function handleSubmitX(e) {
  e.preventDefault();
  const url = document.getElementById("urlX").value.trim();
  const attest = document.getElementById("attestX").checked;
  const msg = document.getElementById("msgX");

  msg.textContent = "İşleniyor...";
  try {
    const res = await fetch("/download-x", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rights-attestation": attest ? "true" : "false",
      },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      msg.textContent = err.error || "Hata oluştu.";
      return;
    }

    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "attachment; filename=video.mp4";
    const match = /filename=\"?([^\"]+)\"?/i.exec(cd);
    const filename = match ? match[1] : "video.mp4";

    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(dlUrl);

    msg.textContent = "İndirme tamamlandı veya başladı.";
  } catch (e) {
    console.error(e);
    msg.textContent = "İndirme sırasında hata oluştu.";
  }
}

document.getElementById("form-x").addEventListener("submit", handleSubmitX);

