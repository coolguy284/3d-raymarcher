class CanvasDrawer2D {
  #container;
  #canvas;
  #ctx;
  //#resizeListener;
  #pixelRatio;
  
  // setup commands
  
  constructor(canvasContainerElem, pixelRatio) {
    this.#pixelRatio = pixelRatio;
    
    this.#container = canvasContainerElem;
    
    this.#canvas = document.createElement('canvas');
    this.#container.appendChild(this.#canvas);
    
    this.updateCanvasSize();
    
    //this.#resizeListener = () => this.updateCanvasSize();
    
    //addEventListener('resize', this.#resizeListener);
    
    this.#ctx = this.#canvas.getContext('2d');
  }
  
  updateCanvasSize() {
    let computedStyle = getComputedStyle(this.#canvas);
    
    this.#canvas.width = parseInt(computedStyle.width) / this.#pixelRatio;
    this.#canvas.height = parseInt(computedStyle.height) / this.#pixelRatio;
  }
  
  destroy() {
    try {
      this.#container.removeChild(this.#canvas);
    } catch (e) {}
    
    //removeEventListener('resize', this.#resizeListener);
  }
  
  // drawing related commands
  
  getWidth() {
    return this.#canvas.width;
  }
  
  getHeight() {
    return this.#canvas.height;
  }
  
  clear() {
    this.#ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
  }
  
  setPixel(x, y, color) {
    this.#ctx.fillStyle = color;
    this.#ctx.fillRect(x, y, 1, 1);
  }
}
