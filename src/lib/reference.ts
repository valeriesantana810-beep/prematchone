// Reference number generator — produces short, human-readable, unique-ish IDs.
// Format: PB-{TYPE}-{6 alphanumeric chars}. Example: PB-DEP-A7X9K2

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)

function randomCode(len: number): string {
  let out = '';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) {
    out += CHARSET[arr[i] % CHARSET.length];
  }
  return out;
}

export function generateReference(type: 'REQ' | 'PIK'): string {
  return `PB-${type}-${randomCode(6)}`;
}

export function generateRequestReference(): string {
  return generateReference('REQ');
}

export function generatePickReference(): string {
  return generateReference('PIK');
}
