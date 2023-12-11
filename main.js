// js or shader
let RENDER_PROFILE = 'js';

switch (RENDER_PROFILE) {
  case 'js': {
    let MAX_FRAME_TIME = 1 / 20;
    
    let manager = new CanvasManager(canvas_container);
    
    manager.setPixelRatio(10);
    manager.setDrawMode('2d');
    manager.setBackgroundColor('black');
    
    let renderer = new Renderer3D();
    
    renderer.setDimensions(manager.getWidth(), manager.getHeight());
    renderer.setFov(pi * 0.5);
    renderer.setPosAndRot(0, 1, 0, 0, 0);
    
    let y = 0;
    
    let draw = async () => {
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
    
    draw();
    
    function setRenderProgress(y) {
      if (y == null) {
        render_progress.textContent = '';
      } else {
        render_progress.textContent = `${y}/${manager.getHeight()}`;
      }
    }
    break;
  }
  
  case 'shader':
    let manager = new CanvasManager();
    
    manager.setPixelRatio(2);
    manager.setDrawMode('shader');
    manager.setBackgroundColor('black');
    
    manager.draw();
    break;
}
