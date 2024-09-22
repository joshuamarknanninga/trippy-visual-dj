// shaders/strobe.frag

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_image;
uniform float u_time;
uniform float u_intensity;
uniform vec3 u_strobeColor;
uniform bool u_showStrobe;

varying vec2 v_texCoord;

void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    if(u_showStrobe){
        color = vec4(u_strobeColor, 1.0);
    }
    
    gl_FragColor = color;
}
