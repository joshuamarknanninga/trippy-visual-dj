// shaders/analog.frag

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_image;
uniform float u_time;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Apply color tint based on intensity
    color.r += sin(u_time) * u_intensity * 0.1;
    color.g += cos(u_time) * u_intensity * 0.1;
    color.b += sin(u_time * 0.5) * u_intensity * 0.1;
    
    gl_FragColor = color;
}
