// Synonym and purpose-to-API data for offline search, ported unchanged from
// mcp-node-motion-canvas (src/config.ts). Used by generate-api-search.js (embedded
// in the index) and search-api.js (query expansion).

export const API_SYNONYMS = {
  // Animation and movement related terms
  'animate': ['animation', 'movement', 'motion', 'transition', 'tween', 'move', 'keyframe', 'interpolate', 'ease'],
  'tween': ['animate', 'animation', 'transition', 'interpolate', 'keyframe', 'ease', 'easing'],
  'transition': ['animate', 'tween', 'change', 'transform', 'morph', 'interpolate'],
  'signal': ['reactive', 'state', 'createSignal', 'value', 'variable', 'property', 'animation', 'keyframe'],
  'sequence': ['timeline', 'animation', 'series', 'order', 'queue'],
  'timeline': ['sequence', 'animation', 'timing', 'schedule', 'order'],

  // Shape related terms
  'circle': ['round', 'ellipse', 'oval', 'disc', 'ball', 'sphere', 'circular'],
  'rect': ['rectangle', 'box', 'square', 'block', 'panel', 'container'],
  'polygon': ['shape', 'path', 'polyline', 'multi-sided', 'triangle', 'pentagon', 'hexagon'],
  'line': ['stroke', 'path', 'ray', 'segment', 'polyline', 'connection', 'curve'],
  'curve': ['bezier', 'spline', 'path', 'arc', 'smooth', 'wavy'],
  'bezier': ['curve', 'spline', 'path', 'handle', 'control point'],
  'shape': ['geometry', 'figure', 'form', 'outline'],
  'path': ['shape', 'stroke', 'curve', 'line', 'svg', 'vector'],

  // Positioning related terms
  'position': ['location', 'coordinates', 'place', 'point', 'transform', 'translate', 'x', 'y'],
  'rotation': ['rotate', 'spin', 'turn', 'angle', 'orientation', 'twist', 'revolve'],
  'scale': ['size', 'resize', 'transform', 'enlarge', 'shrink', 'stretch', 'width', 'height', 'dimensions'],
  'transform': ['position', 'rotation', 'scale', 'matrix', 'move', 'manipulate'],

  // Component related terms
  'node': ['component', 'element', 'object', 'item', 'entity', 'actor'],
  'view': ['scene', 'canvas', 'stage', 'viewport', 'camera', 'frame'],
  'layout': ['arrange', 'position', 'grid', 'stack', 'flex', 'container', 'organize'],
  'grid': ['layout', 'table', 'columns', 'rows', 'cells', 'matrix'],
  'stack': ['layout', 'pile', 'layer', 'z-index', 'order'],

  // Text related terms
  'text': ['txt', 'label', 'caption', 'font', 'typography', 'message', 'string', 'characters'],
  'font': ['typeface', 'text style', 'typography', 'type', 'characters', 'letters'],
  'latex': ['math', 'equation', 'formula', 'tex', 'mathematics', 'katex'],
  'code': ['source', 'programming', 'snippet', 'syntax', 'codeblock', 'script'],

  // Media related terms
  'img': ['image', 'picture', 'photo', 'graphic', 'bitmap', 'raster'],
  'svg': ['vector', 'scalable', 'path', 'shape', 'graphic'],
  'video': ['media', 'movie', 'clip', 'footage', 'film', 'recording'],
  'audio': ['sound', 'music', 'voice', 'noise', 'wave', 'recording'],

  // Color related terms
  'color': ['colour', 'fill', 'stroke', 'paint', 'rgb', 'rgba', 'hex', 'hue', 'shade', 'tint'],
  'gradient': ['color transition', 'fade', 'linear gradient', 'radial gradient', 'blend', 'spectrum'],
  'fill': ['color', 'background', 'solid', 'paint', 'interior'],
  'stroke': ['outline', 'border', 'line', 'edge', 'contour'],

  // Timing related terms
  'duration': ['time', 'length', 'period', 'interval', 'span', 'seconds'],
  'wait': ['delay', 'pause', 'sleep', 'timeout', 'hold', 'idle'],
  'loop': ['repeat', 'cycle', 'iteration', 'circular', 'recur'],

  // Camera related terms
  'camera': ['view', 'perspective', 'viewpoint', 'frame', 'lens', 'viewport'],
  'zoom': ['scale', 'magnify', 'enlarge', 'focus', 'close-up'],
  'pan': ['move', 'scroll', 'shift', 'translate', 'drag'],

  // Interaction related terms
  'click': ['press', 'select', 'choose', 'interact', 'tap'],
  'hover': ['mouseover', 'over', 'focus', 'highlight'],
  'drag': ['move', 'pull', 'slide', 'relocate', 'position'],

  // Common intent mappings
  'create': ['make', 'new', 'add', 'generate', 'instantiate', 'produce', 'build'],
  'change': ['modify', 'update', 'transform', 'set', 'alter', 'adjust', 'tweak'],
  'remove': ['delete', 'destroy', 'clear', 'erase', 'eliminate', 'take out'],
  'show': ['display', 'reveal', 'present', 'exhibit', 'visible', 'appear'],
  'hide': ['conceal', 'invisible', 'hidden', 'disappear', 'vanish', 'remove'],
  'start': ['begin', 'initiate', 'launch', 'trigger', 'commence', 'kick off'],
  'stop': ['end', 'finish', 'halt', 'cease', 'terminate', 'conclude'],
  'reset': ['clear', 'restart', 'revert', 'default', 'initialize', 'zero']
};

export const PURPOSE_TO_API = {
  // Animation intents
  'fade in': ['opacity', 'animate', 'createSignal', 'all', 'Txt', 'Node'],
  'fade out': ['opacity', 'animate', 'createSignal', 'all', 'Txt', 'Node'],
  'slide in': ['position', 'animate', 'createSignal', 'all', 'Vector2', 'x', 'y'],
  'move': ['position', 'animate', 'createSignal', 'all', 'Vector2', 'x', 'y'],
  'rotate': ['rotation', 'animate', 'createSignal', 'all', 'angle', 'degrees', 'radians'],
  'grow': ['scale', 'animate', 'createSignal', 'all', 'size', 'width', 'height'],
  'shrink': ['scale', 'animate', 'createSignal', 'all', 'size', 'width', 'height'],
  'appear': ['opacity', 'animate', 'createSignal', 'scale', 'visible'],
  'disappear': ['opacity', 'animate', 'createSignal', 'scale', 'visible'],
  'bounce': ['position', 'animate', 'createSignal', 'easing.bounce', 'spring'],
  'pulse': ['scale', 'animate', 'createSignal', 'loop', 'easing.elastic'],
  'shake': ['position', 'rotation', 'animate', 'createSignal', 'loop'],
  'morph': ['Path', 'points', 'animate', 'createSignal', 'shape'],
  'wipe': ['clip', 'rect', 'mask', 'animate', 'createSignal'],
  'typewriter': ['Txt', 'text', 'range', 'animate', 'createSignal'],
  'follow path': ['motion', 'position', 'Path', 'points', 'animate', 'createSignal'],

  // Layout intents
  'layout': ['Layout', 'Grid', 'stack', 'position', 'padding', 'margin', 'gap'],
  'grid': ['Grid', 'layout', 'position', 'rows', 'columns', 'cells'],
  'stack': ['stack', 'layout', 'position', 'direction', 'gap'],
  'center': ['position', 'layout', 'center', 'middle', 'align', 'justify'],
  'align': ['position', 'layout', 'center', 'left', 'right', 'top', 'bottom'],
  'distribute': ['layout', 'Grid', 'position', 'spacing', 'gap', 'evenly'],
  'group': ['Node', 'children', 'container', 'parent', 'layout'],

  // Shape drawing intents
  'draw circle': ['Circle', 'Shape', 'Node', 'radius', 'round', 'oval'],
  'draw rectangle': ['Rect', 'Shape', 'Node', 'width', 'height', 'box'],
  'draw shape': ['Shape', 'Circle', 'Rect', 'Polygon', 'Line', 'Node', 'Path'],
  'draw line': ['Line', 'Path', 'Node', 'points', 'stroke', 'lineWidth'],
  'draw curve': ['Curve', 'BezierCurve', 'QuadBezier', 'CubicBezier', 'Spline'],
  'draw polygon': ['Polygon', 'Shape', 'sides', 'points', 'closed'],
  'draw arrow': ['Line', 'Path', 'Arrow', 'points', 'arrowSize'],
  'draw path': ['Path', 'Shape', 'svg', 'points', 'commands'],

  // Text intents
  'show text': ['Txt', 'Text', 'typography', 'font', 'fontSize'],
  'display text': ['Txt', 'Text', 'typography', 'font', 'fontSize'],
  'code': ['Code', 'CodeBlock', 'language', 'syntax', 'programming'],
  'math': ['Latex', 'Math', 'formula', 'equation', 'tex'],
  'label': ['Txt', 'Text', 'typography', 'font', 'fontSize', 'description'],

  // Media intents
  'show image': ['Img', 'Image', 'src', 'picture', 'photo', 'graphic'],
  'play video': ['Video', 'media', 'src', 'clip', 'movie', 'play'],
  'svg': ['SVG', 'vector', 'path', 'graphic', 'scalable'],
  'icon': ['Icon', 'symbol', 'glyph', 'pictogram', 'image'],

  // Color intents
  'color': ['fill', 'stroke', 'color', 'rgba', 'hex', 'hue'],
  'colorize': ['fill', 'stroke', 'color', 'rgba', 'hex', 'hue'],
  'gradient': ['linearGradient', 'radialGradient', 'fill', 'colors', 'stops'],
  'fill': ['fill', 'color', 'background', 'solid', 'style'],
  'stroke': ['stroke', 'lineWidth', 'border', 'outline', 'edge'],

  // Camera intents
  'zoom': ['Camera', 'scale', 'size', 'magnify', 'focus'],
  'pan': ['Camera', 'position', 'move', 'translate', 'shift'],
  'camera move': ['Camera', 'position', 'animate', 'createSignal'],

  // Scene intents
  'background': ['View2D', 'background', 'fill', 'color', 'scene'],
  'scene setup': ['makeScene2D', 'View2D', 'setup', 'initial', 'create'],
  'add to scene': ['view.add', 'add', 'create', 'insert', 'append'],

  // Timing and sequence intents
  'wait': ['waitFor', 'waitUntil', 'delay', 'pause', 'sleep', 'timeout'],
  'sequence': ['sequence', 'all', 'any', 'chain', 'series', 'parallel'],
  'loop': ['loop', 'repeat', 'cycle', 'iteration', 'continuously'],

  // State management intents
  'create state': ['createSignal', 'createRef', 'signal', 'state', 'reactive'],
  'update state': ['set', 'update', 'modify', 'change', 'signal', 'ref'],
  'watch value': ['useTransition', 'createSignal', 'ref', 'observe'],

  // Effects and styles
  'shadow': ['shadow', 'dropShadow', 'blur', 'offset', 'color'],
  'glow': ['glow', 'shadow', 'blur', 'light', 'effect'],
  'blur': ['blur', 'filter', 'effect', 'soften', 'smooth'],
  'mask': ['clip', 'mask', 'clipping', 'shape', 'area']
};
