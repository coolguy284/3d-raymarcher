#version 300 es

precision highp float;

/* Tweakable constants */

const float BACKSTEP_DIST = 0.002;
const float MIN_STEP_SIZE = 0.001;
const int MAX_STEPS = 200;
const float MAX_RAYTRACE_DIST = 50.0;
const vec3 BACKGROUND_COLOR = vec3(0.0, 0.0, 0.0);
const vec3 INSIDE_COLOR = vec3(0.0, 0.0, 0.0);
const vec3 LIGHT_COLOR = vec3(1.0, 1.0, 1.0);
const vec3 ZERO_COLOR = vec3(0.0, 0.0, 0.0);
const float BACKGROUND_LIGHT_INTENSITY = 0.003;

/*
  object info, add an object of this type to these functions:
    cuboid: collider
    sphere: collider
    point source: collider, light, bglight
    black hole: collider, bend
    
    everpresent light: light
    global gravity: bend
*/

/* Programmatic constants */

const float INF = 1.0 / 0.0;

/* Uniforms and outs */

uniform vec2 iResolution;

uniform vec3 pos;
uniform vec2 rot; // elev, azim
uniform float fovScale;

out vec4 outColor;

/* Structs */

struct StepDirParams {
  vec3 stepDir;
  vec3 rightDir;
  vec3 upDir;
};

struct ObjectColor {
  vec3 diffuseColor;
};

struct CollisionResult {
  bool collision;
  float dist;
  vec3 normal;
  ObjectColor color;
};

struct LightResult {
  bool reached;
  vec3 color;
};

struct BackstepResults {
  vec3 pos;
  float totalDist;
};

/* Required forward declares */

CollisionResult checkCollision(vec3 pos);
vec3 getLightBendDir(vec3 pos);

/* Prelim funcs */

vec2 convertScreenCoordToNormalized(vec2 screenCoord) {
  return vec2(
    (screenCoord.x - iResolution.x / 2.0) / (iResolution.y / 2.0),
    (screenCoord.y - iResolution.y / 2.0) / (iResolution.y / 2.0)
  );
}

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

/* Raymarching shape collision funcs */

CollisionResult checkCollideCuboid(vec3 posStart, vec3 posEnd, ObjectColor color, vec3 pos) {
  CollisionResult collide;
  
  vec3 posCenter = (posStart + posEnd) / 2.0;
  vec3 dimensions = posEnd - posStart;
  vec3 halfDimensions = dimensions / 2.0;
  
  vec3 vecFromCuboid = -(pos - posCenter);
  
  vec3 normalizedVecFromCuboid = vecFromCuboid / halfDimensions;
  
  bool trueCollision = vecFromCuboid.x >= -halfDimensions.x && vecFromCuboid.x <= halfDimensions.x &&
    vecFromCuboid.y >= -halfDimensions.y && vecFromCuboid.y <= halfDimensions.y &&
    vecFromCuboid.z >= -halfDimensions.z && vecFromCuboid.z <= halfDimensions.z;
  
  if (abs(normalizedVecFromCuboid.x) > abs(normalizedVecFromCuboid.y) && abs(normalizedVecFromCuboid.x) > abs(normalizedVecFromCuboid.z)) {
    collide.dist = (abs(normalizedVecFromCuboid.x) - 1.0) * halfDimensions.x;
  } else if (abs(normalizedVecFromCuboid.y) > abs(normalizedVecFromCuboid.z) && abs(normalizedVecFromCuboid.y) > abs(normalizedVecFromCuboid.z)) {
    collide.dist = (abs(normalizedVecFromCuboid.y) - 1.0) * halfDimensions.y;
  } else {
    collide.dist = (abs(normalizedVecFromCuboid.z) - 1.0) * halfDimensions.z;
  }
  
  if (trueCollision || collide.dist < MIN_STEP_SIZE) {
    collide.collision = true;
    collide.dist = 0.0;
    collide.color = color;
    
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
    } else {
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
  
  float distToSphere = length(vecFromSphere);
  
  if (distToSphere <= radius + MIN_STEP_SIZE) {
    collide.collision = true;
    collide.dist = 0.0;
    collide.normal = normalize(vecFromSphere);
    collide.color = color;
  } else {
    collide.collision = false;
    collide.dist = distToSphere - radius;
  }
  
  return collide;
}

CollisionResult checkCollidePoint(vec3 posPoint, vec3 pos) {
  CollisionResult collide;
  
  vec3 vecFromPoint = -(pos - posPoint);
  
  float distToPoint = length(vecFromPoint);
  
  collide.collision = false;
  collide.dist = distToPoint;
  
  return collide;
}

/* Raymarching light funcs */

LightResult checkLightEverPresent(vec3 color) {
  LightResult lightResult;
  
  lightResult.reached = true;
  lightResult.color = color;
  
  return lightResult;
}

LightResult checkLightPointSource(vec3 posLight, vec3 color, vec3 pos, vec3 normal, float totalDist) {
  LightResult lightResult;
  
  vec3 vecFromLight = -(pos - posLight);
  
  float distToLight = length(vecFromLight);
  
  if (totalDist + distToLight > MAX_RAYTRACE_DIST) {
    lightResult.reached = false;
  } else {
    vec3 currentPos = pos;
    vec3 lightStepDir = normalize(vecFromLight);
    bool blocked = false;
    
    for (int i = 0; i < MAX_STEPS; i++) {
      CollisionResult collisionResult = checkCollision(currentPos);
      
      if (collisionResult.collision) {
        blocked = true;
        break;
      }
      
      float currentStepSize = collisionResult.dist;
      
      if (totalDist + currentStepSize > MAX_RAYTRACE_DIST) {
        blocked = false;
        break;
      }
      
      //lightStepDir = normalize(lightStepDir + getLightBendDir(currentPos) * currentStepSize);
      
      currentPos += lightStepDir * currentStepSize;
    }
    
    if (blocked) {
      lightResult.reached = false;
    } else {
      lightResult.reached = true;
      
      float normalAlignment = -dot(normal, normalize(vecFromLight));
      if (normalAlignment > 0.0) {
        lightResult.color = color * normalAlignment * (1.0 / distToLight / distToLight);
      } else {
        lightResult.color = ZERO_COLOR;
      }
    }
  }
  
  return lightResult;
}

/* Raymarching background light funcs */

vec3 getBGLightPointSource(vec3 posLight, vec3 color, vec3 pos) {
  vec3 vecFromLight = -(pos - posLight);
  
  float distToLight = length(vecFromLight);
  
  float lightIntensity = 1.0 / distToLight / distToLight;
  
  return color * lightIntensity;
}

/* Raymarching light bend calculation funcs */

vec3 getBendDirGlobalGravity(vec3 gravityDir) {
  return gravityDir;
}

vec3 getBendDirBlackHole(vec3 posBlackHole, float strength, vec3 pos) {
  vec3 vecFromBlackHole = -(pos - posBlackHole);
  
  float distToBlackHole = length(vecFromBlackHole);
  
  float bendIntensity = 1.0 / distToBlackHole / distToBlackHole;
  
  return -normalize(vecFromBlackHole) * bendIntensity * strength;
}

/* Collision related funcs */

CollisionResult checkCollision(vec3 pos) {
  CollisionResult collide;
  float minDist = INF;
  
  ObjectColor color;
  
  color.diffuseColor = vec3(1.0, 0.0, 0.0);
  collide = checkCollideCuboid(vec3(-10.0, -1.0, -10.0), vec3(10.0, 0.0, 10.0), color, pos);
  if (collide.collision) return collide;
  else minDist = min(minDist, collide.dist);
  
  color.diffuseColor = vec3(0.0, 1.0, 0.0);
  collide = checkCollideSphere(vec3(1.0, 1.0, 1.0), 0.5, color, pos);
  if (collide.collision) return collide;
  else minDist = min(minDist, collide.dist);
  
  color.diffuseColor = vec3(0.0, 0.0, 0.0);
  collide = checkCollideSphere(vec3(1.0, 1.0, -2.0), 0.01, color, pos);
  if (collide.collision) return collide;
  else minDist = min(minDist, collide.dist);
  
  /*collide = checkCollidePoint(vec3(1.0, 1.0, -2.0), pos);
  if (collide.collision) return collide;
  else minDist = min(minDist, collide.dist);*/
  
  collide = checkCollidePoint(vec3(0.0, 4.0, 0.0), pos);
  if (collide.collision) return collide;
  else minDist = min(minDist, collide.dist);
  
  collide.dist = minDist;
  
  return collide;
}

vec3 raytraceStepToLights(vec3 pos, vec3 normal, float totalDist) {
  vec3 cumulativeLightColor = ZERO_COLOR;
  
  LightResult lightResult;
  
  vec3 color;
  
  color = vec3(0.1, 0.1, 0.1);
  lightResult = checkLightEverPresent(color);
  if (lightResult.reached) cumulativeLightColor += lightResult.color;
  
  color = vec3(1.0, 1.0, 1.0) * 15.0;
  lightResult = checkLightPointSource(vec3(0.0, 4.0, 0.0), color, pos, normal, totalDist);
  if (lightResult.reached) cumulativeLightColor += lightResult.color;
  
  return cumulativeLightColor;
}

vec3 getBackgroundLightColor(vec3 pos) {
  vec3 backgroundColor = ZERO_COLOR;
  
  vec3 color;
  
  color = vec3(1.0, 1.0, 1.0) * 15.0;
  backgroundColor += getBGLightPointSource(vec3(0.0, 4.0, 0.0), color, pos);
  
  return backgroundColor * BACKGROUND_LIGHT_INTENSITY;
}

vec3 getLightBendDir(vec3 pos) {
  vec3 cumulativeBendDir = vec3(0.0, 0.0, 0.0);
  
  cumulativeBendDir += getBendDirGlobalGravity(vec3(0.0, -1.0, 0.0) * 0.01);
  cumulativeBendDir += getBendDirBlackHole(vec3(1.0, 1.0, -2.0), -0.07, pos);
  
  return cumulativeBendDir;
}

/* Main raymarching funcs */

BackstepResults backstepByNormal(vec3 currentPos, float totalDist, vec3 normal) {
  BackstepResults result;
  
  result.pos = currentPos - normal * BACKSTEP_DIST;
  result.totalDist = totalDist - BACKSTEP_DIST;
  
  return result;
}

vec3 getRaytraceColor(vec3 currentPos, vec3 stepDir, float totalDist) {
  vec3 accumulatedBackgroundLight = ZERO_COLOR;
  
  CollisionResult collisionResult = checkCollision(currentPos);
  
  if (collisionResult.collision) {
    return collisionResult.color.diffuseColor * raytraceStepToLights(currentPos, collisionResult.normal, totalDist) + accumulatedBackgroundLight;
  }
  
  for (int i = 0; i < MAX_STEPS; i++) {
    CollisionResult collisionResult = checkCollision(currentPos);
    
    if (collisionResult.collision) {
      BackstepResults results = backstepByNormal(currentPos, totalDist, collisionResult.normal);
      return collisionResult.color.diffuseColor * raytraceStepToLights(results.pos, collisionResult.normal, results.totalDist) + accumulatedBackgroundLight;
    }
    
    float currentStepSize = collisionResult.dist;
    
    if (totalDist + currentStepSize > MAX_RAYTRACE_DIST) {
      return BACKGROUND_COLOR + accumulatedBackgroundLight;
    }
    
    accumulatedBackgroundLight += getBackgroundLightColor(currentPos) * currentStepSize;
    
    stepDir = normalize(stepDir + getLightBendDir(currentPos) * currentStepSize);
    
    currentPos += currentStepSize * stepDir;
    totalDist += currentStepSize;
  }
  
  return BACKGROUND_COLOR + accumulatedBackgroundLight;
}

/* Main loop funcs */

vec3 getColorAtScreenPos(vec2 screenCoord) {
  vec3 currentPos = pos;
  
  StepDirParams stepDirParams = convertRotToStepDir(rot);
  
  vec3 stepDir = stepDirParams.stepDir +
    stepDirParams.rightDir * (screenCoord.x * fovScale) +
    stepDirParams.upDir * (screenCoord.y * fovScale);
  
  stepDir = normalize(stepDir);
  
  return getRaytraceColor(currentPos, stepDir, 0.0);
}

void main() {
  vec2 screenCoord = convertScreenCoordToNormalized(gl_FragCoord.xy);
  
  outColor = vec4(getColorAtScreenPos(screenCoord), 1.0);
}
