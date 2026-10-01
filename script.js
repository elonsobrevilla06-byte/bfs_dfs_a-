const COLS = 32, ROWS = 18;
const N = COLS * ROWS;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);

let wall = new Uint8Array(N);       // 1 = wall
let state = new Uint8Array(N);      // 0 none, 1 frontier, 2 visited
let path = [];
let start = 5 * COLS + 5, end = 12 * COLS + 26;
let algo = 'bfs', running = false, timer = null, cell = 20;

const DESC = {
  bfs: 'Breadth-First Search explores layer by layer using a queue. It always finds the shortest path on an unweighted grid.',
  dfs: 'Depth-First Search dives as deep as possible using a stack before backtracking. It finds a path, but rarely the shortest.',
  astar: 'A* Search picks the node with the lowest f = g + h, where h is the Manhattan distance to the goal. Fast and optimal.'
};
$('desc').textContent = DESC[algo];

function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function resize(){
  const w = cv.parentElement.clientWidth;
  cell = Math.floor(w / COLS);
  const dpr = window.devicePixelRatio || 1;
  cv.style.height = (cell * ROWS) + 'px';
  cv.width = cell * COLS * dpr; cv.height = cell * ROWS * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw(){
  const bg = css('--bg'), ink = css('--ink'), g1 = css('--g1'), g2 = css('--g2');
  const W = cell * COLS, H = cell * ROWS;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < N; i++){
    const x = (i % COLS) * cell, y = Math.floor(i / COLS) * cell;
    if (wall[i]) ctx.fillStyle = ink;
    else if (state[i] === 2) ctx.fillStyle = g1;
    else if (state[i] === 1) ctx.fillStyle = g2;
    else continue;
    ctx.fillRect(x, y, cell, cell);
  }
  ctx.strokeStyle = g1; ctx.lineWidth = 1; ctx.beginPath();
  for (let c = 0; c <= COLS; c++){ ctx.moveTo(c * cell + .5, 0); ctx.lineTo(c * cell + .5, H); }
  for (let r = 0; r <= ROWS; r++){ ctx.moveTo(0, r * cell + .5); ctx.lineTo(W, r * cell + .5); }
  ctx.stroke();
  // path as dots
  ctx.fillStyle = ink;
  for (const i of path){
    if (i === start || i === end) continue;
    const cx = (i % COLS + .5) * cell, cy = (Math.floor(i / COLS) + .5) * cell;
    ctx.beginPath(); ctx.arc(cx, cy, cell * .18, 0, 7); ctx.fill();
  }
  // start & end
  ctx.font = `bold ${Math.floor(cell * .55)}px Helvetica,Arial,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const sx = (start % COLS) * cell, sy = Math.floor(start / COLS) * cell;
  ctx.fillStyle = bg; ctx.strokeStyle = ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(sx + cell / 2, sy + cell / 2, cell * .4, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = ink; ctx.fillText('S', sx + cell / 2, sy + cell / 2 + 1);
  const ex = (end % COLS) * cell, ey = Math.floor(end / COLS) * cell;
  ctx.fillStyle = ink; ctx.fillRect(ex + cell * .1, ey + cell * .1, cell * .8, cell * .8);
  ctx.fillStyle = bg; ctx.fillText('E', ex + cell / 2, ey + cell / 2 + 1);
}

function neighbors(i){
  const r = Math.floor(i / COLS), c = i % COLS, out = [];
  if (r > 0) out.push(i - COLS);
  if (c < COLS - 1) out.push(i + 1);
  if (r < ROWS - 1) out.push(i + COLS);
  if (c > 0) out.push(i - 1);
  return out.filter(n => !wall[n]);
}
const h = i => Math.abs((i % COLS) - (end % COLS)) + Math.abs(Math.floor(i / COLS) - Math.floor(end / COLS));

function buildPath(prev){
  const p = []; let cur = end;
  while (cur !== -1){ p.push(cur); cur = prev[cur]; }
  return p.reverse();
}

// Each algorithm is a generator: one yield per expanded node.
// Yields true when the goal is found, false otherwise; sets prev for path rebuild.
function* bfs(prev){
  const q = [start], seen = new Uint8Array(N); seen[start] = 1; state[start] = 1;
  while (q.length){
    const cur = q.shift(); state[cur] = 2;
    if (cur === end){ yield 'found'; return; }
    for (const n of neighbors(cur)) if (!seen[n]){ seen[n] = 1; prev[n] = cur; state[n] = 1; q.push(n); }
    yield 'step';
  }
  yield 'none';
}
function* dfs(prev){
  const st = [start], seen = new Uint8Array(N); state[start] = 1;
  while (st.length){
    const cur = st.pop();
    if (seen[cur]) continue;
    seen[cur] = 1; state[cur] = 2;
    if (cur === end){ yield 'found'; return; }
    const ns = neighbors(cur).reverse();
    for (const n of ns) if (!seen[n]){ prev[n] = cur; state[n] = 1; st.push(n); }
    yield 'step';
  }
  yield 'none';
}
function* astar(prev){
  const g = new Float64Array(N).fill(Infinity), closed = new Uint8Array(N);
  g[start] = 0; const open = [start]; state[start] = 1;
  while (open.length){
    let bi = 0;
    for (let k = 1; k < open.length; k++){
      const a = open[k], b = open[bi];
      const fa = g[a] + h(a), fb = g[b] + h(b);
      if (fa < fb || (fa === fb && h(a) < h(b))) bi = k;
    }
    const cur = open.splice(bi, 1)[0];
    if (closed[cur]) continue;
    closed[cur] = 1; state[cur] = 2;
    if (cur === end){ yield 'found'; return; }
    for (const n of neighbors(cur)){
      const ng = g[cur] + 1;
      if (ng < g[n]){ g[n] = ng; prev[n] = cur; if (!closed[n]){ open.push(n); state[n] = 1; } }
    }
    yield 'step';
  }
  yield 'none';
}
const ALGOS = { bfs, dfs, astar };

function resetPath(){
  clearTimeout(timer); running = false;
  state.fill(0); path = [];
  $('sv').textContent = '0'; $('sp').textContent = '-'; $('ss').textContent = 'Ready';
  $('run').disabled = false; draw();
}

function run(){
  if (running) return;
  resetPath(); running = true; $('run').disabled = true; $('ss').textContent = 'Searching';
  const prev = new Int32Array(N).fill(-1);
  const gen = ALGOS[algo](prev);
  let visited = 0;
  function tick(){
    const speed = +$('speed').value;
    const perFrame = speed >= 9 ? 25 : speed >= 7 ? 5 : 1;
    const delay = speed >= 7 ? 12 : [0, 160, 110, 80, 55, 35, 20][speed];
    for (let k = 0; k < perFrame; k++){
      const r = gen.next().value;
      visited++;
      if (r === 'found'){
        path = buildPath(prev); finish(visited, path.length - 1, 'Found'); return;
      }
      if (r === 'none'){ finish(visited, null, 'No path'); return; }
    }
    $('sv').textContent = visited; draw();
    timer = setTimeout(tick, delay);
  }
  tick();
}
function finish(v, len, msg){
  running = false; $('run').disabled = false;
  $('sv').textContent = v; $('sp').textContent = len === null ? '-' : len; $('ss').textContent = msg; draw();
}

// ---- interaction ----
let drag = null; // 'start' | 'end' | 'draw' | 'erase'
function cellAt(e){
  const r = cv.getBoundingClientRect();
  const c = Math.floor((e.clientX - r.left) / cell), rw = Math.floor((e.clientY - r.top) / cell);
  if (c < 0 || c >= COLS || rw < 0 || rw >= ROWS) return -1;
  return rw * COLS + c;
}
function edit(i){
  if (i < 0) return;
  if (drag === 'start' && i !== end && !wall[i]) start = i;
  else if (drag === 'end' && i !== start && !wall[i]) end = i;
  else if (drag === 'draw' && i !== start && i !== end) wall[i] = 1;
  else if (drag === 'erase') wall[i] = 0;
  if (state.some(Boolean) || path.length){ state.fill(0); path = []; $('sp').textContent = '-'; $('ss').textContent = 'Ready'; $('sv').textContent = '0'; }
  draw();
}
cv.addEventListener('pointerdown', e => {
  if (running) return;
  const i = cellAt(e); if (i < 0) return;
  cv.setPointerCapture(e.pointerId);
  drag = i === start ? 'start' : i === end ? 'end' : wall[i] ? 'erase' : 'draw';
  edit(i);
});
cv.addEventListener('pointermove', e => { if (drag) edit(cellAt(e)); });
['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => drag = null));

$('algos').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || running) return;
  algo = b.dataset.a;
  document.querySelectorAll('#algos button').forEach(x => x.classList.toggle('on', x === b));
  $('desc').textContent = DESC[algo]; resetPath();
});
$('run').onclick = run;
$('reset').onclick = resetPath;
$('clear').onclick = () => { wall.fill(0); resetPath(); };
$('maze').onclick = () => {
  resetPath(); wall.fill(0);
  for (let i = 0; i < N; i++) if (i !== start && i !== end && Math.random() < 0.28) wall[i] = 1;
  draw();
};

window.addEventListener('resize', resize);
resize();
