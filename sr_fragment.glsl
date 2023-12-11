#version 300 es

precision highp float;

const float STEP_SIZE = 0.04;
const int MAX_STEPS = 400;
const float MAX_RAYTRACE_DIST = STEP_SIZE * float(MAX_STEPS);
const vec3 BACKGROUND_COLOR = vec3(0.0, 0.0, 0.0);
const vec3 INSIDE_COLOR = vec3(0.0, 0.0, 0.0);
const vec3 LIGHT_COLOR = vec3(1.0, 1.0, 1.0);
const vec3 ZERO_COLOR = vec3(0.0, 0.0, 0.0);

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
  vec3 normal;
  ObjectColor color;
};

CollisionResult checkCollideCuboid(vec3 posStart, vec3 posEnd, ObjectColor color, vec3 pos) {
  CollisionResult collide;
  
  vec3 posCenter = (posStart + posEnd) / 2.0;
  vec3 dimensions = posEnd - posStart;
  vec3 halfDimensions = dimensions / 2.0;
  
  vec3 vecFromCuboid = -(pos - posCenter);
  
  if (
    vecFromCuboid.x >= -halfDimensions.x && vecFromCuboid.x <= halfDimensions.x &&
    vecFromCuboid.y >= -halfDimensions.y && vecFromCuboid.y <= halfDimensions.y &&
    vecFromCuboid.z >= -halfDimensions.z && vecFromCuboid.z <= halfDimensions.z
  ) {
    collide.collision = true;
    collide.color = color;
    
    vec3 normalizedVecFromCuboid = vecFromCuboid / halfDimensions;
    
    if (abs(normalizedVecFromCuboid.x) > abs(normalizedVecFromCuboid.y) && abs(normalizedVecFromCuboid.x) > abs(normalizedVecFromCuboid.z)) {
      if (normalizedVecFromCuboid.x > 0.0) {
        collide.normal = vec3(1.0, 0.0, 0.0);
      } else {
        collide.normal = vec3(-1.0, 0.0, 0.0);
      }
    } else if (abs(normalizedVecFromCuboid.y) > abs(normalizedVecFromCuboid.z) && abs(normalizedVecFromCuboid.y) > abs(normalizedVecFromCuboid.z)) {
      if (normalizedVecFromCuboid.y > 0.0) {
        collide.normal = vec3(0.0, 1.0, 0.0);
      } else {
        collide.normal = vec3(0.0, -1.0, 0.0);
      }
    } else if (abs(normalizedVecFromCuboid.z) > abs(normalizedVecFromCuboid.x) && abs(normalizedVecFromCuboid.z) > abs(normalizedVecFromCuboid.y)) {
      if (normalizedVecFromCuboid.z > 0.0) {
        collide.normal = vec3(0.0, 0.0, 1.0);
      } else {
        collide.normal = vec3(0.0, 0.0, -1.0);
      }
    }
  } else {
    collide.collision = false;
  }
  
  return collide;
}

CollisionResult checkCollideSphere(vec3 posSphere, float radius, ObjectColor color, vec3 pos) {
  CollisionResult collide;
  
  vec3 vecFromSphere = -(pos - posSphere);
  
  if (length(vecFromSphere) <= radius) {
    collide.collision = true;
    collide.normal = normalize(vecFromSphere);
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

struct LightResult {
  bool reached;
  vec3 color;
};

LightResult checkLightEverPresent(vec3 color, vec3 pos) {
  LightResult lightResult;
  
  lightResult.reached = true;
  lightResult.color = color;
  
  return lightResult;
}

LightResult checkLightPointSource(vec3 posLight, vec3 color, vec3 pos, vec3 normal) {
  LightResult lightResult;
  
  vec3 vecToLight = -(pos - posLight);
  
  float distToLight = length(vecToLight);
  
  if (distToLight > MAX_RAYTRACE_DIST) {
    lightResult.reached = false;
  } else {
    vec3 currentPos = pos;
    vec3 lightStep = normalize(vecToLight) * STEP_SIZE;
    bool blocked = false;
    
    for (int i = 0; i < MAX_STEPS; i++) {
      currentPos += lightStep;
      
      CollisionResult collisionResult = checkCollision(currentPos);
      
      if (collisionResult.collision) {
        blocked = true;
        break;
      }
    }
    
    if (blocked) {
      lightResult.reached = false;
    } else {
      lightResult.reached = true;
      
      float normalAlignment = -dot(normal, normalize(vecToLight));
      if (normalAlignment > 0.0) {
        lightResult.color = color * normalAlignment * (1.0 / distToLight / distToLight);
      } else {
        lightResult.color = ZERO_COLOR;
      }
    }
  }
  
  return lightResult;
}

vec3 raytraceStepToLights(vec3 pos, vec3 normal) {
  vec3 cumulativeLightColor = ZERO_COLOR;
  
  LightResult lightResult;
  
  vec3 color;
  
  color = vec3(0.1, 0.1, 0.1);
  lightResult = checkLightEverPresent(color, pos);
  if (lightResult.reached) cumulativeLightColor += lightResult.color;
  
  color = vec3(15.0, 15.0, 15.0);
  lightResult = checkLightPointSource(vec3(0.0, 4.0, 0.0), color, pos, normal);
  if (lightResult.reached) cumulativeLightColor += lightResult.color;
  
  return cumulativeLightColor;
}

vec3 getRaytraceColor(vec3 currentPos, vec3 stepDir) {
  stepDir *= STEP_SIZE;
  
  CollisionResult collisionResult = checkCollision(currentPos);
  
  if (collisionResult.collision) {
    return collisionResult.color.diffuseColor * raytraceStepToLights(currentPos, collisionResult.normal);
  }
  
  vec3 pastPos;
  
  for (int i = 0; i < MAX_STEPS; i++) {
    pastPos = currentPos;
    currentPos += stepDir;
    
    CollisionResult collisionResult = checkCollision(currentPos);
    
    if (collisionResult.collision) {
      return collisionResult.color.diffuseColor * raytraceStepToLights(pastPos, collisionResult.normal);
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
