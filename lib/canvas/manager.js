class CanvasManager {
  #drawMode;
  #container;
  #drawer;
  
  // setup commands
  
  constructor(canvasContainer) {
    this.#container = canvasContainer;
  }
  
  setDrawMode(drawMode) {
    switch (drawMode) {
      case undefined:
      case null:
        if (this.#drawMode != null) {
          // remove canvas
          this.#drawer.destroy();
          this.#drawer = null;
          this.#drawMode = null;
        }
        break;
      
      case '2d':
        // setup 2d canvas drawer
        this.#drawer = new CanvasDrawer2D(this.#container);
        this.#drawMode = '2d';
        break;
    }
  }
  
  // drawing commands
  
  getWidth() {
    return this.#drawer.getWidth();
  }
  
  getHeight() {
    return this.#drawer.getHeight();
  }
  
  setBackgroundColor(color) {
    this.#container.style.backgroundColor = color;
  }
  
  clear() {
    this.#drawer.clear();
  }
  
  setPixel(x, y, color) {
    this.#drawer.setPixel(x, y, color);
  }
}
