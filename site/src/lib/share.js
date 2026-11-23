const PAYLOAD_VERSION = 1;

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(encoded) {
  const binary = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeScenePayload(sceneId, state) {
  const json = JSON.stringify({
    v: PAYLOAD_VERSION,
    scene: sceneId,
    nodes: state.nodes,
    edges: state.edges,
    options: state.options,
  });
  return toBase64Url(json);
}

export function decodeScenePayload(encoded) {
  if (!encoded || encoded.length > 32_000) return null;
  try {
    const data = JSON.parse(fromBase64Url(encoded));
    if (data.v !== PAYLOAD_VERSION) return null;
    if (typeof data.scene !== 'string' || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;
    if (!data.options || typeof data.options !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

export function parseSceneHash(hash) {
  const raw = hash.replace(/^#/, '');
  const [id = '', encoded = ''] = raw.split('/');
  return { id, encoded };
}

export function buildShareUrl(sceneId, state) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#${sceneId}/${encodeScenePayload(sceneId, state)}`;
}
