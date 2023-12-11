(async () => {
  // js or shader
  let RENDER_PROFILE = 'shader';
  
  switch (RENDER_PROFILE) {
    case 'js': {
      let MAX_FRAME_TIME = 1 / 20;
      
      let manager = new CanvasManager(canvas_container);
      
      manager.setPixelRatio(10);
      await manager.setDrawMode('2d');
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
      let manager = new CanvasManager(canvas_container);
      
      manager.setPixelRatio(2);
      await manager.setDrawMode('shader');
      manager.setBackgroundColor('black');
      
      let drawer = manager.getDrawer();
      
      let FOV = pi * 0.5;
      let MOUSE_SENSITIVITY = 1.5;
      
      let x = 0, y = 1, z = 0, elev = 0, azim = 0;
      let pointerLocked = false;
      
      drawer.setFov(FOV);
      
      let draw = async () => {
        while (true) {
          drawer.setPosAndRot(x, y, z, elev, azim);
          
          manager.draw();
          
          await new Promise(r => requestAnimationFrame(r));
        }
      };
      
      let canvas = drawer.getCanvas();
      
      canvas.addEventListener('click', async () => {
        if (pointerLocked) return;
        
        await canvas.requestPointerLock({
          unadjustedMovement: true,
        });
      });
      
      document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement != null;
      });
      
      document.addEventListener('pointerlockerror', () => {
        pointerLocked = document.pointerLockElement != null;
      });
      
      document.addEventListener('mousemove', evt => {
        if (pointerLocked) {
          let x = -evt.movementX * MOUSE_SENSITIVITY,
            y = evt.movementY * MOUSE_SENSITIVITY;
          
          elev = Math.min(Math.max(elev + y / drawer.getHeight(), -pi / 2), pi / 2);
          azim = (azim + x / drawer.getHeight()) % (pi * 2);
        }
      });
      
      await draw();
      break;
  }
})();
