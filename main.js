let MAX_FRAME_TIME = 1 / 20;

let manager = new CanvasManager(canvas_container);
let renderer = new Renderer3D();

manager.setPixelRatio(10);
manager.setDrawMode('2d');
manager.setBackgroundColor('black');

renderer.setDimensions(manager.getWidth(), manager.getHeight());
renderer.setPosAndRot(0, 0, 0, 0, 0);

let y = 0;

let draw = () => {
  let drawStartTime = Date.now();
  
  for (; y < manager.getHeight(); y++) {
    for (let x = 0; x < manager.getWidth(); x++) {
      manager.setPixel(x, y, renderer.calculatePixelColor(x, y));
    }
    
    if ((Date.now() - drawStartTime) > MAX_FRAME_TIME) {
      break;
    }
  }
  
  if (y < manager.getHeight()) requestAnimationFrame(draw);
};

draw();
