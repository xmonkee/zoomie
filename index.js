const el = document.getElementById("app");
const W = el.offsetWidth;
const H = el.offsetHeight;

const R = 50;
const HALO = R / 40;
const TAIL = 100;

function getRandInt(d = 255) {
  return Math.floor(Math.random() * d);
}

function getRandRGB() {
  return [getRandInt(), getRandInt(), getRandInt()];
}

function getChangeByChance() {
  return Math.random() > 0.99;
}

function* getPos() {
  // Yields a simple spirograph
  let theta = 0;
  const r = Math.min(W, H);
  const k = 5;
  const m = 8;
  while (true) {
    const x = W / 2 + r * Math.cos(theta) + (r / k) * Math.sin(theta * m);
    const y = H / 2 + r * Math.sin(theta) + (r / k) * Math.cos(theta * m);
    yield [x, y];
    theta = (theta + 0.02) % (2 * Math.PI);
  }
}

function* getColor() {
  // The colors start at a random RGB value
  let [r, g, b] = getRandRGB();
  let [dr, dg, db] = [1, 1, 1];
  while (true) {
    yield [r, g, b];
    // Increment or decrement each component 
    r += dr;
    g += dg;
    b += db;

    // Change direction if hit 0 or 255
    if (r >= 255) dr = -1;
    if (r <= 0) dr = 1;
    if (g >= 255) dg = -1;
    if (g <= 0) dg = 1;
    if (b >= 255) db = -1;
    if (b <= 0) db = 1;

    // Change direction randomly once in a while
    if (getChangeByChance()) dr = -dr;
    if (getChangeByChance()) dg = -dg;
    if (getChangeByChance()) db = -db;
  }
}

function getCameraPosition(segList) {
  // Take the newest 50 segments and average their position
  const backList = segList.slice(TAIL - 50, TAIL);
  let vx = backList.map(([x, y, rgb]) => x).reduce((x1, x2) => x1 + x2, 0) /
    backList.length;
  let vy = backList.map(([x, y, rgb]) => y).reduce((y1, y2) => y1 + y2, 0) /
    backList.length;
  return { vx, vy };
}

const s = (p) => {

  const segList = [];
  const colorGen = getColor();
  const posGen = getPos();

  p.setup = () => {
    p.createCanvas(W, H);
    p.frameRate(30);
    p.blendMode(p.BLEND);
  };

  p.draw = () => {
    let [x, y] = posGen.next().value;
    let rgb = colorGen.next().value;
    // Keep adding the next position and color to the list of segments
    segList.push([x, y, rgb]);
    if (segList.length > TAIL) {
      // Cut it off at TAIL
      segList.shift();
    }
    render();
  };

  function render() {
    // Wait for enough segments to be added
    if (segList.length < TAIL) return;

    // The "camera" is currently at the center of the screen
    // The change it to new location shift everything else in the opposite
    // direction by (newCamera - oldCamera)
    let { vx, vy } = getCameraPosition(segList);
    p.translate(W/2-vx, H/2-vy);

    p.background(255);
    for (let i = TAIL - 1; i >= 0; i--) {
      // The render is effectively only taking the list of positions and colors
      // in segList and drawing circles
      // The 3D effect comes from scaling up the back of the seglist
      const [x, y, rgb] = segList[i];
      const [r, g, b] = rgb;
      p.push();
      const fill = p.color(r, g, b);
      const stroke = p.color(r * 2, g * 2, b * 2);
      p.fill(fill);
      p.strokeWeight(HALO);
      p.stroke(stroke);
      p.translate(x, y);
      p.scale(TAIL / (i + 20));
      p.ellipse(0, 0, R * 2 - HALO, R * 2 - HALO);
      p.pop();
    }
  }
};

new p5(s, el);

