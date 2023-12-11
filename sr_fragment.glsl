#version 300 es

precision highp float;

const float STEP_SIZE = 0.05;
const int MAX_STEPS = 1000;
const vec3 BACKGROUND_COLOR = vec3(0.0, 0.0, 0.0);
const vec3 INSIDE_COLOR = vec3(0.0, 0.0, 0.0);
const vec3 LIGHT_COLOR = vec3(1.0, 1.0, 1.0);

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

struct ObjectColor {
  vec3 diffuseColor;
};

struct CollisionResult {
  bool collision;
  ObjectColor color;
};

CollisionResult checkCollideCuboid(vec3 posStart, vec3 posEnd, ObjectColor color, vec3 pos) {
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

CollisionResult checkCollideSphere(vec3 posSphere, float radius, ObjectColor color, vec3 pos) {
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
  
  ObjectColor color;
  
  color.diffuseColor = vec3(1.0, 0.0, 0.0);
  collide = checkCollideCuboid(vec3(-10.0, -1.0, -10.0), vec3(10.0, 0.0, 10.0), color, pos);
  if (collide.collision) return collide;
  
  color.diffuseColor = vec3(0.0, 1.0, 0.0);
  collide = checkCollideSphere(vec3(1.0, 1.0, 1.0), 0.5, color, pos);
  if (collide.collision) return collide;
  
  return collide;
}

struct LightColor {
  vec3 color;
};

struct LightResult {
  bool reached;
  LightColor color;
};

LightResult checkLightEverPresent(LightColor color, vec3 pos) {
  LightResult lightResult;
  
  lightResult.reached = true;
  lightResult.color = color;
  
  return lightResult;
}

LightResult checkLightPointSource(vec3 posLight, LightColor color, vec3 pos) {
  LightResult lightResult;
  
  lightResult.reached = false;
  
  return lightResult;
}

vec3 raytraceStepToLights(vec3 pos) {
  vec3 cumulativeLightColor = vec3(0.0, 0.0, 0.0);
  
  LightResult lightResult;
  
  LightColor color;
  
  color.color = vec3(0.1, 0.1, 0.1);
  lightResult = checkLightEverPresent(color, pos);
  if (lightResult.reached) cumulativeLightColor += lightResult.color.color;
  
  color.color = vec3(1.0, 1.0, 1.0);
  lightResult = checkLightPointSource(vec3(0.0, 10.0, 0.0), color, pos);
  if (lightResult.reached) cumulativeLightColor += lightResult.color.color;
  
  return cumulativeLightColor;
}

vec3 getRaytraceColor(vec3 currentPos, vec3 stepDir) {
  stepDir *= STEP_SIZE;
  
  CollisionResult collisionResult = checkCollision(currentPos);
  
  if (collisionResult.collision) {
    return INSIDE_COLOR;
  }
  
  for (int i = 0; i < MAX_STEPS; i++) {
    currentPos += stepDir;
    
    CollisionResult collisionResult = checkCollision(currentPos);
    
    if (collisionResult.collision) {
      return collisionResult.color.diffuseColor * raytraceStepToLights(currentPos);
    }
  }
  
  return BACKGROUND_COLOR;
}

vec3 getColorAtScreenPos(vec2 screenCoord) {
  vec3 currentPos = pos;
  
  StepDirParams stepDirParams = convertRotToStepDir(rot);
  
  vec3 stepDir = stepDirParams.stepDir +
    stepDirParams.rightDir * (screenCoord.x * fovScale) +
    stepDirParams.upDir * (screenCoord.y * fovScale);
  
  stepDir = normalize(stepDir);
  
  return getRaytraceColor(currentPos, stepDir);
}

void main() {
  vec2 screenCoord = convertScreenCoordToNormalized(gl_FragCoord.xy);
  
  outColor = vec4(getColorAtScreenPos(screenCoord), 1.0);
}
