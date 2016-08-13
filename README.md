# kindred-node

[![](https://img.shields.io/badge/stability-experimental-ffa100.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)
[![](https://img.shields.io/npm/v/kindred-node.svg?style=flat-square)](https://npmjs.com/package/kindred-node)

Builds on top of [scene-tree](http://github.com/hughsk/scene-tree) to include a component system (see [kindred-component](https://github.com/hughsk/kindred-component)) and game loop.

``` js
var Turntable = require('kindred-turntable-camera')
var Sphere = require('kindred-primitives/sphere')
var Render = require('kindred-renderer')
var Node = require('kindred-node')

var camera = Node().use(Turntable)
var sphere = Sphere()
var scene = Node({
  background: [1, 1, 1]
})

scene.add(camera, sphere)
scene.loop(function (gl, width, height) {
  scene.step()
  scene.tick()
  scene.draw(gl, camera)
})
```

*Note: while this currently builds on top of scene-tree, it may fork into its own implementation for simplicity.*

## Usage

#### `node = KindredNode(props)`

Creates a new node. `props` is an optional object that may be supplied for assigning additional data to a node. This accepts any data you supply, but the following properties take on special behaviour:

* `position`: an `[x, y, z]` array specifying the node's position relative to its parent.
* `scale`: an `[x, y, z]` array specifying the node's scale. You can also pass in a single number.
* `rotation`: an `[x, y, z, w]` array specifying the node's rotation as a quaternion.

``` javascript
var Node = require('scene-tree')

var node = Node({
  position: [0, 1, 0],
  scale: 5,
  rotation: [0, 0, Math.PI / 2]
})
```

#### `node.data`

The data you supplied when creating the node is made accessible here.

``` javascript
var node = Node({
  position: [0, 1, 0],
  color: [1, 0, 1, 1]
})

console.log(node.data.position) // [0, 1, 0]
console.log(node.data.color) // [1, 0, 1, 1]
```

### Wrangling Components

#### `node.use(Component, props)`

#### `node.unuse(Component)`

#### `node.component(Component)`

#### `node.components()`

### Game Loop

#### `node.loop(options, eachFrame)`

#### `node.perspective(fov, width, height, near, far)`

#### `node.step(props)`

#### `node.draw(gl, camera)`

#### `node.tick()`

### 3D Transforms

### `node.setPosition(x, y, z)`

Updates the node's position. Note that this method should be used instead of modifying `node.data.position` directly, as it also triggers an update of the node's matrices.

``` javascript
var node = Node()

node.setPosition(0, 1, 0)
node.setPosition([1, 1, 1])
```

### `node.setRotation(x, y, z)`

Updates the node's rotation quaternion. Again, this should be called instead of modifying `node.data.rotation` directly.

``` javascript
var node = Node()

node.setRotation(0, 0, 0, 1)
node.setRotation([0, 0, 0, 1])
```

### `node.setEuler(x, y, z, order)`

Update the node's rotation quaternion using euler (XYZ) angles. Optionally you can pass in an `order` string to specify the order in which to apply the rotations. This method is included for convenience, but is generally slower than using `node.setRotation` directly.

``` javascript
var node = Node()

node.setRotation(Math.PI, 1, Math.PI * 2)
node.setRotation(Math.PI, 1, Math.PI * 2, 'xyz')
node.setRotation([Math.PI, Math.PI, 1])
node.setRotation([Math.PI, Math.PI, 1], 'zxy')
```

### `node.setScale(x, y, z)`

Updates the node's scale. Again, this should be called instead of modifying `node.data.rotation` directly.

``` javascript
var node = Node()

node.setScale(1, 2, 1)
node.setScale([2, 3, 2])
node.setScale(1.5)
```

### `node.tick()`

Traverses through the node and its descendants, updating their normal and model matrices relative to `node`. You should call this once per frame, generally just before rendering the scene.

### `node.modelMatrix`

4x4 `Float32Array` matrix that contains the transformation required to place the node at its correct position in the scene.

### `node.normalMatrix`

3x3 `Float32Array` matrix that contains the transformation required for the node's normals to correctly light the object given its new position in the scene.

### Scene Hierarchy

### `node.add(children...)`

Adds one or more `children` to a given `node`. Accepts a single node, an array of nodes, or a mixture of both across multiple arguments.

``` javascript
var root = Node()

root.add(Node())
root.add([Node(), Node(), Node()])
root.add(Node(), Node(), Node())
```

### `node.addOne(child)`

`node.add()` without any of the sugar: adds a single `child` node.

``` javascript
var root = Node()

root.addOne(Node())
```

### `node.remove(child)`

Removes `child` from `node`, if applicable.

``` javascript
var root = Node()
var child = Node()

root.add(child)
root.remove(child)
```

### `node.clear()`

Removes any children attached to the given `node`.

``` javascript
var root = Node()

root.add(Node())
root.add(Node())
console.log(root.children.length) // 2
root.clear()
console.log(root.children.length) // 0
```

### `node.each(visitor)`

Calls the `visitor` function on each descendent node in the tree (depth first,
pre-order). Note that `visitor` is not called on `node` itself.

``` javascript
var root = Node({ id: 0 }).add(
  Node({ id: 1 }),
  Node({ id: 2 }),
  Node({ id: 3 }).add(
    Node({ id: 4 }),
    Node({ id: 5 })
  ),
)

root.each(function visitor (node) {
  console.log(node.data.id)
})

// 1
// 2
// 3
// 4
// 5
```

### `node.findup(visitor)`

Walks up the tree from `node` until hitting the root element, calling `visitor` on each node along the way.

``` javascript
var child = Node({ id: 0 })
var root = Node({ id: 1 })

root.add(
  Node({ id: 2 }).add(Node({ id: 3 })),
  Node({ id: 4 }).add(child),
)

child.findup(function visitor (node) {
  console.log(node.data.id)
})

// 4
// 1
```

### `node.flat(output)`

Returns a flat array of all the child nodes in a tree.

``` javascript
var root = Node({ id: 0 }).add(
  Node({ id: 1 }),
  Node({ id: 2 }),
  Node({ id: 3 }).add(
    Node({ id: 4 }),
    Node({ id: 5 })
  ),
)

var ids = root.flat().map(d => d.data.id)
console.log(ids) // [0, 1, 2, 3, 4, 5]
```

### `node.size()`

Gets the total number of descendent nodes of `node`, not including `node` itself:

``` javascript
var root = Node({ id: 0 }).add(
  Node({ id: 1 }),
  Node({ id: 2 }),
  Node({ id: 3 }).add(
    Node({ id: 4 }),
    Node({ id: 5 })
  ),
)

console.log(root.size()) // 5
```

### `getNodeList = node.list([sortFunction])`

Returns a function that sorts descendent nodes only as required using `sortFunction`, returning a flat array of the results. This is the preferred way to iterate over the elements in the tree when you're ready to render them.

``` javascript
var root = Node()
var getNodeList = root.list()

root.add(Node(), Node(), Node())

function render () {
  var nodes = getNodeList()

  for (var i = 0; i < nodes.length; i++) {
    draw(nodes[i])
  }
}
```

### `node.resetLists()`

Call this on a node whenever something has occurred that would change its sort order, e.g. its position has been changed. This will reset any existing lists to sort their contents again, provided the root node is an ancestor of `node`.

## License

MIT. See [LICENSE.md](LICENSE.md) for details.
