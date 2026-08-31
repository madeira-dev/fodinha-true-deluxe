import os from 'node:os';

export function lanAddresses(): string[] {
  const addresses: string[] = [];
  const interfaces = os.networkInterfaces();
  const names = Object.keys(interfaces);

  for (let i = 0; i < names.length; i += 1) {
    const list = interfaces[names[i]];
    if (!list) {
      continue;
    }
    for (let j = 0; j < list.length; j += 1) {
      const item = list[j];
      const family = String(item.family);
      if ((family === 'IPv4' || family === '4') && !item.internal) {
        addresses.push(item.address);
      }
    }
  }

  return addresses;
}
