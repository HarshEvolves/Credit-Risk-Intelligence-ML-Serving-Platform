const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

export async function predict(payload, { narrate = false } = {}) {
  const url = `${API_BASE_URL}/predict${narrate ? "?narrate=true" : ""}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? response.statusText);
    throw new Error(detail);
  }

  return response.json();
}
