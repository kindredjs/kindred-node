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
  this._eachSorter = this.list()

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
  this.data.frame++

  var nodes = this._eachSorter()
  this._eachPreStep(nodes, props)
  this._eachStep(nodes, props)
  this._eachPostStep(nodes, props)
  this.tick()
}

KindredScene.prototype.getFrameProps = function (camera, width, height) {
  scratchDrawProps.proj = this._projection || _defaultProjection(width, height)
  scratchDrawProps.view = camera.data ? extractNodeView(camera) : camera
  scratchDrawProps.background = this.data.background
  scratchDrawProps.fog = this.data.fog
  scratchDrawProps.eye = eyeVector(scratchDrawProps.view, scratchEye)
  scratchDrawProps.frame = this.data.frame
  scratchDrawProps.width = width
  scratchDrawProps.height = height
  return scratchDrawProps
}

KindredScene.prototype._eachStep = componentTreeTrigger('step')
KindredScene.prototype._eachPreStep = componentTreeTrigger('preStep')
KindredScene.prototype._eachPostStep = componentTreeTrigger('postStep')

function componentTreeTrigger (triggerFunctionName) {
  return function triggerAllNodes (nodes, args) {
    triggerNode(this, args)
    for (var i = 0; i < nodes.length; i++) {
      triggerNode(nodes[i], args)
    }
  }

  function triggerNode (node, args) {
    var list = node._componentList
    for (var i = 0; i < list.length; i++) {
      var component = list[i]
      if (component[triggerFunctionName]) {
        component[triggerFunctionName](args)
      }
    }
  }
}

function _defaultProjection (width, height) {
  return perspective(scratchProj, Math.PI / 4, width / height, 0.1, 500)
}
