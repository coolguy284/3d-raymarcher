class CanvasDrawerShader {
  #container;
  #canvas;
  #gl;
  //#resizeListener;
  #pixelRatio;
  
  // setup commands
  
  constructor(canvasContainerElem, pixelRatio) {
    this.#pixelRatio = pixelRatio;
    
    this.#container = canvasContainerElem;
    
    this.#canvas = document.createElement('canvas');
    this.#container.appendChild(this.#canvas);
    
    this.#setCanvasSizeToPhysicalSize();
    
    //this.#resizeListener = () => this.#setCanvasSizeToPhysicalSize();
    
    //addEventListener('resize', this.#resizeListener);
    
    this.#gl = this.#canvas.getContext('webgl');
    
    if (this.#gl == null) {
      alert('webgl unavailable');
    }
  }
  
  #setCanvasSizeToPhysicalSize() {
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
    this.#gl.clearColor(1.0, 0.0, 0.0, 1.0);
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);
  }
  
  draw() {
    this.clear();
  }
}
