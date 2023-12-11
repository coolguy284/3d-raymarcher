class Renderer3D {
  #width;
  #height;
  
  setDimensions(width, height) {
    this.#width = width;
    this.#height = height;
  }
  
  #normalizeScreenCoords(x, y) {
    return [
      x / this.#width,
      y / this.#height,
    ];
  }
  
  calculatePixelColor(x, y) {
    [ x, y ] = this.#normalizeScreenCoords(x, y);
    
    if (x > 0.5) return 'white';
    else return 'black';
  }
}
