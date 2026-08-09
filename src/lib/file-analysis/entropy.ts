export function shannonEntropy(bytes: Uint8Array, maxSamples = 1_048_576): number {
  if (!bytes.length) return 0;
  const counts = new Uint32Array(256);
  const stride = Math.max(1, Math.floor(bytes.length / maxSamples));
  let total = 0;
  for (let i = 0; i < bytes.length; i += stride) { counts[bytes[i]] += 1; total += 1; }
  let entropy = 0;
  for (const count of counts) if (count) { const p = count / total; entropy -= p * Math.log2(p); }
  return entropy;
}

