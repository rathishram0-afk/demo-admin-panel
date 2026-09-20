export const deviceImages = {
  ps5: "/images/gaming/ps5.webp",
  ps4: "/images/gaming/ps4.webp",
  ps2: "/images/gaming/ps2.webp",
  sim: "/images/gaming/racing-simulator.webp",
  vr: "/images/gaming/psvr2.webp"
};

export const getDeviceImage = (id) => {
  if (!id) return deviceImages.ps5;
  if (id.startsWith('PS5')) return deviceImages.ps5;
  if (id.startsWith('PS4')) return deviceImages.ps4;
  if (id.startsWith('PS2')) return deviceImages.ps2;
  if (id.startsWith('SIM')) return deviceImages.sim;
  if (id.startsWith('VR')) return deviceImages.vr;
  return deviceImages.ps5;
};
