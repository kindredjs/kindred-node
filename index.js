var extractNodeView = require('./lib/view-matrix-from-node')
var perspective = require('gl-mat4/perspective')
var SceneNode = require('scene-tree')
var eyeVector = require('eye-vector')
var inherits = require('inherits')
var Fit = require('canvas-fit')

var scratchProj = new Float32Array(16)
var scratchEye = new Float32Array(3)
var scratchDrawProps = {
  background: null,
  proj: null,
  view: null,
  eye: null,
  fog: null,
  gl: null
}

inherits(KindredNode, SceneNode)
function KindredNode (props) {
  if (!(this instanceof KindredNode)) {
    return new KindredNode(props)
  }

  SceneNode.call(this)
  this._projection = null
  this._componentList = []
  this._componentIndex = {}
  delete this._componentIndex.x // V8 perf hack :')
}

KindredNode.prototype.use = function (Component, props) {
  var component = new Component()
  var name = component._name
  if (this._componentIndex[name]) {
    throw new Error('You may only include one component of each type per node')
  }

  this._componentIndex[name] = component
  this._componentList.push(component)
  component.init(this, props)

  return this
}

KindredNode.prototype.unuse = function (name) {
  name = name && name._name ? name._name : name
  throw new Error('TODO: unuse()')
}

KindredNode.prototype.component = function (name) {
  name = name && name._name ? name._name : name
  return this._componentIndex[name]
}

KindredNode.prototype.components = function () {
  return this._componentList
}

KindredNode.prototype.loop = function (canvas, runFrame) {
  if (typeof canvas === 'function') {
    runFrame = canvas
    canvas = null
  }

  this._initLoopData()

  if (!canvas) {
    canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    window.addEventListener('resize', Fit(canvas), false)
  }

  var gl = canvas.getContext('webgl')
  var looping = true

  window.requestAnimationFrame(loop)
  function loop () {
    if (!looping) return

    var width = canvas.width
    var height = canvas.height

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    runFrame(gl, width, height)
    window.requestAnimationFrame(loop)
  }

  return function cancel () {
    looping = false
  }
}

KindredNode.prototype._initLoopData = function () {
  var data = this.data
  data.fog = data.fog || false
  if (!('background' in data)) data.background = [0, 0, 0, 1]
  if (data.fog && data.fog.length === 3) data.fog[3] = 1
  if (data.background && data.background.length === 3) data.background[3] = 1
  data.frame = data.frame || 0
}

KindredNode.prototype.perspective = function (fov, width, height, near, far) {
  if (!this._projection) this._projection = new Float32Array(16)
  return perspective(this._projection, fov, width / height, near, far)
}

KindredNode.prototype._defaultProjection = function (gl) {
  var c = gl.canvas
  return perspective(scratchProj, Math.PI / 4, c.width / c.height, 0.1, 500)
}

KindredNode.prototype.step = function (props) {
  this._eachPreStep(props)
  this._eachStep(props)
  this._eachPostStep(props)
}

KindredNode.prototype.draw = function (gl, camera) {
  scratchDrawProps.gl = gl
  scratchDrawProps.proj = this._projection || this._defaultProjection(gl)
  scratchDrawProps.view = camera.data ? extractNodeView(camera) : camera
  scratchDrawProps.background = this.data.background
  scratchDrawProps.fog = this.data.fog
  scratchDrawProps.eye = eyeVector(scratchDrawProps.view, scratchEye)
  scratchDrawProps.frame = this.data.frame++

  var background = this.data.background
  if (background) {
    gl.clearColor(background[0], background[1], background[2], background[3])
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  this._eachPreDraw(scratchDrawProps)
  this._eachDraw(scratchDrawProps)
  this._eachPostDraw(scratchDrawProps)

  scratchDrawProps.gl = null
}

KindredNode.prototype._eachStep = componentTreeTrigger('step')
KindredNode.prototype._eachPreStep = componentTreeTrigger('preStep')
KindredNode.prototype._eachPostStep = componentTreeTrigger('postStep')
KindredNode.prototype._eachDraw = componentTreeTrigger('draw')
KindredNode.prototype._eachPreDraw = componentTreeTrigger('preDraw')
KindredNode.prototype._eachPostDraw = componentTreeTrigger('postDraw')

function componentTreeTrigger (name) {
  var args

  return function (_args) {
    args = _args
    forEach(this)
    this.each(forEach)
  }

  function forEach (node) {
    var list = node._componentList
    for (var i = 0; i < list.length; i++) {
      var component = list[i]
      if (component[name]) component[name](args)
    }
  }
}

module.exports = function (props) {
  return new KindredNode(props)
}
