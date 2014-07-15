var jaws = (function(jaws) {


/** 
 * @class Cut out invidual frames (images) from a larger spritesheet-image. "Field Summary" contains options for the SpriteSheet()-constructor.
 *
 * @property {image|image} Image/canvas or asset-string to cut up smaller images from
 * @property {string} orientation How to cut out invidual images from spritesheet, either "right" or "down"
 * @property {array} frame_size  width and height of invidual frames in spritesheet
 * @property {array} frames all single frames cut out from image
 * @property {integer} offset vertical or horizontal offset to start cutting from
 * @property {int} scale_image Scale the sprite sheet by this factor before cutting out the frames. frame_size is automatically re-sized too
 *
*/
jaws.SpriteSheet = function SpriteSheet(options) {
  if( !(this instanceof arguments.callee) ) return new arguments.callee( options );

  jaws.parseOptions(this, options, this.default_options);

  /* Detect framesize from filename, example: droid_10x16.png means each frame is 10px high and 16px wide */
  if(jaws.isString(this.image) && !options.frame_size) {
    var regexp = new RegExp("_(\\d+)x(\\d+)", "g");
    var sizes = regexp.exec(this.image);
    this.frame_size = [];
    this.frame_size[0] = parseInt(sizes[1]);
    this.frame_size[1] = parseInt(sizes[2]);
  }
  
  if(this.scale_image) {
    this.frame_size[0] *= this.scale_image;
    this.frame_size[1] *= this.scale_image;
  }
  
  this.setLayer("main", this.image);
  this.image = this.layers["main"];
  
  this.renderFrames();
};

/**
 * Adds a named layer to the SpriteSheet
 *
 */
jaws.SpriteSheet.prototype.setLayer = function(name, image) {
  var img = jaws.isDrawable(image) ? image : jaws.assets.data[image];
  if(this.scale_image) {
    img = jaws.retroScaleImage(img, this.scale_image);
  }
  
  this.layers[name] = img;
  
  var isOrdered = false;
  for (var lcv = 0; lcv < this.layerOrder.length; lcv++) {
    if (name === this.layerOrder[lcv]) {
      isOrdered = true;
    }
    
    break;
  }
  if (!isOrdered) {
    this.layerOrder.push(name);
  }
  
  this.renderFrames();
};

/**
 * Allows changing the layer order.
 *
 */
jaws.SpriteSheet.prototype.setLayerOrder = function(layerOrder) {
  this.layerOrder = layerOrder;
};

jaws.SpriteSheet.prototype.default_options = {
  image: null,
  orientation: "down",
  frame_size: [32,32],
  offset: 0,
  scale_image: null,
  layers: {},
  layerOrder: ["main"]
};

jaws.SpriteSheet.prototype.renderFrames = function() {
  this.frames = [];
  
  // Cut out tiles from Top -> Bottom
  if(this.orientation == "down") {  
    for(var x=this.offset; x < this.image.width; x += this.frame_size[0]) {
      for(var y=0; y < this.image.height; y += this.frame_size[1]) {
        this.frames.push( cutImage(this.layers, this.layerOrder, x, y, this.frame_size[0], this.frame_size[1]) );
      }
    }
  }
  // Cut out tiles from Left -> Right
  else {
    for(var y=this.offset; y < this.image.height; y += this.frame_size[1]) {
      for(var x=0; x < this.image.width; x += this.frame_size[0]) {
        this.frames.push( cutImage(this.layers, this.layerOrder, x, y, this.frame_size[0], this.frame_size[1]) );
      }
    }
  }
  
  return this.frames;
};

/** @private
 * Cut out a rectangular piece of a an image, returns as canvas-element 
 */
function cutImage(layers, layerOrder, x, y, width, height) {
  var cut = document.createElement("canvas");
  cut.width = width;
  cut.height = height;
  
  var ctx = cut.getContext("2d");
  for (var lcv = 0; lcv < layerOrder.length; lcv++) {
    ctx.drawImage(layers[layerOrder[lcv]], x, y, width, height, 0, 0, cut.width, cut.height);
  }
  return cut;
}

jaws.SpriteSheet.prototype.toString = function() { return "[SpriteSheet " + this.frames.length + " frames]"; };

return jaws;
})(jaws || {});

