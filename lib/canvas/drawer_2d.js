class CanvasDrawer2D {
  #container;
  #canvas;
  #ctx;
  #resizeListener;
  
  // setup commands
  
  constructor(canvasContainerElem) {
    this.#container = canvasContainerElem;
    
    this.#canvas = document.createElement('canvas');
    this.#container.appendChild(this.#canvas);
    
    this.#setCanvasSizeToPhysicalSize();
    
    //this.#resizeListener = () => this.#setCanvasSizeToPhysicalSize();
    
    //addEventListener('resize', this.#resizeListener);
    
    this.#ctx = this.#canvas.getContext('2d');
  }
  
  #setCanvasSizeToPhysicalSize() {
    let computedStyle = getComputedStyle(this.#canvas);
    
    this.#canvas.width = parseInt(computedStyle.width);
    this.#canvas.height = parseInt(computedStyle.height);
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
