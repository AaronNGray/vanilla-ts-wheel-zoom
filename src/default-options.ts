/** @type {WZoomOptions} */

export type DefaultOptions = {
    type:string;
    width?:number;
    height?:number;
    minScale?:number;
    maxScale:number;
    speed:number;
    zoomOnClick:boolean;
    zoomOnDblClick:boolean;
    smoothTime:number;
    alignContent:string;
    disableWheelZoom:boolean;
    reverseWheelDirection:boolean;
    dragScrollable:boolean;
    smoothTimeDrag?:number;
    onGrab?:Function;
    onMove?:Function;
    onDrop?:Function;
    rescale?:Function;
    prepare?:Function;
}

export const ZoomDefaultOptions:DefaultOptions = {
    // type content: `image` - only one image, `html` - any HTML content
    type: 'image',
    // for type `image` computed auto (if width set null), for type `html` need set real html content width, else computed auto
    width: undefined,
    // for type `image` computed auto (if height set null), for type `html` need set real html content height, else computed auto
    height: undefined,
    // minimum allowed proportion of scale (computed auto if null)
    minScale: undefined,
    // maximum allowed proportion of scale (1 = 100% content size)
    maxScale: 1,
    // content resizing speed
    speed: 1.1,
    // zoom to maximum (minimum) size on click
    zoomOnClick: true,
    // zoom to maximum (minimum) size on double click
    zoomOnDblClick: false,
    // smooth extinction
    smoothTime: .25,
    // align content `center`, `left`, `top`, `right`, `bottom`
    alignContent: 'center',
    // ******************** //
    disableWheelZoom: false,
    // option to reverse wheel direction
    reverseWheelDirection: false,
    // ******************** //
    // drag scrollable content
    dragScrollable: true
};

/**
 * @typedef WZoomOptions
 * @type {Object}
 * @property {string} type
 * @property {?number} width
 * @property {?number} height
 * @property {?number} minScale
 * @property {number} maxScale
 * @property {number} speed
 * @property {boolean} zoomOnClick
 * @property {boolean} zoomOnDblClick
 * @property {number} smoothTime
 * @property {string} alignContent
 * @property {boolean} disableWheelZoom
 * @property {boolean} reverseWheelDirection
 * @property {boolean} dragScrollable
 * @property {number} smoothTimeDrag
 * @property {?Function} onGrab
 * @property {?Function} onMove
 * @property {?Function} onDrop
 */
