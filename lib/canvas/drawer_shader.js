class CanvasDrawerShader {
  #container;
  #canvas;
  #gl;
  #glBuffers;
  #shaderProgram;
  #shaderProgramInfo;
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
        
        /*LIGHT_TRAVEL_TIME_DELAY: this.#gl.getUniformLocation(this.#shaderProgram, 'LIGHT_TRAVEL_TIME_DELAY'),
        LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY: this.#gl.getUniformLocation(this.#shaderProgram, 'LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY'),
        UNIVERSE_TIME_SHIFTING: this.#gl.getUniformLocation(this.#shaderProgram, 'UNIVERSE_TIME_SHIFTING'),
        UNIVERSE_LENGTH_CONTRACTION: this.#gl.getUniformLocation(this.#shaderProgram, 'UNIVERSE_LENGTH_CONTRACTION'),
        ITEM_LENGTH_CONTRACTION: this.#gl.getUniformLocation(this.#shaderProgram, 'ITEM_LENGTH_CONTRACTION'),
        RINDLER_METRIC_WHEN_ACCELERATING: this.#gl.getUniformLocation(this.#shaderProgram, 'RINDLER_METRIC_WHEN_ACCELERATING'),
        RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW: this.#gl.getUniformLocation(this.#shaderProgram, 'RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW'),
        HIDE_RINDLER_METRIC_PAST_SINGULARITY: this.#gl.getUniformLocation(this.#shaderProgram, 'HIDE_RINDLER_METRIC_PAST_SINGULARITY'),
        TIMELIKE_VIEW: this.#gl.getUniformLocation(this.#shaderProgram, 'TIMELIKE_VIEW'),
        TIMELIKE_VIEW_NORMALIZED_X_COORDINATE: this.#gl.getUniformLocation(this.#shaderProgram, 'TIMELIKE_VIEW_NORMALIZED_X_COORDINATE'),
        BLACK_BEFORE_UNIVERSE_START: this.#gl.getUniformLocation(this.#shaderProgram, 'BLACK_BEFORE_UNIVERSE_START'),
        BACKGROUND_PULSE: this.#gl.getUniformLocation(this.#shaderProgram, 'BACKGROUND_PULSE'),
        SPEED_OF_LIGHT: this.#gl.getUniformLocation(this.#shaderProgram, 'SPEED_OF_LIGHT'),
        
        pos: this.#gl.getUniformLocation(this.#shaderProgram, 'pos'),
        vel: this.#gl.getUniformLocation(this.#shaderProgram, 'vel'),
        scale: this.#gl.getUniformLocation(this.#shaderProgram, 'scale'),
        globalTime: this.#gl.getUniformLocation(this.#shaderProgram, 'globalTime'),
        velMag: this.#gl.getUniformLocation(this.#shaderProgram, 'velMag'),
        velAng: this.#gl.getUniformLocation(this.#shaderProgram, 'velAng'),
        velLorenzFactor: this.#gl.getUniformLocation(this.#shaderProgram, 'velLorenzFactor'),
        velRelativityScaleFactor: this.#gl.getUniformLocation(this.#shaderProgram, 'velRelativityScaleFactor'),
        velMagAdj: this.#gl.getUniformLocation(this.#shaderProgram, 'velMagAdj'),
        accMag: this.#gl.getUniformLocation(this.#shaderProgram, 'accMag'),
        accAng: this.#gl.getUniformLocation(this.#shaderProgram, 'accAng'),
        accMagAdj: this.#gl.getUniformLocation(this.#shaderProgram, 'accMagAdj'),*/
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
    
    /*this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.LIGHT_TRAVEL_TIME_DELAY, Number(LIGHT_TRAVEL_TIME_DELAY));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY, Number(LIGHT_TRAVEL_TIME_DELAY_INCLUDES_SHIP_VELOCITY));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.UNIVERSE_TIME_SHIFTING, Number(UNIVERSE_TIME_SHIFTING));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.UNIVERSE_LENGTH_CONTRACTION, Number(UNIVERSE_LENGTH_CONTRACTION));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.ITEM_LENGTH_CONTRACTION, Number(ITEM_LENGTH_CONTRACTION));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.RINDLER_METRIC_WHEN_ACCELERATING, Number(RINDLER_METRIC_WHEN_ACCELERATING));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW, Number(RINDLER_METRIC_WHEN_ACCELERATING_TIMELIKE_VIEW));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.HIDE_RINDLER_METRIC_PAST_SINGULARITY, Number(HIDE_RINDLER_METRIC_PAST_SINGULARITY));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.TIMELIKE_VIEW, Number(TIMELIKE_VIEW));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.TIMELIKE_VIEW_NORMALIZED_X_COORDINATE, Number(TIMELIKE_VIEW_NORMALIZED_X_COORDINATE));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.BLACK_BEFORE_UNIVERSE_START, Number(BLACK_BEFORE_UNIVERSE_START));
    this.#gl.uniform1i(this.#shaderProgramInfo.uniformLocations.BACKGROUND_PULSE, Number(BACKGROUND_PULSE));
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.SPEED_OF_LIGHT, SPEED_OF_LIGHT);
    
    this.#gl.uniform2fv(this.#shaderProgramInfo.uniformLocations.pos, [X, Y]);
    this.#gl.uniform2fv(this.#shaderProgramInfo.uniformLocations.vel, [VEL_X, VEL_Y]);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.scale, SCALE);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.globalTime, TIME);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.velMag, velMag);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.velAng, velAng);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.velLorenzFactor, velLorenzFactor);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.velRelativityScaleFactor, velRelativityScaleFactor);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.velMagAdj, velMagAdj);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.accMag, accMag);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.accAng, accAng);
    this.#gl.uniform1f(this.#shaderProgramInfo.uniformLocations.accMagAdj, accMagAdj);*/
    
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
    
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -2.413]);
    
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
