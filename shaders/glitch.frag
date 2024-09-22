// shaders/glitch.frag

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_image;
uniform float u_time;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    
    // Apply random horizontal displacement based on intensity and time
    float displacement = sin(uv.y * 10.0 + u_time) * u_intensity * 0.05;
    uv.x += displacement;
    
    // Fetch the pixel color
    vec4 color = texture2D(u_image, uv);
    
    gl_FragColor = color;
}
