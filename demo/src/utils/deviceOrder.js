export const CENTRALIZED_DEVICE_ORDER = [
  'PS5-1',
  'PS5-2',
  'PS5-3',
  'PS5-4',
  'PS5-1-EXTRA',
  'PS5-2-EXTRA',
  'PS5-3-EXTRA',
  'PS5-4-EXTRA',
  'PS4-1',
  'PS4-2',
  'PS4-3',
  'PS4-4',
  'PS2-1',
  'SIM-1',
  'VR-1'
];

export function getDeviceSortRank(deviceOrCode) {
  if (!deviceOrCode) return 999;

  let codeStr = '';
  let nameStr = '';

  if (typeof deviceOrCode === 'string') {
    codeStr = deviceOrCode;
    nameStr = deviceOrCode;
  } else {
    codeStr = deviceOrCode.device_code || deviceOrCode.code || deviceOrCode.id || '';
    nameStr = deviceOrCode.device_name || deviceOrCode.name || '';
  }

  const cNorm = String(codeStr).toUpperCase().replace(/\s+/g, '').trim();
  const nNorm = String(nameStr).toUpperCase().replace(/\s+/g, ' ').trim();

  // 1. PS5 - 1
  if (cNorm === 'PS5-1' || nNorm === 'PS5 - 1' || (cNorm === 'PS51' && !nNorm.includes('EXTRA'))) return 1;
  // 2. PS5 - 2
  if (cNorm === 'PS5-2' || nNorm === 'PS5 - 2' || (cNorm === 'PS52' && !nNorm.includes('EXTRA'))) return 2;
  // 3. PS5 - 3
  if (cNorm === 'PS5-3' || nNorm === 'PS5 - 3' || (cNorm === 'PS53' && !nNorm.includes('EXTRA'))) return 3;
  // 4. PS5 - 4
  if (cNorm === 'PS5-4' || nNorm === 'PS5 - 4' || (cNorm === 'PS54' && !nNorm.includes('EXTRA'))) return 4;

  // 5. PS5 - 1 EXTRA PERSON
  if (cNorm === 'PS5-1-EXTRA' || nNorm.includes('PS5 - 1 EXTRA') || nNorm.includes('PS5-1 EXTRA') || (cNorm.includes('PS5') && cNorm.includes('1') && cNorm.includes('EXTRA'))) return 5;
  // 6. PS5 - 2 EXTRA PERSON
  if (cNorm === 'PS5-2-EXTRA' || nNorm.includes('PS5 - 2 EXTRA') || nNorm.includes('PS5-2 EXTRA') || (cNorm.includes('PS5') && cNorm.includes('2') && cNorm.includes('EXTRA'))) return 6;
  // 7. PS5 - 3 EXTRA PERSON
  if (cNorm === 'PS5-3-EXTRA' || nNorm.includes('PS5 - 3 EXTRA') || nNorm.includes('PS5-3 EXTRA') || (cNorm.includes('PS5') && cNorm.includes('3') && cNorm.includes('EXTRA'))) return 7;
  // 8. PS5 - 4 EXTRA PERSON
  if (cNorm === 'PS5-4-EXTRA' || nNorm.includes('PS5 - 4 EXTRA') || nNorm.includes('PS5-4 EXTRA') || (cNorm.includes('PS5') && cNorm.includes('4') && cNorm.includes('EXTRA'))) return 8;

  // 9. PS4 - 1
  if (cNorm === 'PS4-1' || nNorm === 'PS4 - 1' || cNorm === 'PS41') return 9;
  // 10. PS4 - 2
  if (cNorm === 'PS4-2' || nNorm === 'PS4 - 2' || cNorm === 'PS42') return 10;
  // 11. PS4 - 3
  if (cNorm === 'PS4-3' || nNorm === 'PS4 - 3' || cNorm === 'PS43') return 11;
  // 12. PS4 - 4
  if (cNorm === 'PS4-4' || nNorm === 'PS4 - 4' || cNorm === 'PS44') return 12;

  // 13. PS2 - 1
  if (cNorm === 'PS2-1' || nNorm === 'PS2 - 1' || cNorm === 'PS21') return 13;

  // 14. SIM - 1
  if (cNorm === 'SIM-1' || nNorm === 'SIM - 1' || cNorm.includes('SIM')) return 14;

  // 15. VR - 1
  if (cNorm === 'VR-1' || nNorm === 'VR - 1' || cNorm.includes('VR')) return 15;

  if (typeof deviceOrCode === 'object' && typeof deviceOrCode.display_order === 'number') {
    return deviceOrCode.display_order;
  }

  return 999;
}

export function sortDevicesByCentralizedOrder(devicesList) {
  if (!Array.isArray(devicesList)) return [];
  return [...devicesList].sort((a, b) => getDeviceSortRank(a) - getDeviceSortRank(b));
}
