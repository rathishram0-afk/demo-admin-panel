function calculateExtension(hourlyPrice, extensionMinutes, playerCount, currentTotal = 0) {
  const perPlayerRatePerMinute = hourlyPrice / 60;
  const extensionAmount = Math.round(perPlayerRatePerMinute * extensionMinutes * playerCount);
  const finalTotal = currentTotal + extensionAmount;
  return { extensionAmount, finalTotal };
}

console.log('--- EXAMPLE 1: PS5, 1 Player, 1 Hour = ₹100 ---');
console.log('15 min:', calculateExtension(100, 15, 1)); // Expected: 25
console.log('30 min:', calculateExtension(100, 30, 1)); // Expected: 50
console.log('45 min:', calculateExtension(100, 45, 1)); // Expected: 75
console.log('60 min:', calculateExtension(100, 60, 1)); // Expected: 100

console.log('\n--- EXAMPLE 2: PS5, 2 Players, 1 Hour Price Per Player = ₹100, Current Total = ₹200 ---');
console.log('15 min:', calculateExtension(100, 15, 2, 200)); // Expected: ext 50, total 250
console.log('30 min:', calculateExtension(100, 30, 2, 200)); // Expected: ext 100, total 300
console.log('45 min:', calculateExtension(100, 45, 2, 200)); // Expected: ext 150, total 350
console.log('60 min:', calculateExtension(100, 60, 2, 200)); // Expected: ext 200, total 400

console.log('\n--- EXAMPLE 3: 1 Hour Price = ₹180, 1 Player ---');
console.log('15 min:', calculateExtension(180, 15, 1)); // Expected: 45
console.log('30 min:', calculateExtension(180, 30, 1)); // Expected: 90
console.log('45 min:', calculateExtension(180, 45, 1)); // Expected: 135
console.log('60 min:', calculateExtension(180, 60, 1)); // Expected: 180

console.log('\n--- EXAMPLE 4: 1 Hour Price = ₹280, 1 Player ---');
console.log('15 min:', calculateExtension(280, 15, 1)); // Expected: 70
console.log('30 min:', calculateExtension(280, 30, 1)); // Expected: 140
console.log('45 min:', calculateExtension(280, 45, 1)); // Expected: 210
console.log('60 min:', calculateExtension(280, 60, 1)); // Expected: 280

console.log('\n--- EXAMPLE 5: 4 Players, Hourly Price = ₹120, Current Total = ₹480 ---');
console.log('15 min:', calculateExtension(120, 15, 4, 480)); // Expected: ext 120, total 600
console.log('30 min:', calculateExtension(120, 30, 4, 480)); // Expected: ext 240, total 720
console.log('45 min:', calculateExtension(120, 45, 4, 480)); // Expected: ext 360, total 840
console.log('60 min:', calculateExtension(120, 60, 4, 480)); // Expected: ext 480, total 960
