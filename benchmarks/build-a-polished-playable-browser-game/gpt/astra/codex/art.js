export const palette = { ink: '#2d5143', cream: '#fff9e9', orange: '#ed7f58', gold: '#efbd5e', teal: '#689c81' };

function shape(context, points, fill, stroke, lineWidth = 2) {
  context.beginPath();
  for (let index = 0; index < points.length; index += 2) {
    if (index === 0) context.moveTo(points[index], points[index + 1]);
    else context.lineTo(points[index], points[index + 1]);
  }
  context.closePath();
  if (fill) { context.fillStyle = fill; context.fill(); }
  if (stroke) { context.strokeStyle = stroke; context.lineWidth = lineWidth; context.stroke(); }
}

function ellipse(context, horizontal, vertical, radiusX, radiusY, color, rotation = 0) {
  context.beginPath();
  context.ellipse(horizontal, vertical, radiusX, radiusY, rotation, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function line(context, points, color, thickness = 2) {
  context.beginPath();
  context.moveTo(points[0], points[1]);
  for (let index = 2; index < points.length; index += 2) context.lineTo(points[index], points[index + 1]);
  context.strokeStyle = color;
  context.lineWidth = thickness;
  context.stroke();
}

function cloud(context, horizontal, vertical, scale, opacity = 0.65) {
  context.save();
  context.translate(horizontal, vertical);
  context.scale(scale, scale);
  context.globalAlpha = opacity;
  context.fillStyle = '#fff9e6';
  context.beginPath();
  context.moveTo(-58, 9);
  context.bezierCurveTo(-71, 4, -60, -12, -45, -10);
  context.bezierCurveTo(-45, -32, -15, -36, -4, -18);
  context.bezierCurveTo(9, -27, 32, -17, 30, -4);
  context.bezierCurveTo(58, -11, 70, 8, 49, 10);
  context.closePath();
  context.fill();
  context.restore();
}

function seabird(context, horizontal, vertical, size, flap) {
  context.beginPath();
  context.moveTo(horizontal - size, vertical - flap);
  context.quadraticCurveTo(horizontal - size * 0.45, vertical - size * 0.5, horizontal, vertical);
  context.quadraticCurveTo(horizontal + size * 0.4, vertical - size * 0.6, horizontal + size, vertical - flap);
  context.strokeStyle = '#819a7a';
  context.lineWidth = 1.5;
  context.stroke();
}

function lighthouse(context, horizontal, baseline, scale) {
  context.save();
  context.translate(horizontal, baseline);
  context.scale(scale, scale);
  ellipse(context, 5, 5, 77, 10, '#87b29a');
  shape(context, [-77, 8, -57, -8, -25, -15, 7, -12, 37, -6, 62, 7], '#91b49b');
  shape(context, [-20, 0, -13, -91, 13, -91, 21, 0], '#fff5d8');
  shape(context, [-17, -34, -15, -51, 15, -51, 17, -34], '#db977b');
  shape(context, [-15, -68, -13, -82, 13, -82, 15, -68], '#db977b');
  shape(context, [6, 0, 9, -91, 13, -91, 21, 0], '#dccbb0');
  context.fillStyle = '#577f70';
  context.fillRect(-15, -108, 30, 18);
  context.fillStyle = '#e7ddb6';
  context.fillRect(-10, -104, 7, 10);
  context.fillRect(3, -104, 7, 10);
  shape(context, [-21, -108, 0, -125, 22, -108], '#537c68');
  line(context, [0, -125, 0, -132], '#6e8c72', 2);
  line(context, [-21, -88, 22, -88], '#79927b', 3);
  context.fillStyle = '#69896d';
  context.beginPath();
  context.roundRect(-4, -17, 8, 18, [4, 4, 0, 0]);
  context.fill();
  ellipse(context, -34, -3, 10, 12, '#749c7c');
  ellipse(context, 34, -1, 13, 8, '#739b77');
  context.restore();
}

function sailboat(context, horizontal, vertical, scale, time) {
  context.save();
  context.translate(horizontal, vertical + Math.sin(time * 1.1) * 2);
  context.scale(scale, scale);
  context.rotate(Math.sin(time * 0.8) * 0.035);
  line(context, [0, -54, 0, 8], '#81967b', 1.5);
  shape(context, [-3, -51, -3, -1, -32, -1], '#fbf5df');
  shape(context, [2, -42, 3, -1, 25, -1], '#ead7ac');
  shape(context, [-33, 3, 29, 3, 17, 14, -20, 14], '#6f9a82');
  line(context, [-43, 20, 33, 20], '#d2e2c9', 2);
  context.restore();
}

function grass(context, horizontal, vertical, scale, color) {
  context.save();
  context.translate(horizontal, vertical);
  context.scale(scale, scale);
  context.strokeStyle = color;
  context.lineWidth = 2;
  for (let index = 0; index < 5; index += 1) {
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo((index - 2) * 5, -9, (index - 2) * 9, -13 - (index % 3) * 7);
    context.stroke();
  }
  context.restore();
}

export function drawScene(context, width, height, time, scroll, menu, ground) {
  const mobile = width < 620;
  const horizon = menu && mobile ? height * 0.666 : height * 0.495;
  const sky = context.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, '#f8edcf');
  sky.addColorStop(1, '#e8e8c7');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  const sunHorizontal = menu && mobile ? width * 0.79 : width * 0.855;
  const sunVertical = menu && mobile ? height * 0.515 : height * 0.195;
  const sunRadius = mobile ? 38 : 68;
  ellipse(context, sunHorizontal, sunVertical, sunRadius + 13, sunRadius + 13, '#f0d18a26');
  ellipse(context, sunHorizontal, sunVertical, sunRadius, sunRadius, '#edbb74');
  ellipse(context, sunHorizontal - 7, sunVertical - 5, sunRadius - 6, sunRadius - 6, '#efc27d');

  for (let index = 0; index < 4; index += 1) {
    const horizontal = ((index * width * 0.37 + width * 0.15 - scroll * 0.025 + time * 2) % (width + 180) + width + 180) % (width + 180) - 90;
    const vertical = menu && mobile ? 310 + (index % 2) * 57 : 95 + (index % 3) * 52;
    cloud(context, horizontal, vertical, mobile ? 0.48 : 0.7 + (index % 2) * 0.18, 0.56);
  }

  context.fillStyle = '#bed0ae';
  context.beginPath();
  context.moveTo(width * 0.23, horizon + 30);
  context.bezierCurveTo(width * 0.4, horizon + 7, width * 0.36, horizon - 18, width * 0.47, horizon - 3);
  context.bezierCurveTo(width * 0.57, horizon - 38, width * 0.63, horizon - 48, width * 0.72, horizon - 13);
  context.bezierCurveTo(width * 0.84, horizon - 32, width * 0.9, horizon - 21, width, horizon - 45);
  context.lineTo(width, horizon + 60);
  context.closePath();
  context.fill();

  context.fillStyle = '#a8c5aa';
  context.beginPath();
  context.moveTo(width * 0.54, horizon + 25);
  context.bezierCurveTo(width * 0.67, horizon - 7, width * 0.76, horizon + 13, width * 0.83, horizon - 12);
  context.bezierCurveTo(width * 0.9, horizon - 27, width * 0.98, horizon - 4, width + 20, horizon - 15);
  context.lineTo(width, horizon + 60);
  context.closePath();
  context.fill();

  const water = context.createLinearGradient(0, horizon + 15, 0, ground);
  water.addColorStop(0, '#b4d0b9');
  water.addColorStop(0.35, '#a3caba');
  water.addColorStop(1, '#b5d5bc');
  context.fillStyle = water;
  context.fillRect(0, horizon + 20, width, ground - horizon);
  line(context, [0, horizon + 22, width, horizon + 22], '#d3dec0', 2);

  const islandHorizontal = ((width * 0.91 - scroll * 0.065) % (width + 380) + width + 380) % (width + 380);
  lighthouse(context, islandHorizontal, horizon + 48, mobile ? 0.56 : 0.88);
  const boatHorizontal = ((width * 0.48 - scroll * 0.085) % (width + 100) + width + 100) % (width + 100) - 40;
  sailboat(context, boatHorizontal, horizon + 77, mobile ? 0.48 : 0.67, time);

  context.lineCap = 'round';
  for (let index = 0; index < 30; index += 1) {
    const horizontal = ((index * 137.7 - scroll * (0.13 + index % 3 * 0.015) + Math.sin(time * 0.6 + index) * 9) % (width + 100) + width + 100) % (width + 100) - 50;
    const vertical = horizon + 47 + ((index * 43.5) % Math.max(35, ground - horizon - 66));
    const length = 12 + index % 4 * 15;
    line(context, [horizontal, vertical, horizontal + length, vertical], index % 3 === 0 ? '#e4e9cda6' : '#85b5a13f', index % 3 === 0 ? 2 : 1.5);
  }

  if (!mobile || !menu) {
    seabird(context, width * 0.64 - (scroll * 0.012) % 90, horizon - 99 + Math.sin(time * 0.7) * 3, 8, Math.sin(time * 2) * 3 + 2);
    seabird(context, width * 0.6 - (scroll * 0.012) % 90, horizon - 84 + Math.sin(time * 0.8 + 1) * 3, 5, Math.sin(time * 2 + 1) * 2);
    seabird(context, width * 0.68 - (scroll * 0.012) % 90, horizon - 78, 6, Math.sin(time * 2 + 2) * 2);
  }

  const distantRail = ground - 19;
  context.fillStyle = '#dce0bb';
  context.fillRect(0, distantRail - 5, width, 16);
  line(context, [0, distantRail - 6, width, distantRail - 6], '#f3eed0', 4);
  for (let index = -1; index < width / 122 + 2; index += 1) {
    const horizontal = index * 122 - scroll * 0.65 % 122;
    context.fillStyle = '#cbd0ab';
    context.fillRect(horizontal, distantRail - 5, 3, 19);
  }

  context.fillStyle = '#ddd5ae';
  context.fillRect(0, ground - 4, width, height - ground + 4);
  context.fillStyle = '#eee4bf';
  context.fillRect(0, ground + 2, width, height - ground);
  line(context, [0, ground, width, ground], '#fbf2d5', 5);
  line(context, [0, ground + 7, width, ground + 7], '#cfcca5', 1);
  for (let index = -1; index < width / 90 + 3; index += 1) {
    const horizontal = index * 90 - scroll % 90;
    line(context, [horizontal, ground + 8, horizontal - 30, height], '#d3c9a45e', 1);
    line(context, [horizontal + 33, ground + 21, horizontal + 53, ground + 21], '#c2b88e5e', 1.2);
    ellipse(context, horizontal + 40, ground + 11, 1.1, 0.8, '#bdba95');
  }
  line(context, [0, height - 17, width, height - 17], '#dbd3af', 1);

  for (let index = -1; index < width / 590 + 2; index += 1) {
    const horizontal = index * 590 + 130 - scroll * 0.9 % 590;
    grass(context, horizontal, ground - 6, 0.6, '#8ca17a');
    grass(context, horizontal + 19, ground - 5, 0.35, '#a5b18a');
  }

  if (menu && !mobile) {
    const fade = context.createLinearGradient(0, 0, width * 0.64, 0);
    fade.addColorStop(0, '#f5ecd1');
    fade.addColorStop(0.53, '#f5ecd1f5');
    fade.addColorStop(0.82, '#f5ecd16a');
    fade.addColorStop(1, '#f5ecd100');
    context.fillStyle = fade;
    context.fillRect(0, 0, width * 0.64, ground - 18);
  }
}

function wheel(context, horizontal, vertical, rotation) {
  ellipse(context, horizontal, vertical, 33, 33, '#324e41');
  ellipse(context, horizontal, vertical, 27.5, 27.5, '#f8edce');
  ellipse(context, horizontal, vertical, 24, 24, '#c5ccb05c');
  context.strokeStyle = '#7b8a70';
  context.lineWidth = 1;
  for (let spoke = 0; spoke < 10; spoke += 1) {
    const angle = spoke * Math.PI / 5 + rotation;
    context.beginPath();
    context.moveTo(horizontal + Math.cos(angle) * 5, vertical + Math.sin(angle) * 5);
    context.lineTo(horizontal + Math.cos(angle) * 25, vertical + Math.sin(angle) * 25);
    context.stroke();
  }
  context.beginPath();
  context.arc(horizontal, vertical, 29.5, 0.2 + rotation, 1.5 + rotation);
  context.lineWidth = 1.6;
  context.strokeStyle = '#758377';
  context.stroke();
  ellipse(context, horizontal, vertical, 5, 5, '#f2e5bc');
  ellipse(context, horizontal, vertical, 2.5, 2.5, '#3b5747');
}

export function drawPelican(context, options) {
  const { horizontal, vertical, scale, pedal, time, airborne = false, boosting = false, invincible = false, lean = 0, flap = 0, menu = false } = options;
  context.save();
  context.translate(horizontal, vertical);
  context.scale(scale, scale);
  context.rotate(lean);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (invincible && Math.floor(time * 13) % 2 === 0) context.globalAlpha = 0.45;
  wheel(context, -60, -33, pedal * 1.55);
  wheel(context, 67, -33, pedal * 1.55);

  context.beginPath();
  context.arc(-60, -33, 37, Math.PI * 1.06, Math.PI * 1.87);
  context.strokeStyle = '#e9b862';
  context.lineWidth = 4;
  context.stroke();
  context.beginPath();
  context.arc(67, -33, 37, Math.PI * 1.12, Math.PI * 1.85);
  context.stroke();
  line(context, [-60, -33, -30, -77, -10, -33, -60, -33], '#b66342', 8);
  line(context, [-30, -77, 39, -76, -10, -33, -30, -77], '#b66342', 8);
  line(context, [-60, -33, -30, -77, -10, -33, -60, -33], '#ec8054', 5.5);
  line(context, [-30, -77, 39, -76, -10, -33], '#ec8054', 5.5);
  line(context, [36, -88, 67, -33], '#b66342', 7);
  line(context, [36, -88, 67, -33], '#ed8b5a', 4.5);
  line(context, [-30, -77, -35, -88], '#69806b', 4);
  line(context, [-48, -89, -22, -89], '#2c5042', 8);
  line(context, [-46, -92, -24, -92], '#73947a', 2);
  line(context, [38, -86, 31, -104, 52, -106], '#3a5c4a', 4);
  line(context, [47, -106, 57, -106], '#d4bd88', 6);

  context.beginPath();
  context.ellipse(-30, -33, 29, 9, 0, 0, Math.PI * 2);
  context.strokeStyle = '#9c9f7c';
  context.lineWidth = 1.5;
  context.stroke();
  ellipse(context, -10, -33, 9, 9, '#587761');
  ellipse(context, -10, -33, 5.5, 5.5, '#e4cf94');
  const footHorizontal = -10 + Math.cos(pedal) * 15;
  const footVertical = -33 + Math.sin(pedal) * 15;
  const backFootHorizontal = -10 - Math.cos(pedal) * 15;
  const backFootVertical = -33 - Math.sin(pedal) * 15;
  line(context, [backFootHorizontal, backFootVertical, footHorizontal, footVertical], '#557461', 2.5);
  line(context, [backFootHorizontal - 6, backFootVertical, backFootHorizontal + 6, backFootVertical], '#2e5040', 3);
  line(context, [-23, -99, -38, -66, backFootHorizontal, backFootVertical - 3], '#c78445', 5);
  shape(context, [backFootHorizontal - 7, backFootVertical - 6, backFootHorizontal + 12, backFootVertical - 3, backFootHorizontal + 8, backFootVertical + 1, backFootHorizontal - 7, backFootVertical + 1], '#d9a053');

  const bob = airborne ? 0 : Math.sin(pedal * 2) * 1.6;
  context.save();
  context.translate(0, bob);
  shape(context, [-42, -132, -81, -145, -70, -123, -45, -112], '#3b574b', '#2d5143', 1);
  shape(context, [-47, -131, -78, -140, -64, -122, -43, -116], '#fff6df');
  context.beginPath();
  context.moveTo(-41, -143);
  context.bezierCurveTo(-66, -131, -61, -102, -40, -96);
  context.bezierCurveTo(-15, -80, 12, -93, 19, -116);
  context.bezierCurveTo(26, -131, 17, -149, 24, -162);
  context.bezierCurveTo(27, -169, 43, -164, 47, -177);
  context.bezierCurveTo(56, -197, 36, -206, 20, -196);
  context.bezierCurveTo(1, -185, 13, -165, 1, -151);
  context.bezierCurveTo(-7, -144, -23, -154, -41, -143);
  context.closePath();
  context.fillStyle = '#fffbea';
  context.fill();
  context.strokeStyle = '#3d5b46';
  context.lineWidth = 1.6;
  context.stroke();
  context.beginPath();
  context.moveTo(-43, -102);
  context.bezierCurveTo(-12, -98, 7, -116, 12, -141);
  context.bezierCurveTo(25, -115, 10, -80, -25, -94);
  context.closePath();
  context.fillStyle = '#e5e8cc';
  context.fill();

  context.beginPath();
  context.moveTo(40, -180);
  context.lineTo(121, -170);
  context.bezierCurveTo(109, -151, 81, -139, 58, -146);
  context.quadraticCurveTo(43, -149, 40, -180);
  context.fillStyle = '#f0c576';
  context.fill();
  context.strokeStyle = '#c99250';
  context.lineWidth = 1.2;
  context.stroke();
  context.beginPath();
  context.moveTo(43, -184);
  context.bezierCurveTo(69, -183, 107, -177, 124, -170);
  context.quadraticCurveTo(127, -166, 118, -165);
  context.lineTo(43, -168);
  context.closePath();
  context.fillStyle = '#eea252';
  context.fill();
  context.strokeStyle = '#c48445';
  context.stroke();
  line(context, [48, -174, 114, -169], '#f8c978', 1.5);
  ellipse(context, 58, -178, 2.3, 0.9, '#c28643', 0.15);
  if (Math.sin(time * 0.65) > 0.996) line(context, [29, -185, 36, -185], '#2d5143', 2.4);
  else {
    ellipse(context, 32, -185, 3.2, 3.7, '#2c4b3b');
    ellipse(context, 33, -186, 0.9, 1.1, '#fffbed');
  }
  line(context, [27, -192, 34, -193], '#527056', 1.5);
  ellipse(context, 24, -177, 4.1, 2.4, '#efb99461');

  context.beginPath();
  context.moveTo(10, -197);
  context.bezierCurveTo(9, -215, 43, -220, 49, -198);
  context.closePath();
  context.fillStyle = '#416f56';
  context.fill();
  context.strokeStyle = '#34583f';
  context.lineWidth = 1.5;
  context.stroke();
  context.beginPath();
  context.moveTo(22, -211);
  context.quadraticCurveTo(35, -212, 37, -199);
  context.strokeStyle = '#6e9770';
  context.lineWidth = 1;
  context.stroke();
  line(context, [9, -198, 48, -197], '#315840', 5);
  context.beginPath();
  context.moveTo(12, -200);
  context.quadraticCurveTo(-16, -199, -11, -194);
  context.quadraticCurveTo(-1, -190, 21, -197);
  context.fillStyle = '#315840';
  context.fill();
  ellipse(context, 29, -214, 2.3, 1.8, '#426c50');

  const flutter = Math.sin(time * (boosting ? 20 : 11)) * (boosting ? 6 : 3);
  shape(context, [8, -154, -23, -165 + flutter, -45, -158 + flutter, -38, -153 + flutter, -47, -150 + flutter, -17, -149, 8, -149], '#db7650');
  shape(context, [5, -153, -15, -147, -35, -140 + flutter, -33, -149 + flutter, -8, -157], '#c66848');
  line(context, [7, -155, 20, -151], '#dc7a51', 7);

  context.save();
  context.translate(-24, -135);
  if (airborne) context.rotate(-0.55 - Math.sin(flap * 18) * 0.35);
  context.beginPath();
  context.moveTo(-12, -1);
  context.bezierCurveTo(-29, 7, -24, 23, -1, 31);
  context.lineTo(47, 37);
  context.quadraticCurveTo(56, 36, 48, 30);
  context.bezierCurveTo(22, 25, 13, 4, -12, -1);
  context.closePath();
  context.fillStyle = '#f4f4de';
  context.fill();
  context.strokeStyle = '#788c70';
  context.lineWidth = 1.3;
  context.stroke();
  context.beginPath();
  context.moveTo(21, 24);
  context.lineTo(48, 30);
  context.quadraticCurveTo(58, 37, 47, 37);
  context.lineTo(24, 34);
  context.closePath();
  context.fillStyle = '#3c5b4a';
  context.fill();
  line(context, [-10, 14, 13, 25, 32, 29], '#c4cfb0', 1.1);
  line(context, [-12, 19, 10, 29], '#c4cfb0', 1);
  context.restore();
  context.restore();

  line(context, [-12, -99 + bob, 2, -70, footHorizontal, footVertical - 3], '#e7a34e', 5.5);
  shape(context, [footHorizontal - 8, footVertical - 7, footHorizontal + 13, footVertical - 3, footHorizontal + 9, footVertical + 1, footHorizontal - 8, footVertical + 1], '#efa94d', '#c18a48', 0.8);
  line(context, [footHorizontal - 5, footVertical + 3, footHorizontal + 8, footVertical + 3], '#365844', 3);

  if (menu) {
    line(context, [63, -88, 63, -62, 89, -62, 92, -88], '#9c895b', 2);
    shape(context, [59, -87, 95, -87, 89, -63, 65, -63], '#ccac70', '#ad925e', 1.5);
    line(context, [62, -81, 92, -81], '#ecd39b', 1.7);
    line(context, [64, -74, 91, -74], '#ecd39b', 1.7);
    line(context, [69, -86, 72, -65], '#ecd39b', 1.3);
    line(context, [78, -86, 79, -65], '#ecd39b', 1.3);
    line(context, [87, -86, 86, -65], '#ecd39b', 1.3);
    shape(context, [69, -86, 64, -103, 73, -99, 77, -107, 81, -86], '#91ac8d', '#61866d', 1);
    shape(context, [81, -86, 82, -100, 88, -96, 94, -100, 89, -85], '#7c9f7e', '#61866d', 1);
  }
  context.restore();
}

export function drawShadow(context, horizontal, ground, scale, height, opacity = 1) {
  context.save();
  context.globalAlpha = opacity * Math.max(0.06, 0.19 - height * 0.00065);
  ellipse(context, horizontal + 3 * scale, ground + 3, (96 - Math.min(height * 0.15, 34)) * scale, 8 * scale, '#527349');
  context.restore();
}

export function drawFish(context, horizontal, vertical, time, size = 1, highlight = true) {
  context.save();
  context.translate(horizontal, vertical + Math.sin(time * 3) * 3);
  context.scale(size, size);
  if (highlight) {
    ellipse(context, 2, 0, 23, 23, '#fff4b74d');
    context.beginPath();
    context.arc(2, 0, 21, -0.8, 0.15);
    context.strokeStyle = '#f6df9bb0';
    context.lineWidth = 1.5;
    context.stroke();
  }
  shape(context, [9, 0, 21, -8, 20, 8], '#e5a94b', '#cb943e', 0.7);
  ellipse(context, -1, 0, 13, 8, '#efba56');
  context.beginPath();
  context.ellipse(-1, 0, 13, 8, 0, 0, Math.PI * 2);
  context.strokeStyle = '#d99b44';
  context.lineWidth = 1;
  context.stroke();
  shape(context, [0, -7, 5, -12, 7, -5], '#e1a94f');
  line(context, [-6, -4, 1, -5, 7, -3], '#ffe2a2', 2);
  ellipse(context, -7, -1, 1.7, 1.7, '#5c6842');
  line(context, [-1, -1, 2, 2, 0, 4], '#c59340', 1);
  context.restore();
}

export function drawSparkle(context, horizontal, vertical, size, color = '#dca953') {
  shape(context, [horizontal, vertical - size, horizontal + size * 0.27, vertical - size * 0.27, horizontal + size, vertical, horizontal + size * 0.27, vertical + size * 0.27, horizontal, vertical + size, horizontal - size * 0.27, vertical + size * 0.27, horizontal - size, vertical, horizontal - size * 0.27, vertical - size * 0.27], color);
}

export function drawObstacle(context, obstacle, ground, time) {
  context.save();
  context.translate(obstacle.horizontal, ground);
  context.scale(obstacle.scale, obstacle.scale);
  context.lineJoin = 'round';
  context.lineCap = 'round';
  ellipse(context, 0, 3, obstacle.width * 0.6, 5, '#899b7652');
  if (obstacle.type === 'cone') {
    context.fillStyle = '#a56e4e';
    context.beginPath();
    context.roundRect(-26, -6, 52, 7, 3);
    context.fill();
    shape(context, [-20, -6, -6, -54, 6, -54, 20, -6], '#e18454', '#b76f46', 1);
    shape(context, [-12, -34, -8, -47, 8, -47, 12, -34], '#fff1d0');
    shape(context, [-18, -15, -14, -27, 14, -27, 18, -15], '#fff1d0');
    shape(context, [4, -54, 6, -54, 20, -6, 12, -6], '#c7754c55');
  } else if (obstacle.type === 'castle') {
    context.fillStyle = '#d1b77b';
    context.fillRect(-29, -42, 58, 40);
    context.fillStyle = '#e5ca8a';
    context.fillRect(-29, -42, 51, 40);
    for (let index = 0; index < 3; index += 1) {
      context.fillStyle = '#d7bc7e';
      context.fillRect(-31 + index * 23, -52, 16, 14);
      context.fillStyle = '#eddaa4';
      context.fillRect(-31 + index * 23, -53, 16, 4);
    }
    context.fillStyle = '#ae9869';
    context.beginPath();
    context.roundRect(-7, -21, 14, 20, [7, 7, 0, 0]);
    context.fill();
    line(context, [-22, -31, -14, -31], '#bda26a', 2);
    line(context, [13, -21, 21, -21], '#bda26a', 2);
    line(context, [0, -54, 0, -78], '#899875', 2);
    shape(context, [0, -78, 23, -73 + Math.sin(time * 5) * 2, 0, -65], '#dd8a66');
    ellipse(context, -24, 0, 14, 4, '#ddc389');
    ellipse(context, 26, 0, 12, 4, '#ddc389');
  } else if (obstacle.type === 'crate') {
    context.fillStyle = '#688f74';
    context.beginPath();
    context.roundRect(-25, -54, 50, 54, 4);
    context.fill();
    context.fillStyle = '#8ca68a';
    context.fillRect(-23, -52, 44, 5);
    line(context, [-22, -36, 22, -36], '#4d775f', 2);
    line(context, [-22, -18, 22, -18], '#4d775f', 2);
    line(context, [-20, -50, -20, -3], '#aec09b', 2.5);
    line(context, [20, -50, 20, -3], '#527d62', 3);
    context.save();
    context.translate(0, -25);
    context.rotate(-0.15);
    shape(context, [-10, 0, -3, -5, 5, -4, 10, 0, 15, -5, 15, 5, 10, 0, 5, 4, -3, 5], '#e8deac');
    context.restore();
  } else {
    const legBob = Math.sin(time * 14) * 3;
    for (let side = -1; side <= 1; side += 2) {
      line(context, [side * 12, -10, side * 25, -16, side * 32, -5 + legBob], '#bd7050', 3);
      line(context, [side * 12, -8, side * 23, -7, side * 27, 1 - legBob], '#c88055', 3);
      line(context, [side * 12, -17, side * 29, -31, side * 32, -39], '#d37c52', 4);
      ellipse(context, side * 32, -38, 8, 10, '#dd8c59', side * 0.4);
      line(context, [side * 32, -46, side * 30, -37], '#faf0ce', 2);
    }
    ellipse(context, 0, -13, 20, 13, '#e2935e');
    line(context, [-6, -21, -8, -28], '#cb7f52', 3);
    line(context, [6, -21, 8, -28], '#cb7f52', 3);
    ellipse(context, -8, -29, 2.5, 3, '#385840');
    ellipse(context, 8, -29, 2.5, 3, '#385840');
    context.beginPath();
    context.arc(0, -14, 5, 0.2, Math.PI - 0.2);
    context.strokeStyle = '#b76c4a';
    context.lineWidth = 1.2;
    context.stroke();
  }
  context.restore();
}

export function drawParticles(context, particles) {
  for (const particle of particles) {
    context.save();
    context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    context.translate(particle.horizontal, particle.vertical);
    context.rotate(particle.rotation);
    if (particle.kind === 'spark') drawSparkle(context, 0, 0, particle.size, particle.color);
    else if (particle.kind === 'dust') ellipse(context, 0, 0, particle.size, particle.size * 0.6, particle.color);
    else { context.fillStyle = particle.color; context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65); }
    context.restore();
  }
}
