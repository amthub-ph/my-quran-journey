export async function saveReaderPosition(key: string): Promise<{ success?: boolean; error?: string }> {
  const response = await fetch("/api/reading-position", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  const result = await response.json();
  if (!response.ok || result.success !== true) return { error: result.error || "Progress could not be saved. Please try again." };
  return { success: true };
}
