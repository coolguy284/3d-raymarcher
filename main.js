let MAX_FRAME_TIME = 1 / 20;

let manager = new CanvasManager(canvas_container);

manager.setDrawMode('2d');

manager.setBackgroundColor('black');

let y = 0;

let draw = () => {
  let drawStartTime = Date.now();
  
  for (; y < manager.getHeight(); y++) {
    for (let x = 0; x < manager.getWidth(); x++) {
      manager.setPixel(x, y, 'white');
    }
    
    if ((Date.now() - drawStartTime) > MAX_FRAME_TIME) {
      break;
    }
  }
  
  requestAnimationFrame(draw);
};

draw();
