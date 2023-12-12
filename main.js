// js or shader
let RENDER_PROFILE = 'shader';

switch (RENDER_PROFILE) {
  case 'js':
    mainJS();
    break;
  
  case 'shader':
    mainShader();
    break;
}
