var SceneNode = require('scene-tree')
var inherits = require('inherits')

module.exports = KindredNode

inherits(KindredNode, SceneNode)
function KindredNode (props) {
  if (!(this instanceof KindredNode)) {
    return new KindredNode(props)
  }

  SceneNode.call(this, props)
  this._componentList = []
  this._componentIndex = {}
  delete this._componentIndex.x // V8 perf hack :')

  this.data.visible = props && 'visible' in props ? props.visible : true
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
