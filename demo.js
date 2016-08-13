const canvas = document.body.appendChild(document.createElement('canvas'))
const gl = canvas.getContext('webgl')

const perspective = require('gl-mat4/perspective')
const Component = require('kindred-component')
const Camera = require('canvas-orbit-camera')
const Geometry = require('kindred-geometry')
const Shader = require('kindred-shader')
const pressed = require('key-pressed')
const icosphere = require('icosphere')
const Fit = require('canvas-fit')
const bunny = require('bunny')
const Node = require('./')

var prevShader = null

class RenderComponent extends Component('render') {
  init (node, props) {
    this.node = node
    this.geometry = props.geometry
    this.shader = props.shader
  }

  stop () {
    this.geometry = null
    this.shader = null
    this.node = null
  }

  draw (props) {
    var gl = props.gl
    if (this.shader !== prevShader) {
      this.shader.bind(gl)
      this.shader.uniforms.uProj = props.proj
      this.shader.uniforms.uView = props.view
      prevShader = this.shader
    }
    this.shader.uniforms.uModel = this.node.modelMatrix
    this.geometry.bind(gl, this.shader.attributes)
    this.geometry.draw(gl)
  }
}

class ControlComponent extends Component('control') {
  init (node, props) {
    this.node = node
    this.speed = props && ('speed' in props) ? props.speed : 1
  }

  stop () {
    this.node = null
  }

  step () {
    var offsetX = pressed('<right>') - pressed('<left>')
    var offsetY = pressed('<down>') - pressed('<up>')
    this.node.setPosition(
      this.node.data.position[0] + offsetX * this.speed,
      this.node.data.position[1],
      this.node.data.position[2] + offsetY * this.speed
    )
  }
}

class FollowComponent extends Component('follow') {
  init (node, props) {
    this.camera = props.camera
    this.node = node
  }

  step () {
    this.camera.center[0] += (this.node.data.position[0] - this.camera.center[0]) * 0.1
    this.camera.center[1] += (this.node.data.position[1] - this.camera.center[1]) * 0.1
    this.camera.center[2] += (this.node.data.position[2] - this.camera.center[2]) * 0.1
  }
}

const camera = Camera(canvas)
const view = new Float32Array(16)
const proj = new Float32Array(16)
const root = Node()
const node = Node({ scale: 0.25 })

const normalShader = Shader`
  uniform mat4 uProj;
  uniform mat4 uView;
  uniform mat4 uModel;

  attribute vec3 position;
  attribute vec3 normal;

  varying vec3 vNorm;

  void vert() {
    vNorm = normalize(normal);
    gl_Position = uProj * uView * uModel * vec4(position, 1);
  }

  void frag() {
    gl_FragColor = vec4(vNorm * 0.5 + 0.5, 1);
  }
`

root.add(node)
node.use(ControlComponent, {
  speed: 0.25
}).use(RenderComponent, {
  geometry: Geometry(bunny).attrFaceNormals('normal'),
  shader: normalShader
}).use(FollowComponent, {
  camera: camera
})

root.add(Node({
  scale: 2
}).use(RenderComponent, {
  geometry: Geometry(icosphere(2)).attrFaceNormals('normal'),
  shader: normalShader
}))

const state = {
  gl: gl,
  proj: proj,
  view: view
}

render()
function render () {
  const width = canvas.width
  const height = canvas.height
  gl.viewport(0, 0, width, height)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  camera.view(view)
  camera.tick()
  perspective(proj, Math.PI / 4, width / height, 0.1, 100)
  root._eachStep(state)
  root.tick()
  root._eachDraw(state)
  prevShader = null

  window.requestAnimationFrame(render)
}

window.addEventListener('resize', Fit(canvas), false)
