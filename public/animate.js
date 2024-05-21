const nnodes = (window.innerHeight * window.innerWidth) / 12000;
console.log(nnodes);
let nodesX = [],
  nodesY = [];
let edges = [],
  edgeColor = [];
let nodeColor = [];
const dh = 1 / 100;
const fr = 0,
  fg = 0,
  fb = 255;
const lr = 232,
  lg = 0,
  lb = 228;

let visited = [];
let cntT = 0;

function bfs(start) {
  let ptr = 0;
  let q = [],
    from = [];
  let vis = [];
  for (let i = 0; i < nnodes; i++) {
    vis.push(false);
  }
  q.push(start);
  from.push(-1);
  vis[start] = true;
  let alt = false;

  let intid = setInterval(function () {
    let titleText = document.getElementById("title");

    if (cntT < 40) {
      titleText.innerHTML = "<strong><em>TJCT Grader</em></strong>";
      cntT += 1;
    } else {
      titleText.innerHTML = "<strong><em>TJIOI 2024</em></strong>";
      if (cntT >= 80) cntT = 0;
      cntT += 1;
    }

    if (!alt && from[ptr] != -1) {
      let cur = q[ptr];
      let prev = from[ptr];
      edgeColor[cur][prev] = 100;
      edgeColor[prev][cur] = 100;
      alt = true;
    } else {
      alt = false;
      let cur = q[ptr];
      visited[cur] = true;
      nodeColor[cur] = 100;
      ptr++;
      for (let i = 0; i < nodesX.length; i++) {
        if (edges[cur][i] && i != cur && !vis[i]) {
          vis[i] = true;
          q.push(i);
          from.push(cur);
        }
      }
    }
    if (ptr >= q.length) {
      clearInterval(intid);
      let newind = 0;
      for (let i = 0; i < nodesX.length; i++) {
        if (!visited[i]) {
          newind = i;
        }
      }
      if (newind == 0) {
        for (let i = 0; i < nodesX.length; i++) {
          visited[i] = false;
        }
      }
      console.log(newind);
      bfs(newind);
    }
  }, 75);
}
bfs(0);

function checkPoint(x, y) {
  let works = true;
  for (let i = 0; i < nodesX.length; i++) {
    if (
      7000 >
      (nodesX[i] - x) * (nodesX[i] - x) + (nodesY[i] - y) * (nodesY[i] - y)
    ) {
      works = false;
    }
  }
  return works;
}

function generateNodes() {
  for (let i = 0; i < nnodes; i++) {
    let x = Math.floor(Math.random() * (window.innerWidth - 100) + 50),
      y = Math.floor(Math.random() * (window.innerHeight - 100) + 50);
    if (checkPoint(x, y)) {
      nodesX.push(x);
      nodesY.push(y);
      nodeColor.push(0);
      visited.push(false);
    }
  }
  for (let i = 0; i < nnodes; i++) {
    let temp = [],
      temp2 = [];
    for (let j = 0; j < nnodes; j++) {
      temp.push(false);
      temp2.push(0);
    }
    edges.push(temp);
    edgeColor.push(temp2);
  }
  for (let i = 0; i < nodesX.length; i++) {
    let cmin = 0,
      dist = 1000000000;
    for (let j = 0; j < nodesY.length; j++) {
      let temp =
        (nodesX[i] - nodesX[j]) * (nodesX[i] - nodesX[j]) +
        (nodesY[i] - nodesY[j]) * (nodesY[i] - nodesY[j]);
      if (temp < dist && !edges[i][j] && i != j) {
        cmin = j;
        dist = temp;
      }
    }
    edges[i][cmin] = true;
    edges[cmin][i] = true;
  }
  // console.log(edges);
}

function init() {
  window.requestAnimationFrame(draw);
}

function drawNode(ctx, idx) {
  const x = nodesX[idx],
    y = nodesY[idx];
  const r = fr + nodeColor[idx] * dh * (lr - fr);
  const g = fg + nodeColor[idx] * dh * (lg - fg);
  const b = fb + nodeColor[idx] * dh * (lb - fb);
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, 2 * Math.PI);
  ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
  ctx.fill();
  ctx.stroke();
}

function draw() {
  const canvas = document.getElementById("animation");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");

  ctx.globalCompositeOperation = "destination-over";
  ctx.clearRect(0, 0, 300, 300); // clear canvas

  for (let i = 0; i < nodesX.length; i++) {
    if (nodeColor[i] > 0) {
      nodeColor[i] -= 0.5;
    }
    drawNode(ctx, i);
  }
  for (let i = 0; i < nodesX.length; i++) {
    for (let j = 0; j < i; j++) {
      if (edges[i][j]) {
        if (edgeColor[i][j] > 0) {
          edgeColor[i][j] -= 0.5;
        }
        const r = fr + 100 + edgeColor[i][j] * dh * (lr - (fr + 100));
        const g = fg + 100 + edgeColor[i][j] * dh * (lg - (fg + 100));
        const b = fb + edgeColor[i][j] * dh * (lb - fb);
        ctx.beginPath();
        ctx.moveTo(nodesX[i], nodesY[i]);
        ctx.lineTo(nodesX[j], nodesY[j]);
        ctx.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.stroke();
      }
    }
  }
  window.requestAnimationFrame(draw);
}

generateNodes();
init();
