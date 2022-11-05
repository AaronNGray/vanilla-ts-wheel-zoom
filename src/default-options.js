/** @type {WZoomOptions} */
export const wZoomDefaultOptions = {
    // type content: `image` - only one image, `html` - any HTML content
    type: 'image',
    // for type `image` computed auto (if width set null), for type `html` need set real html content width, else computed auto
    width: null,
    // for type `image` computed auto (if height set null), for type `html` need set real html content height, else computed auto
    height: null,
    // drag scrollable content
    dragScrollable: true,
    // options for the DragScrollable module
    dragScrollableOptions: {},
    // minimum allowed proportion of scale (computed auto if null)
    minScale: null,
    // maximum allowed proportion of scale (1 = 100% content size)
    maxScale: 1,
    // content resizing speed
    speed: 50,
    // zoom to maximum (minimum) size on click
    zoomOnClick: true,
    // zoom to maximum (minimum) size on double click
    zoomOnDblClick: false,
    // if is true, then when the source image changes, the plugin will automatically restart init function (used with type = image)
    // attention: if false, it will work correctly only if the images are of the same size
    watchImageChange: true,
    // smooth extinction
    smoothExtinction: .3,
    // align content `center`, `left`, `top`, `right`, `bottom`
    alignContent: 'center',
    /********************/
    disableWheelZoom: false,
    // option to reverse wheel direction
    reverseWheelDirection: false,
};

/** @type {DragScrollableOptions} */
export const dragScrollableDefaultOptions = {
    // smooth extinction
    smoothExtinction: .25,
    // callback triggered when grabbing an element
    onGrab: null,
    // callback triggered when moving an element
    onMove: null,
    // callback triggered when dropping an element
    onDrop: null,
};

/**
 * @typedef WZoomOptions
 * @type {Object}
 * @property {string} type
 * @property {?number} width
 * @property {?number} height
 * @property {boolean} dragScrollable
 * @property {DragScrollableOptions} dragScrollableOptions
 * @property {?number} minScale
 * @property {number} maxScale
 * @property {number} speed
 * @property {boolean} zoomOnClick
 * @property {boolean} zoomOnDblClick
 * @property {boolean} watchImageChange
 * @property {number} smoothExtinction
 * @property {string} alignContent
 * @property {boolean} disableWheelZoom
 * @property {boolean} reverseWheelDirection
 */

/**
 * @typedef DragScrollableOptions
 * @type {Object}
 * @property {number} smoothExtinction
 * @property {?Function} onGrab
 * @property {?Function} onMove
 * @property {?Function} onDrop
 */
