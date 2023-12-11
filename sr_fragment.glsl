#version 300 es

precision highp float;

const float STEP_SIZE = 0.05;
const int MAX_STEPS = 1000;
const vec3 BACKGROUND_COLOR = vec3(0.0, 0.0, 0.0);

uniform vec2 iResolution;

uniform vec3 pos;
uniform vec2 rot; // elev, azim
uniform float fovScale;

out vec4 outColor;

vec2 convertScreenCoordToNormalized(vec2 screenCoord) {
  return vec2(
    (screenCoord.x - iResolution.x / 2.0) / (iResolution.y / 2.0),
    (screenCoord.y - iResolution.y / 2.0) / (iResolution.y / 2.0)
  );
}

struct StepDirParams {
  vec3 stepDir;
  vec3 rightDir;
  vec3 upDir;
};

StepDirParams convertRotToStepDir(vec2 rotVec) {
  float elev = rotVec.x;
  float azim = rotVec.y;
  
  StepDirParams result;
  
  result.stepDir = vec3(
    cos(azim) * cos(elev),
    sin(elev),
    sin(azim) * cos(elev)
  );
  
  result.rightDir = vec3(
    -sin(azim),
    0,
    cos(azim)
  );
  
  result.upDir = vec3(
    cos(azim) * -sin(elev),
    cos(elev),
    sin(azim) * -sin(elev)
  );
  
  return result;
}

struct CollisionResult {
  bool collision;
  vec3 color;
};

CollisionResult checkCollideCuboid(vec3 posStart, vec3 posEnd, vec3 color, vec3 pos) {
  CollisionResult collide;
  
  if (
    pos.x >= posStart.x && pos.x <= posEnd.x &&
    pos.y >= posStart.y && pos.y <= posEnd.y &&
    pos.z >= posStart.z && pos.z <= posEnd.z
  ) {
    collide.collision = true;
    collide.color = color;
  } else {
    collide.collision = false;
  }
  
  return collide;
}

CollisionResult checkCollideSphere(vec3 posSphere, float radius, vec3 color, vec3 pos) {
  CollisionResult collide;
  
  if (length(pos - posSphere) <= radius) {
    collide.collision = true;
    collide.color = color;
  } else {
    collide.collision = false;
  }
  
  return collide;
}

CollisionResult checkCollision(vec3 pos) {
  CollisionResult collide;
  
  collide = checkCollideCuboid(vec3(-10.0, -1.0, -10.0), vec3(10.0, 0.0, 10.0), vec3(1.0, 0.0, 0.0), pos); if (collide.collision) return collide;
  collide = checkCollideSphere(vec3(1.0, 1.0, 1.0), 0.5, vec3(0.0, 1.0, 0.0), pos); if (collide.collision) return collide;
  
  return collide;
}

vec3 getColorAtScreenPos(vec2 screenCoord) {
  vec3 currentPos = pos;
  
  StepDirParams stepDirParams = convertRotToStepDir(rot);
  
  vec3 stepDir = stepDirParams.stepDir +
    stepDirParams.rightDir * (screenCoord.x * fovScale) +
    stepDirParams.upDir * (screenCoord.y * fovScale);
  
  stepDir = normalize(stepDir) * STEP_SIZE;
  
  CollisionResult collisionResult = checkCollision(currentPos);
  
  if (collisionResult.collision) {
    return collisionResult.color;
  }
  
  for (int i = 0; i < MAX_STEPS; i++) {
    currentPos += stepDir;
    
    CollisionResult collisionResult = checkCollision(currentPos);
    
    if (collisionResult.collision) {
      return collisionResult.color;
    }
  }
  
  return BACKGROUND_COLOR;
}

void main() {
  vec2 screenCoord = convertScreenCoordToNormalized(gl_FragCoord.xy);
  
  outColor = vec4(getColorAtScreenPos(screenCoord), 1.0);
}
