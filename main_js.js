// js vars
let MAX_FRAME_TIME, renderer, y, init, draw;

function mainJS() {
  MAX_FRAME_TIME = 1 / 20;
  
  manager = new CanvasManager(canvas_container);
  
  renderer = new Renderer3D();
  
  y = 0;
  
  init = async () => {
    manager.setPixelRatio(10);
    await manager.setDrawMode('2d');
    //manager.setBackgroundColor('black');
    
    renderer.setDimensions(manager.getWidth(), manager.getHeight());
    renderer.setFov(pi * 0.5);
    renderer.setPosAndRot(0, 1, 0, 0, 0);
  };
  
  draw = async () => {
    while (y < manager.getHeight()) {
      let drawStartTime = Date.now();
      
      for (; y < manager.getHeight(); y++) {
        for (let x = 0; x < manager.getWidth(); x++) {
          manager.setPixel(x, y, renderer.calculatePixelColor(x, y));
        }
        
        if ((Date.now() - drawStartTime) > MAX_FRAME_TIME) {
          break;
        }
      }
      
      setRenderProgress(y);
      
      await new Promise(r => requestAnimationFrame(r));
    }
    
    setRenderProgress(null);
  };
  
  (async () => {
    await init();
    await draw();
  })();
}
