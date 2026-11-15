import { forwardRef, useMemo } from 'react'
import { Effect } from 'postprocessing'
import { Uniform } from 'three'

// Hand-painted look for the whole frame:
// 1) Kuwahara filter: averages each pixel over the calmest of four neighbourhoods,
//    which turns hard 3D edges and gradients into flat brush strokes (like painted backgrounds).
// 2) Split toning: shadows lean blue-violet, highlights lean warm amber (the anime-film palette).
// 3) Faint paper grain.
const fragment = /* glsl */ `
uniform float radius;
uniform float strength;

vec3 quadrant(vec2 uv, vec2 dir, out float variance) {
  vec3 sum = vec3(0.0);
  vec3 sq = vec3(0.0);
  float n = 0.0;
  for (int x = 0; x <= 4; x++) {
    for (int y = 0; y <= 4; y++) {
      if (float(x) > radius || float(y) > radius) continue;
      vec2 o = vec2(float(x), float(y)) * dir * texelSize;
      vec3 c = texture2D(inputBuffer, uv + o).rgb;
      sum += c;
      sq += c * c;
      n += 1.0;
    }
  }
  vec3 mean = sum / n;
  vec3 v = abs(sq / n - mean * mean);
  variance = v.r + v.g + v.b;
  return mean;
}

float paper(vec2 uv) {
  return fract(sin(dot(floor(uv * resolution * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float v0, v1, v2, v3;
  vec3 m0 = quadrant(uv, vec2(-1.0, -1.0), v0);
  vec3 m1 = quadrant(uv, vec2( 1.0, -1.0), v1);
  vec3 m2 = quadrant(uv, vec2(-1.0,  1.0), v2);
  vec3 m3 = quadrant(uv, vec2( 1.0,  1.0), v3);
  vec3 col = m0; float best = v0;
  if (v1 < best) { best = v1; col = m1; }
  if (v2 < best) { best = v2; col = m2; }
  if (v3 < best) { best = v3; col = m3; }
  col = mix(inputColor.rgb, col, strength);

  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 shadowTint = vec3(0.86, 0.88, 1.12);
  vec3 lightTint = vec3(1.1, 1.0, 0.86);
  col *= mix(shadowTint, lightTint, smoothstep(0.08, 0.6, l));
  // lift the blacks slightly toward deep blue so night never goes pure black
  col = max(col, vec3(0.025, 0.03, 0.06));
  outputColor = vec4(col, inputColor.a);
}
`

class PaintEffect extends Effect {
  constructor({ radius = 3, strength = 1 } = {}) {
    super('PaintEffect', fragment, {
      uniforms: new Map([
        ['radius', new Uniform(radius)],
        ['strength', new Uniform(strength)],
      ]),
    })
  }
}

export const Paint = forwardRef(function Paint({ radius = 3, strength = 1 }, ref) {
  const effect = useMemo(() => new PaintEffect({ radius, strength }), [radius, strength])
  return <primitive ref={ref} object={effect} dispose={null} />
})
