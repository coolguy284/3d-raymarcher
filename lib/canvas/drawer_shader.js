class CanvasDrawerShader {
  // setup vars
  
  #container;
  #canvas;
  #gl;
  #glBuffers;
  #shaderProgram;
  #shaderProgramInfo;
  //#resizeListener;
  #pixelRatio;
  
  // program vars
  
  #x = 0;
  #y = 0;
  #z = 0;
  #elev = 0;
  #azim = 0;
  #fovScale = 1;
  
  // setup commands
  
  constructor(canvasContainerElem, pixelRatio) {
    this.#pixelRatio = pixelRatio;
    
    this.#container = canvasContainerElem;
    
    this.#canvas = document.createElement('canvas');
    this.#container.appendChild(this.#canvas);
    
    this.#setCanvasSizeToPhysicalSize();
    
    //this.#resizeListener = () => this.#setCanvasSizeToPhysicalSize();
    
    //addEventListener('resize', this.#resizeListener);
    
    this.#gl = this.#canvas.getContext('webgl2');
    
    if (this.#gl == null) {
      alert('webgl unavailable');
    }
  }
  
  async init() {
    await this.#glInit();
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
    this.#drawGLScene();
  }
  
  setPosAndRot(x, y, z, elev, azim) {
    this.#x = x;
    this.#y = y;
    this.#z = z;
    this.#elev = elev;
    this.#azim = azim;
  }
  
  setFov(fov) {
    this.#fovScale = tan(fov / 2);
  }
  
  // webgl boilerplate
  
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
  #loadShader(type, source) {
    let shader = this.#gl.createShader(type);
    
    // send source code to shader object on gpu
    this.#gl.shaderSource(shader, source);
    
    // compile the shader program
    this.#gl.compileShader(shader);
    
    if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
      alert(`Error compiling OpenGL shader: ${this.#gl.getShaderInfoLog(shader)}`);
      
      this.#gl.deleteShader(shader);
      
      throw new Error('stopping execution of shader');
    }
    
    return shader;
  }
  
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
  async #initShaderProgram() {
    let vertexCode = await (await fetch('sr_vertex.glsl')).text();
    let fragmentCode = await (await fetch('sr_fragment.glsl')).text();
    
    let vertexShader = this.#loadShader(this.#gl.VERTEX_SHADER, vertexCode);
    let fragmentShader = this.#loadShader(this.#gl.FRAGMENT_SHADER, fragmentCode);
    
    this.#shaderProgram = this.#gl.createProgram();
    this.#gl.attachShader(this.#shaderProgram, vertexShader);
    this.#gl.attachShader(this.#shaderProgram, fragmentShader);
    this.#gl.linkProgram(this.#shaderProgram);
    
    if (!this.#gl.getProgramParameter(this.#shaderProgram, this.#gl.LINK_STATUS)) {
      alert(`Cannot initialize OpenGL shader program: ${this.#gl.getProgramInfoLog(this.#shaderProgram)}`);
      
      throw new Error('stopping execution of shader');
    }
    
    return this.#shaderProgram;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
  #populateShaderProgramInfo() {
    this.#shaderProgramInfo = {
      attribLocations: {
        vertexPosition: this.#gl.getAttribLocation(this.#shaderProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        projectionMatrix: this.#gl.getUniformLocation(this.#shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: this.#gl.getUniformLocation(this.#shaderProgram, 'uModelViewMatrix'),
        
        iResolution: this.#gl.getUniformLocation(this.#shaderProgram, 'iResolution'),
        
        pos: this.#gl.getUniformLocation(this.#shaderProgram, 'pos'),
        rot: this.#gl.getUniformLocation(this.#shaderProgram, 'rot'),
        fovScale: this.#gl.getUniformLocation(this.#shaderProgram, 'fovScale'),
      }
    };
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
  #initGLBuffers() {
    let positionBuffer = this.#gl.createBuffer();
    
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, positionBuffer);
    
    let positions = new Float32Array([this.#canvas.width / this.#canvas.height, 1.0, -this.#canvas.width / this.#canvas.height, 1.0, this.#canvas.width / this.#canvas.height, -1.0, -this.#canvas.width / this.#canvas.height, -1.0]);
    
    this.#gl.bufferData(this.#gl.ARRAY_BUFFER, positions, this.#gl.STATIC_DRAW);
    
    return {
      position: positionBuffer,
    };
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
  #setPositionAttribute(buffers) {
    let numComponents = 2;
    let type = this.#gl.FLOAT;
    let normalize = false;
    let stride = 0;
    let offset = 0;
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, buffers.position);
    this.#gl.vertexAttribPointer(
      this.#shaderProgramInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    this.#gl.enableVertexAttribArray(this.#shaderProgramInfo.attribLocations.vertexPosition);
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
  #drawGLScene() {
    this.#gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.#gl.clearDepth(1.0);
    this.#gl.enable(this.#gl.DEPTH_TEST);
    this.#gl.depthFunc(this.#gl.LEQUAL);
    
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
    
    this.#gl.uniform3fv(this.#shaderProgramInfo.uniformLocations.pos, [this.#x, this.#y, this.#z]);
    this.#gl.uniform2fv(this.#shaderProgramInfo.uniformLocations.rot, [this.#elev, this.#azim]);
    this.#gl.uniform1fv(this.#shaderProgramInfo.uniformLocations.fovScale, [this.#fovScale]);
    
    let offset = 0;
    let vertexCount = 4;
    this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, offset, vertexCount);
  }

  #glResize(buffers) {
    this.#gl.useProgram(this.#shaderProgram);
    
    let fieldOfView = (45 * Math.PI) / 180;
    let aspect = 1.7;
    let zNear = 0.1;
    let zFar = 100.0;
    
    let projectionMatrix = mat4.create();
    
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    
    let modelViewMatrix = mat4.create();
    
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -0.1]); // messy way to draw a shader over the whole screen
    
    this.#setPositionAttribute(buffers);
    
    this.#gl.uniformMatrix4fv(
      this.#shaderProgramInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );
    this.#gl.uniformMatrix4fv(
      this.#shaderProgramInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix
    );
    this.#gl.uniform2fv(this.#shaderProgramInfo.uniformLocations.iResolution, [this.#canvas.width, this.#canvas.height]);
    
    this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
  }
  
  async #glInit() {
    this.#shaderProgram = await this.#initShaderProgram();
    
    this.#populateShaderProgramInfo();
    
    this.#glBuffers = this.#initGLBuffers();
    
    this.#glResize(this.#glBuffers);
  }
}
