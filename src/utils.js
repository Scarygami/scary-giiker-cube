const vPosMapping = {
  'U': {'B': 'top', 'F': 'bottom'},
  'D': {'B': 'bottom', 'F': 'top'},
  'R': {'U': 'top', 'D': 'bottom'},
  'L': {'U': 'top', 'D': 'bottom'},
  'F': {'U': 'top', 'D': 'bottom'},
  'B': {'U': 'top', 'D': 'bottom'}
};

const hPosMapping = {
  'U': {'L': 'left', 'R': 'right'},
  'D': {'L': 'left', 'R': 'right'},
  'R': {'F': 'left', 'B': 'right'},
  'L': {'B': 'left', 'F': 'right'},
  'F': {'L': 'left', 'R': 'right'},
  'B': {'R': 'left', 'L': 'right'}
};

const colors = {
  'U': 'white',
  'D': 'yellow',
  'R': 'red',
  'L': 'orange',
  'F': 'green',
  'B': 'blue'
};

function convertData (data, index) {
  const side = data.position[index];
  const color = data.colors[index];
  let vPos = 'middle';
  let hPos = 'center';

  for (let i = 0; i < data.position.length; i++) {
    if (i !== index) {
      if (vPosMapping[side][data.position[i]]) {
        vPos = vPosMapping[side][data.position[i]];
      }
      if (hPosMapping[side][data.position[i]]) {
        hPos = hPosMapping[side][data.position[i]];
      }
    }
  }

  return {side, vPos, hPos, color};
}


function convertGiikerData (data) {
  const faces = [];

  data.corners.forEach((corner) => {
    for (let i = 0; i < 3; i++) {
      faces.push(convertData(corner, i));
    }
  });

  data.edges.forEach((edge) => {
    for (let i = 0; i < 2; i++) {
      faces.push(convertData(edge, i));
    }
  });

  // cube centers
  Object.keys(colors).forEach((side) => {
    faces.push({
      side: side,
      color: colors[side],
      vPos: 'middle',
      hPos: 'center'
    });
  });

  return faces;
}

function compareFaces(faces, mask) {
  for (let i = 0; i < faces.length; i++) {
    if (mask.charAt(i) !== '.' && mask.charAt(i) !== faces.charAt(i)) {
      return false;
    }
  }
  return true;
}

function detectCFOPCross(faces) {
  const cross = '.U.UUU.U..R..R.....F..F........D.....L..L.....B..B....';
  return compareFaces(faces, cross);
}

function detectCFOPFirstPair(faces) {
  const pairs = [
    'UU.UUU.U..R..R.....F..F........D....LL.LL.....BB.BB...',
    '.UUUUU.U..RR.RR....F..F........D.....L..L....BB.BB....',
    '.U.UUUUU..R..R....FF.FF........D.....LL.LL....B..B....',
    '.U.UUU.UURR.RR.....FF.FF.......D.....L..L.....B..B....'
  ];
  for (let i = 0; i < pairs.length; i++) {
    if (compareFaces(faces, pairs[i])) {
      return true;
    }
  }
  return false;
}

function detectCFOPF2L(faces) {
  const F2L = 'UUUUUUUUURRRRRR...FFFFFF.......D....LLLLLL...BBBBBB...';
  return compareFaces(faces, F2L);
}

function detectCFOPOLL(faces) {
  const OLL = 'UUUUUUUUURRRRRR...FFFFFF...DDDDDDDDDLLLLLL...BBBBBB...';
  return compareFaces(faces, OLL);
}

function detectSolve(faces) {
  const solved = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
  return (faces === solved);
}

export {convertGiikerData, detectCFOPCross, detectCFOPF2L, detectCFOPFirstPair, detectCFOPOLL, detectSolve};
