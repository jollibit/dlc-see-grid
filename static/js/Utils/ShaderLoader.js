export async function loadShader(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Shader load failed: ${url}`);
  }
  return res.text();
}
