let FPS_SLIDER_VSYNC_MIN_FRAC = 20;
let FPS_SLIDER_NONVSYNC_MIN_FRAMERATE = 1;

function showSettings() {
  settings_div.style.display = '';
}

function closeSettings() {
  settings_div.style.display = 'none';
}

function setRenderProgress(y) {
  if (y == null) {
    render_progress.textContent = '';
  } else {
    render_progress.textContent = `${y}/${manager.getHeight()}`;
  }
}

function updateSettingsFromVars() {
  updateFOV();
  
  pixel_ratio_range.value = Math.log10(pixelRatio);
  pixel_ratio_text.value = pixelRatio;
  
  if (vsync) {
    fps_range.step = 1 / FPS_SLIDER_VSYNC_MIN_FRAC;
    fps_range.value = 1 - (monitorFrameRate / targetFrameRate - 1) / FPS_SLIDER_VSYNC_MIN_FRAC;
  } else {
    fps_range.step = 0.001;
    fps_range.value = sqrt(atan((targetFrameRate - FPS_SLIDER_NONVSYNC_MIN_FRAMERATE) / (monitorFrameRate - FPS_SLIDER_NONVSYNC_MIN_FRAMERATE)) / pi * 2);
  }
  
  fps_text.value = targetFrameRate;
  
  vsync_input.checked = vsync;
  
  fov_input.value = deg(fov);
  
  x.value = pos.getX();
  y.value = pos.getY();
  z.value = pos.getZ();
  
  elev_input.value = deg(elev);
  azim_input.value = deg(azim);
}

function cleanNumWithDefault(numText, defaultVal) {
  let num = Number(numText);
  
  if (Number.isNaN(num)) {
    return defaultVal;
  } else {
    return num;
  }
}

function updateSettingsFromRange(elem) {
  switch (elem) {
    case pixel_ratio_range:
      pixel_ratio_text.value = 10 ** cleanNumWithDefault(pixel_ratio_range.value, 0);
      break;
    
    case fps_range:
      if (vsync) {
        let rangeValue = cleanNumWithDefault(fps_range.value, 1);
        fps_text.value = monitorFrameRate / ((1 - rangeValue) * FPS_SLIDER_VSYNC_MIN_FRAC + 1);
      } else {
        let rangeValue = cleanNumWithDefault(fps_range.value, Math.SQRT1_2);
        if (rangeValue == 1) {
          fps_text.value = Infinity;
        } else {
          fps_text.value = (monitorFrameRate - FPS_SLIDER_NONVSYNC_MIN_FRAMERATE) * tan(rangeValue ** 2 * pi / 2) + FPS_SLIDER_NONVSYNC_MIN_FRAMERATE;
        }
      }
      break;
  }
}

function updateVarsFromSettings(elem) {
  switch (elem) {
    case pixel_ratio_range:
      pixelRatio = 10 ** cleanNumWithDefault(pixel_ratio_range.value, 0);
      updatePixelRatio();
      break;
    
    case pixel_ratio_text:
      pixelRatio = cleanNumWithDefault(pixel_ratio_text.value, 1);
      updatePixelRatio();
      break;
    
    case vsync_input:
      vsync = vsync_input.checked;
      break;
    
    case fps_range:
      if (vsync) {
        let rangeValue = cleanNumWithDefault(fps_range.value, 1);
        targetFrameRate = monitorFrameRate / ((1 - rangeValue) * FPS_SLIDER_VSYNC_MIN_FRAC + 1);
      } else {
        let rangeValue = cleanNumWithDefault(fps_range.value, Math.SQRT1_2);
        if (rangeValue == 1) {
          targetFrameRate = Infinity;
        } else {
          targetFrameRate = (monitorFrameRate - FPS_SLIDER_NONVSYNC_MIN_FRAMERATE) * tan(rangeValue ** 2 * pi / 2) + FPS_SLIDER_NONVSYNC_MIN_FRAMERATE;
        }
      }
      break;
    
    case fps_text:
      targetFrameRate = cleanNumWithDefault(fps_text.value, monitorFrameRate);
      break;
    
    case fov_input:
      fov = rad(cleanNumWithDefault(fov_input.value, 90));
      updateFOVExponent();
      break;
    
    case x:
    case y:
    case z: {
      let xVal = cleanNumWithDefault(x.value, 0);
      let yVal = cleanNumWithDefault(y.value, 1);
      let zVal = cleanNumWithDefault(z.value, 0);
      pos = new Vec3D(xVal, yVal, zVal);
      break;
    }
    
    case elev_input:
      elev = cleanNumWithDefault(elev_input.value, 0);
      break;
    
    case azim_input:
      azim = cleanNumWithDefault(azim_input.value, 0);
      break;
  }
  
  updateSettingsFromVars();
}

function resetCoords() {
  fovExponent = 0;
  pos = new Vec3D(0, 1, 0);
  elev = 0;
  azim = 0;
  updateSettingsFromVars();
}
