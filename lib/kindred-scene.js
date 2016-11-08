var extractNodeView = require('./view-matrix-from-node')
var perspective = require('gl-mat4/perspective')
var KindredNode = require('./kindred-node')
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

module.exports = KindredScene

inherits(KindredScene, KindredNode)
function KindredScene (props) {
  if (!(this instanceof KindredScene)) {
    return new KindredScene(props)
  }

  KindredNode.call(this, props)
  this._projection = null

  var data = this.data
  data.fog = data.fog || false
  if (!('background' in data)) data.background = [0, 0, 0, 1]
  if (data.fog && data.fog.length === 3) data.fog[3] = 1
  if (data.background && data.background.length === 3) data.background[3] = 1
  data.frame = data.frame || 0
}

KindredScene.prototype.loop = function (canvas, runFrame) {
  if (typeof canvas === 'function') {
    runFrame = canvas
    canvas = null
  }

  if (!canvas) {
    var ratio = this.data.pixelRatio || 1
    canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    window.addEventListener('resize', Fit(canvas, null, ratio), false)
  }

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
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

KindredScene.prototype.perspective = function (fov, width, height, near, far) {
  if (!this._projection) this._projection = new Float32Array(16)
  return perspective(this._projection, fov, width / height, near, far)
}

KindredScene.prototype.step = function (props) {
  this._eachPreStep(props)
  this._eachStep(props)
  this._eachPostStep(props)
}

KindredScene.prototype.draw = function (gl, camera) {
  scratchDrawProps.gl = gl
  scratchDrawProps.proj = this._projection || _defaultProjection(gl)
  scratchDrawProps.view = camera.data ? extractNodeView(camera) : camera
  scratchDrawProps.background = this.data.background
  scratchDrawProps.fog = this.data.fog
  scratchDrawProps.eye = eyeVector(scratchDrawProps.view, scratchEye)
  scratchDrawProps.frame = this.data.frame++
  scratchDrawProps.width = gl.canvas.width
  scratchDrawProps.height = gl.canvas.height

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

KindredScene.prototype._eachStep = componentTreeTrigger('step')
KindredScene.prototype._eachPreStep = componentTreeTrigger('preStep')
KindredScene.prototype._eachPostStep = componentTreeTrigger('postStep')
KindredScene.prototype._eachDraw = componentTreeTrigger('draw')
KindredScene.prototype._eachPreDraw = componentTreeTrigger('preDraw')
KindredScene.prototype._eachPostDraw = componentTreeTrigger('postDraw')

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

function _defaultProjection (gl) {
  var c = gl.canvas
  return perspective(scratchProj, Math.PI / 4, c.width / c.height, 0.1, 500)
}
