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

function formatTimestamp(ms) {
  const milliseconds = ms % 1000;
  ms = (ms - milliseconds) / 1000;
  const seconds = ms % 60;
  ms = (ms - seconds) / 60;
  const minutes = ms % 60;
  const hours = (ms - minutes) / 60;

  return ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2) + '.' + ('00' + milliseconds).slice(-3);
}

export {convertGiikerData, formatTimestamp};
