(async () => {
  // js or shader
  let RENDER_PROFILE = 'shader';
  
  switch (RENDER_PROFILE) {
    case 'js': {
      let MAX_FRAME_TIME = 1 / 20;
      
      let manager = new CanvasManager(canvas_container);
      
      manager.setPixelRatio(10);
      await manager.setDrawMode('2d');
      //manager.setBackgroundColor('black');
      
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
      //manager.setBackgroundColor('black');
      
      let drawer = manager.getDrawer();
      
      let BASE_FOV = pi * 0.5;
      let MOUSE_SENSITIVITY = 1.8;
      let WHEEL_FOV_SENSITIVITY = 0.0004;
      let MOVEMENT_SPEED = 1.0;
      let SPEED_BOOST = 10;
      let MAX_FOV_EXPONENT = 1;
      let MIN_FOV_EXPONENT = -10;
      let MOVING_AVG_FRAME_COUNT = 100;
      
      let pos = new Vec3D(0, 1, 0);
      let elev = 0, azim = 0;
      let fovExponent = 0;
      let pointerLocked = false;
      let currentKeys = new Set();
      let currentMouse = new Set();
      let lastFrameTime = Date.now();
      let lastFrameDuration = 0;
      let lastFrameDurations = [];
      
      let updateMovementVars = () => {
        let facingAngle = Renderer3D.convertAngleToStepDirection2D(elev, azim);
        
        let posDelta = MOVEMENT_SPEED * lastFrameDuration;
        
        if (currentMouse.has(1)) {
          posDelta *= SPEED_BOOST;
        }
        
        if (currentKeys.has('KeyW')) {
          pos = pos.add(
            facingAngle.forwardDirection.scalarMult(posDelta)
          );
        }
        
        if (currentKeys.has('KeyS')) {
          pos = pos.add(
            facingAngle.forwardDirection.scalarMult(-posDelta)
          );
        }
        
        if (currentKeys.has('KeyD')) {
          pos = pos.add(
            facingAngle.rightDirection.scalarMult(posDelta)
          );
        }
        
        if (currentKeys.has('KeyA')) {
          pos = pos.add(
            facingAngle.rightDirection.scalarMult(-posDelta)
          );
        }
        
        if (currentKeys.has('Space')) {
          pos = pos.add(
            facingAngle.upDirection.scalarMult(posDelta)
          );
        }
        
        if (currentKeys.has('ShiftLeft')) {
          pos = pos.add(
            facingAngle.upDirection.scalarMult(-posDelta)
          );
        }
      }
      
      let draw = async () => {
        while (true) {
          updateMovementVars();
          
          let fov = BASE_FOV * 10 ** fovExponent;
          
          let currentFPS = 1 / (lastFrameDurations.reduce((a, c) => a + c, 0) / lastFrameDurations.length);
          let maxFPS = 1 / lastFrameDurations.reduce((a, c) => Math.min(a, c), Infinity);
          let minFPS = 1 / lastFrameDurations.reduce((a, c) => Math.max(a, c), -Infinity);
          
          info.innerText = `${currentFPS.toFixed(3)} FPS (${maxFPS.toFixed(3)} max, ${minFPS.toFixed(3)} min)\n` +
            `X/Y/Z: ${pos.getX().toFixed(3)}, ${pos.getY().toFixed(3)}, ${pos.getZ().toFixed(3)}\n` +
            `Elev/Azim: ${deg(elev).toFixed(3)}°, ${deg(azim).toFixed(3)}°\n` +
            `FOV: ${deg(fov).toFixed(Math.max(Math.floor(-Math.log10(fov) + 4), 0))}°`;
          
          drawer.setPosAndRot(pos.getX(), pos.getY(), pos.getZ(), elev, azim);
          drawer.setFov(fov);
          
          manager.draw();
          
          let now = Date.now();
          lastFrameDuration = (now - lastFrameTime) / 1000;
          lastFrameTime = now;
          
          lastFrameDurations.push(lastFrameDuration);
          
          if (lastFrameDurations.length > MOVING_AVG_FRAME_COUNT) {
            lastFrameDurations.splice(0, lastFrameDurations.length - MOVING_AVG_FRAME_COUNT);
          }
          
          //await new Promise(r => setTimeout(r, 15));
          
          for (let i = 0; i < 1; i++) {
            await new Promise(r => requestAnimationFrame(r));
          }
        }
      };
      
      let canvas = drawer.getCanvas();
      
      canvas.addEventListener('click', async () => {
        if (pointerLocked) {
          document.exitPointerLock();
        } else {
          await canvas.requestPointerLock({
            unadjustedMovement: true,
          });
        }
      });
      
      document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement != null;
      });
      
      document.addEventListener('pointerlockerror', () => {
        pointerLocked = document.pointerLockElement != null;
      });
      
      document.addEventListener('mousemove', evt => {
        if (pointerLocked) {
          let x = (evt.movementX * 10 ** fovExponent * MOUSE_SENSITIVITY) / (cos(elev) + 10 ** fovExponent),
            y = -evt.movementY * 10 ** fovExponent * MOUSE_SENSITIVITY;
          
          elev = Math.min(Math.max(elev + y / drawer.getHeight(), -pi / 2), pi / 2);
          azim = (azim + x / drawer.getHeight() + pi * 2) % (pi * 2);
        }
      });
      
      document.addEventListener('wheel', evt => {
        fovExponent = Math.min(Math.max(fovExponent + evt.deltaY * WHEEL_FOV_SENSITIVITY, MIN_FOV_EXPONENT), MAX_FOV_EXPONENT);
      });
      
      document.addEventListener('keydown', evt => {
        currentKeys.add(evt.code);
        if (!/^F\d+$/.test(evt.code)) {
          evt.preventDefault();
        }
      });
      
      document.addEventListener('keyup', evt => {
        currentKeys.delete(evt.code);
        if (!/^F\d+$/.test(evt.code)) {
          evt.preventDefault();
        }
      });
      
      document.addEventListener('mousedown', evt => {
        currentMouse.add(evt.button);
      });
      
      document.addEventListener('mouseup', evt => {
        currentMouse.delete(evt.button);
      });
      
      await draw();
      break;
  }
})();
