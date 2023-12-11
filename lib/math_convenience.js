// Constants
let pi = Math.PI;
let e = Math.E;

// Basic functions
let sqrt = Math.sqrt;
let sq = x => x * x;

// Basic trig
let sin = Math.sin;
let cos = Math.cos;
let tan = Math.tan;
let csc = x => 1 / sin(x);
let sec = x => 1 / cos(x);
let cot = x => 1 / tan(x);

// Inverse trig
let asin = Math.asin;
let acos = Math.acos;
let atan = Math.atan;
let acsc = x => asin(1 / x);
let asec = x => acos(1 / x);
let acot = x => atan(1 / x);

// Degrees <=> radians
let deg = x => x / pi * 180;
let rad = x => x / 180 * pi;

// Basic degrees trig
let sind = x => sin(rad(x));
let cosd = x => cos(rad(x));
let tand = x => tan(rad(x));
let cscd = x => csc(rad(x));
let secd = x => sec(rad(x));
let cotd = x => cot(rad(x));

// Inverse degrees trig
let asind = x => deg(asin(x));
let acosd = x => deg(acos(x));
let atand = x => deg(atan(x));
let acscd = x => deg(acsc(x));
let asecd = x => deg(asec(x));
let acotd = x => deg(acot(x));
