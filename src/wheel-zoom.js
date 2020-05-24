import DragScrollable from './drag-scrollable';
import { getElementCoordinates, extendObject, on } from './toolkit';

/**
 * @class JcWheelZoom
 * @param {string} selector
 * @param {Object} options
 * @constructor
 */
function JcWheelZoom(selector, options = {}) {
    this._init = this._init.bind(this);
    this._prepare = this._prepare.bind(this);
    this._rescale = this._rescale.bind(this);

    const defaults = {
        // drag scrollable image
        dragScrollable: true,
        // options for the DragScrollable module
        dragScrollableOptions: {},
        // maximum allowed proportion of scale
        maxScale: 1,
        // image resizing speed
        speed: 10
    };

    this.image = document.querySelector(selector);
    this.options = extendObject(defaults, options);

    if (this.image !== null) {
        // for window take just the parent
        this.window = this.image.parentNode;

        // if the image has already been loaded
        if (this.image.complete) {
            this._init();
        } else {
            // if suddenly the image has not loaded yet, then wait
            this.image.onload = this._init;
        }
    }
}

JcWheelZoom.prototype = {
    constructor: JcWheelZoom,
    image: null,
    container: null,
    window: null,
    original: { image: {}, window: {} },
    options: null,
    correctX: null,
    correctY: null,
    /**
     * @private
     */
    _init: function () {
        // original image sizes
        this.original.image = {
            width: this.image.offsetWidth,
            height: this.image.offsetHeight
        };

        // will move this container, and will center the image in it
        this.container = document.createElement('div');

        this.window.appendChild(this.container);
        this.container.appendChild(this.image);

        this._prepare();

        if (this.options.dragScrollable === true) {
            new DragScrollable(this.window, this.options.dragScrollableOptions);
        }

        on(this.window, 'wheel', this._rescale);
        on(window, 'resize', this._rescale);
    },
    /**
     * @private
     */
    _prepare: function () {
        // original window sizes
        this.original.window = {
            width: this.window.offsetWidth,
            height: this.window.offsetHeight
        };

        // minimum allowed proportion of scale
        const minScale = Math.min(this.original.window.width / this.original.image.width, this.original.window.height / this.original.image.height);

        // calculate margin-left and margin-top to center the image
        this.correctX = Math.max(0, (this.original.window.width - this.original.image.width * minScale) / 2);
        this.correctY = Math.max(0, (this.original.window.height - this.original.image.height * minScale) / 2);

        // set new image dimensions to fit it into the container
        this.image.width = this.original.image.width * minScale;
        this.image.height = this.original.image.height * minScale;

        // center the image
        this.image.style.marginLeft = `${ this.correctX }px`;
        this.image.style.marginTop = `${ this.correctY }px`;

        this.container.style.width = `${ this.image.width + (this.correctX * 2) }px`;
        this.container.style.height = `${ this.image.height + (this.correctY * 2) }px`;

        if (typeof this.options.prepare === 'function') {
            this.options.prepare(minScale, this.correctX, this.correctY);
        }
    },
    /**
     * @private
     */
    _rescale: function (event) {
        event.preventDefault();

        const delta = event.deltaY < 0 ? 1 : -1;

        // the size of the image at the moment
        const imageCurrentWidth = this.image.width;
        const imageCurrentHeight = this.image.height;

        // current proportion of scale
        const scale = imageCurrentWidth / this.original.image.width;
        // minimum allowed proportion of scale
        const minScale = Math.min(this.original.window.width / this.original.image.width, this.original.window.height / this.original.image.height);
        // new allowed proportion of scale
        let newScale = scale + (delta / this.options.speed);

        newScale = (newScale < minScale) ? minScale : (newScale > this.options.maxScale ? this.options.maxScale : newScale);

        // scroll along the X axis before resizing
        const scrollLeftBeforeRescale = this.window.scrollLeft;
        // scroll along the Y axis before resizing
        const scrollTopBeforeRescale = this.window.scrollTop;

        // new image sizes that will be set
        const imageNewWidth = this.image.width = this.original.image.width * newScale;
        const imageNewHeight = this.image.height = this.original.image.height * newScale;

        const containerNewWidth = imageNewWidth + (this.correctX * 2);
        const containerNewHeight = imageNewHeight + (this.correctY * 2);

        this.container.style.width = `${ containerNewWidth }px`;
        this.container.style.height = `${ containerNewHeight }px`;

        if (typeof this.options.rescale === 'function') {
            this.options.rescale(newScale, this.correctX, this.correctY, minScale);
        }

        // scroll on the X axis after resized
        const scrollLeftAfterRescale = this.window.scrollLeft;
        // scroll on the Y axis after resized
        const scrollTopAfterRescale = this.window.scrollTop;

        const windowCoords = getElementCoordinates(this.window);

        const x = Math.round(event.pageX - windowCoords.left + this.window.scrollLeft - this.correctX);
        const newX = Math.round(imageNewWidth * x / imageCurrentWidth);
        const shiftX = newX - x;

        this.window.scrollLeft += shiftX + (scrollLeftBeforeRescale - scrollLeftAfterRescale);

        const y = Math.round(event.pageY - windowCoords.top + this.window.scrollTop - this.correctY);
        const newY = Math.round(imageNewHeight * y / imageCurrentHeight);
        const shiftY = newY - y;

        this.window.scrollTop += shiftY + (scrollTopBeforeRescale - scrollTopAfterRescale);
    },
    /**
     * @public
     */
    prepare: function () {
        this._prepare();
    },
    /**
     * @public
     */
    zoomUp: function () {
        const windowCoords = getElementCoordinates(this.window);

        const event = new Event('wheel');

        event.deltaY = -1;
        event.pageX = windowCoords.left + (this.original.window.width / 2);
        event.pageY = windowCoords.top + (this.original.window.height / 2);

        this._rescale(event);
    },
    /**
     * @public
     */
    zoomDown: function () {
        const windowCoords = getElementCoordinates(this.window);

        const event = new Event('wheel');

        event.deltaY = 1;
        event.pageX = windowCoords.left + (this.original.window.width / 2);
        event.pageY = windowCoords.top + (this.original.window.height / 2);

        this._rescale(event);
    }
};

/**
 * Create JcWheelZoom instance
 * @param {string} selector
 * @param {Object} [options]
 * @returns {JcWheelZoom}
 */
JcWheelZoom.create = function (selector, options) {
    return new JcWheelZoom(selector, options);
};

export default JcWheelZoom;
