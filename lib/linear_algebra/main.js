class Vec3D {
  #x;
  #y;
  #z;
  
  constructor(x, y, z) {
    this.#x = x;
    this.#y = y;
    this.#z = z;
  }
  
  getX() {
    return this.#x;
  }
  
  getY() {
    return this.#y;
  }
  
  getZ() {
    return this.#z;
  }
  
  mag() {
    return Math.hypot(
      this.#x,
      this.#y,
      this.#z,
    );
  }
  
  magSquared() {
    return this.#x * this.#x + this.#y * this.#y + this.#z * this.#z;
  }
  
  add(vec) {
    return new Vec3D(
      this.#x + vec.getX(),
      this.#y + vec.getY(),
      this.#z + vec.getZ(),
    );
  }
  
  sub(vec) {
    return this.add(vec.scalarMult(-1));
  }
  
  scalarMult(num) {
    return new Vec3D(
      this.#x * num,
      this.#y * num,
      this.#z * num,
    );
  }
  
  normalize() {
    let mag = this.mag();
    
    return this.scalarMult(1 / mag);
  }
  
  distanceToSquared(vec) {
    return vec.sub(this).magSquared();
  }
}
