const PALETTE = ['#1a5d2b', '#ffc72c', '#0f3d1c', '#2f7a3f', '#e0a800'];

export function coverColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function coverInitial(title) {
  return title?.trim().charAt(0).toUpperCase() || '?';
}
