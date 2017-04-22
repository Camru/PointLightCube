let VSHADER_SOURCE = 
`attribute vec4 a_Position;
 attribute vec4 a_Color;
 attribute vec4 a_Normal;
 uniform mat4 u_MvpMatrix;
 uniform mat4 u_ModelMatrix;   
 uniform mat4 u_NormalMatrix;  
 
 varying vec4 v_Color;
 varying vec3 v_Normal;
 varying vec3 v_Position;
 void main() {
    gl_Position = u_MvpMatrix * a_Position; 
    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
    v_Color = a_Color; 
 }`;

let FSHADER_SOURCE =
`precision mediump float;
 uniform vec3 u_LightColor;
 uniform vec3 u_LightPosition; 
 uniform vec3 u_AmbientColor; 
 varying vec4 v_Color;
 varying vec3 v_Normal;
 varying vec3 v_Position;
 void main() {
   vec3 normal = normalize(v_Normal);
   vec3 lightDirection = normalize(u_LightPosition - v_Position);
   float nDotL = max(dot(lightDirection, normal), 0.0);
   vec3 ambient = u_AmbientColor * vec3(v_Color);
   vec3 diffuse = u_LightColor * vec3(v_Color) * nDotL;
   gl_FragColor = vec4(diffuse + ambient, v_Color.a); 
 }`;

function main() {
  const canvas = document.getElementById('webgl');
  let gl = getWebGLContext(canvas);

  // Init and compile shaders
  if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('failed to get rendering context');
    return;
  }

  // Set positons of vertices
  var n = initVertextBuffers(gl); 
  if (n < 0) {
    console.log('failed to set position of vertices');
    return;
  }

  gl.clearColor(0.11,	0.07,	0.17, 1.0);
  gl.enable(gl.DEPTH_TEST);

  let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  let u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');

  if (!u_MvpMatrix || !u_ModelMatrix || !u_NormalMatrix || 
      !u_LightColor || !u_LightPosition || !u_AmbientColor) {
        console.log('failed to get location');
        return;
    }

  // set light color and direction
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
  gl.uniform3f(u_AmbientColor, 0.2, 0.2, 0.2);

  const rotateSpeed = 50;
  let rotateAngle = 90;
  let then = Date.now();
  const animate = (now) => {
    if (!now) now = Date.now(); 
    now = now / 1000; // convert to seconds
    let deltaTime = now - then; 
    then = now;

    rotateAngle += deltaTime * rotateSpeed;
    rotateAngle %= 360; 

    const FOV = 30;
    const ASPECT = canvas.width/canvas.height;
    const NEAR = 1;
    const FAR = 100;

    let modelMatrix = new Matrix4();
    modelMatrix.setRotate(rotateAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    let mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(FOV, ASPECT, NEAR, FAR); 
    mvpMatrix.lookAt(6, 6, 20, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0); 

    requestAnimationFrame(animate);
  };
  animate();
};

// =============================================================================

function initVertextBuffers (gl) {

  var vertices = new Float32Array([
     2.0, 2.0, 2.0,  -2.0, 2.0, 2.0,  -2.0,-2.0, 2.0,   2.0,-2.0, 2.0, // v0-v1-v2-v3 front
     2.0, 2.0, 2.0,   2.0,-2.0, 2.0,   2.0,-2.0,-2.0,   2.0, 2.0,-2.0, // v0-v3-v4-v5 right
     2.0, 2.0, 2.0,   2.0, 2.0,-2.0,  -2.0, 2.0,-2.0,  -2.0, 2.0, 2.0, // v0-v5-v6-v1 up
    -2.0, 2.0, 2.0,  -2.0, 2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0,-2.0, 2.0, // v1-v6-v7-v2 left
    -2.0,-2.0,-2.0,   2.0,-2.0,-2.0,   2.0,-2.0, 2.0,  -2.0,-2.0, 2.0, // v7-v4-v3-v2 down
     2.0,-2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0, 2.0,-2.0,   2.0, 2.0,-2.0  // v4-v7-v6-v5 back
  ]);
  // Colors
  var colors = new Float32Array([
   0, .70, 1,  0, .70, 1,  0, .70, 1, 0, .70, 1,     // v0-v1-v2-v3 front
   0, .70, 1,  0, .70, 1,  0, .70, 1, 0, .70, 1,     // v0-v3-v4-v5 right
   0, .70, 1,  0, .70, 1,  0, .70, 1, 0, .70, 1,     // v0-v5-v6-v1 up
   0, .70, 1,  0, .70, 1,  0, .70, 1, 0, .70, 1,     // v1-v6-v7-v2 left
   0, .70, 1,  0, .70, 1,  0, .70, 1, 0, .70, 1,     // v7-v4-v3-v2 down
   0, .70, 1,  0, .70, 1,  0, .70, 1, 0, .70, 1 // v4-v7-v6-v5 back
 ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);

  const n = indices.length; 

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  let indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return n;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}
