class Renderer3D {
  #width;
  #height;
  
  #pos = new Vec3D(0, 0, 0);
  #elev = 0;
  #azim = 0;
  
  // setup commands
  
  setDimensions(width, height) {
    this.#width = width;
    this.#height = height;
  }
  
  // 3d rendering functions
  
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
  
  // external rendering commands
  
  // (0, 0) is center
  // (0, 1) is top edge
  // (+aspect_ratio, 0) is right edge
  #normalizeScreenCoords(x, y) {
    return [
      (x - this.#width / 2) / (this.#height / 2),
      (y - this.#height / 2) / (this.#height / 2),
    ];
  }
  
  calculatePixelColor(x, y) {
    [ x, y ] = this.#normalizeScreenCoords(x, y);
    
    let stepDirParams = Renderer3D.convertAngleToStepDirection(this.#elev, this.#azim);
    
    let stepDir = stepDirParams.stepDirection
      .add(stepDirParams.rightDirection.scalarMult(x))
      .add(stepDirParams.upDirection.scalarMult(y))
      .normalize()
      .scalarMult(0.1);
    
    let currentPos = this.#pos;
    
    for (let i = 0; i < 1; i++) {
      currentPos = currentPos.add(stepDir);
      
      if (currentPos.getY() > 0) {
        return 'white';
      }
    }
    
    return 'black';
  }
}
