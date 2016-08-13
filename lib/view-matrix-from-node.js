var rotateVec3 = require('gl-vec3/transformQuat')
var multiply = require('gl-mat4/multiply')
var invert = require('gl-mat4/invert')
var negate = require('gl-vec3/negate')
var lookAt = require('gl-mat4/lookAt')

var scratchParent = new Float32Array(16)
var scratchView = new Float32Array(16)
var scratchDir = new Float32Array(3)
var scratchFwd = new Float32Array(3)
var scratchUp = new Float32Array(3)

module.exports = extractNodeView

function extractNodeView (node) {
  scratchFwd[0] = 0
  scratchFwd[1] = 0
  scratchFwd[2] = 1
  scratchUp[0] = 0
  scratchUp[1] = 1
  scratchUp[2] = 0
  negate(scratchDir, node.data.position)
  rotateVec3(scratchFwd, scratchFwd, node.data.rotation)
  rotateVec3(scratchUp, scratchUp, node.data.rotation)
  scratchDir[0] += scratchFwd[0]
  scratchDir[1] += scratchFwd[1]
  scratchDir[2] += scratchFwd[2]
  lookAt(scratchView, node.data.position, scratchDir, scratchUp)

  if (node.parent) {
    multiply(scratchView, scratchView, invert(scratchParent, node.parent.modelMatrix))
  }

  return scratchView
}
