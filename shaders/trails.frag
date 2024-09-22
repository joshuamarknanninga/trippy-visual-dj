// shaders/trails.frag

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_image;
uniform float u_time;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
    vec4 currentColor = texture2D(u_image, v_texCoord);
    
    // Apply fading effect based on intensity
    vec4 previousColor = texture2D(u_image, v_texCoord + vec2(0.001 * u_intensity, 0.001 * u_intensity));
    vec4 blendedColor = mix(previousColor, currentColor, 0.5);
    
    gl_FragColor = blendedColor;
}
