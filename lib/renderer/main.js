let STEP_SIZE = 0.3;
let MAX_STEPS = 10;
let BACKGROUND_COLOR = 'black';

class Renderer3D {
  #width;
  #height;
  
  #pos = new Vec3D(0, 0, 0);
  #elev = 0;
  #azim = 0;
  #fovScale = 1;
  
  // setup commands
  
  setDimensions(width, height) {
    this.#width = width;
    this.#height = height;
  }
  
  // 3d rendering functions
  
  setFov(fov) {
    this.#fovScale = tan(fov / 2);
  }
  
  setPosAndRot(x, y, z, elev, azim) {
    this.#pos = new Vec3D(x, y, z);
    this.#elev = elev;
    this.#azim = azim;
  }
  
  static convertAngleToStepDirection(elev, azim) {
    return {
      stepDirection: new Vec3D(
        cos(azim) * cos(elev),
        sin(elev),
        sin(azim) * cos(elev),
      ),
      rightDirection: new Vec3D(
        -sin(azim),
        0,
        cos(azim),
      ),
      upDirection: new Vec3D(
        cos(azim) * -sin(elev),
        cos(elev),
        sin(azim) * -sin(elev),
      ),
    };
  }
  
  checkCollision(vec) {
    let collide;
    
    collide = this.checkCollideCuboid(-10, -1, -10, 10, 0, 10, 'red', vec); if (collide[0]) return collide;
    collide = this.checkCollideSphere(1, 1, 1, 0.5, 'green', vec); if (collide[0]) return collide;
    
    return [false];
  }
  
  // external rendering commands
  
  // (0, 0) is center
  // (0, 1) is top edge
  // (+aspect_ratio, 0) is right edge
  #normalizeScreenCoords(x, y) {
    return [
      (x - this.#width / 2) / (this.#height / 2),
      (y - this.#height / 2) / -(this.#height / 2),
    ];
  }
  
  calculatePixelColor(x, y) {
    [ x, y ] = this.#normalizeScreenCoords(x, y);
    
    let stepDirParams = Renderer3D.convertAngleToStepDirection(this.#elev, this.#azim);
    
    let stepDir = stepDirParams.stepDirection
      .add(stepDirParams.rightDirection.scalarMult(x * this.#fovScale))
      .add(stepDirParams.upDirection.scalarMult(y * this.#fovScale))
      .normalize()
      .scalarMult(STEP_SIZE);
    
    let currentPos = this.#pos;
    
    for (let i = 0; i < MAX_STEPS; i++) {
      currentPos = currentPos.add(stepDir);
      
      let collision = this.checkCollision(currentPos);
      
      if (collision[0]) {
        return collision[1];
      }
    }
    
    return BACKGROUND_COLOR;
  }
  
  // object collision funcs
  
  checkCollideCuboid(x1, y1, z1, x2, y2, z2, color, vec) {
    if (
      vec.getX() >= x1 && vec.getX() <= x2 &&
      vec.getY() >= y1 && vec.getY() <= y2 &&
      vec.getZ() >= z1 && vec.getZ() <= z2
    ) {
      return [true, color];
    }
    
    return [false];
  }
  
  checkCollideSphere(x, y, z, r, color, vec) {
    let rSquared = sq(r);
    
    let sphereCenter = new Vec3D(x, y, z);
    
    let squaredDist = sphereCenter.distanceToSquared(vec);
    
    if (squaredDist <= rSquared) {
      return [true, color];
    }
    
    return [false];
  }
}
