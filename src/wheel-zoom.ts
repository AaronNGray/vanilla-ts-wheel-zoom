import {
    getElementPosition,
    getPageScrollLeft,
    getPageScrollTop,
    on,
    off,
    eventClientX,
    eventClientY,
    isTouch,
    transition,
    transform,
    Coordinates
} from './toolkit';
import {
    calculateAlignPoint,
    calculateContentMaxShift,
    calculateContentShift,
    calculateCorrectPoint,
    calculateViewportCenter,
    Viewport
} from './calculator';

import AbstractObserver from './observers/AbstractObserver';
import DragScrollableObserver, { EVENT_DROP, EVENT_GRAB, EVENT_MOVE } from './observers/DragScrollableObserver';
import InteractionObserver, { EVENT_CLICK, EVENT_DBLCLICK, EVENT_WHEEL } from './observers/InteractionObserver';
import PinchToZoomObserver, { EVENT_PINCH_TO_ZOOM } from './observers/PinchToZoomObserver';

import { ZoomDefaultOptions, DefaultOptions } from './default-options.js';

class Content {
    constructor(selectorOrHTMLElement: string|HTMLImageElement) {
        if (typeof selectorOrHTMLElement === 'string') {
            this.$element = <HTMLImageElement> document.querySelector(selectorOrHTMLElement);

            if (!this.$element) {
                throw `Zoom: Element with selector \`${ selectorOrHTMLElement }\` not found`;
            }
        } else if (selectorOrHTMLElement instanceof HTMLElement) {
            this.$element = selectorOrHTMLElement;
        } else {
            throw `Zoom: \`selectorOrHTMLElement\` must be selector or HTMLElement, and not ${ {}.toString.call(selectorOrHTMLElement) }`;
        }
    }

    getParent():HTMLElement {
        return <HTMLElement> this.$element.parentElement;
    }

    $element:HTMLImageElement;
    currentLeft:number = 0;
    currentTop:number = 0;
    currentWidth:number = 0;
    currentHeight:number = 0;
    currentScale:number = 0;
    originalHeight:number = 0;
    originalWidth:number = 0;
    originalScale:number = 0;
    alignPointX:number = 0;
    alignPointY:number = 0;
    correctX:number = 0;
    correctY:number = 0;
    minScale:number = 0;
    maxScale:number = 0;
};

/**
 * @class WZoom
 * @param {string|HTMLElement} selectorOrHTMLElement
 * @param {WZoomOptions} options
 * @constructor
 */

export default class WZoom {
    constructor(selectorOrHTMLElement: string|HTMLImageElement, options: Partial<DefaultOptions> = {}) {
        this.content = new Content(selectorOrHTMLElement);

        this.init = this.init.bind(this);
        this.prepare = this.prepare.bind(this);
        this.computeScale = this.computeScale.bind(this);
//        this.computePosition = this.computePosition.bind(this);
        this.transform = this.transform.bind(this);

        /** @type {WZoomViewport} */
        this.viewport = new Viewport(this.content.getParent());

        /** @type {WZoomOptions} */
        this.options = optionsConstructor(options, ZoomDefaultOptions);

        // check if we're using a touch screen
        this.isTouch = isTouch();
        this.direction = 1;
        /** @type {AbstractObserver[]} */
        this.observers = [];

        if (this.options.type === 'image') {
            // if the `image` has already been loaded
            if (this.content.$element.complete) {
                this.init();
            } else {
                on(this.content.$element, 'load', this.init, { once: true });
            }
        } else {
            this.init();
        }
    }

    content:Content;
    viewport:Viewport;
    options:DefaultOptions;
    observers:AbstractObserver[];
    direction:number; // !!!
    isTouch:boolean;

    private init() {
        const { viewport, content, options, observers } = this;

        this.prepare();
        this.destroyObservers();

        if (options.dragScrollable === true) {
            const dragScrollableObserver = new DragScrollableObserver(content.$element);
            observers.push(dragScrollableObserver);

            if (typeof options.onGrab === 'function') {
                dragScrollableObserver.on(EVENT_GRAB, (event:any) => {
                    event.preventDefault();

                    options.onGrab && options.onGrab(event, this); // !!! type
                });
            }

            if (typeof options.onDrop === 'function') {
                dragScrollableObserver.on(EVENT_DROP, (event:any) => {
                    event.preventDefault();

                    options.onDrop && options.onDrop(event, this); // !!! type
                });
            }

            dragScrollableObserver.on(EVENT_MOVE, (event:any) => {
                event.preventDefault();

                const { x, y } = event.data;

                const contentNewLeft = content.currentLeft + x;
                const contentNewTop = content.currentTop + y;

                let maxAvailableLeft = (content.currentWidth - viewport.originalWidth) / 2 + content.correctX;
                let maxAvailableTop = (content.currentHeight - viewport.originalHeight) / 2 + content.correctY;

                // if we do not go beyond the permissible boundaries of the viewport
                if (Math.abs(contentNewLeft) <= maxAvailableLeft) content.currentLeft = contentNewLeft;
                // if we do not go beyond the permissible boundaries of the viewport
                if (Math.abs(contentNewTop) <= maxAvailableTop) content.currentTop = contentNewTop;

                this._transform(options.smoothTimeDrag);

                if (typeof options.onMove === 'function') {
                    options.onMove(event, this);
                }
            });
        }

        const interactionObserver = new InteractionObserver(content.$element);
        observers.push(interactionObserver);

        if (!options.disableWheelZoom) {
            if (this.isTouch) {
                const pinchToZoomObserver = new PinchToZoomObserver(content.$element);
                observers.push(pinchToZoomObserver);

                pinchToZoomObserver.on(EVENT_PINCH_TO_ZOOM, (event:any) => {
                    const { clientX, clientY, direction } = event.data;

                    const scale = this.computeScale(direction);
                    this.computePosition(scale, clientX, clientY);
                    this._transform();
                });
            } else {
                interactionObserver.on(EVENT_WHEEL, (event:any) => {
                    event.preventDefault();

                    const direction = options.reverseWheelDirection ? -event.deltaY : event.deltaY;
                    const scale = this.computeScale(direction);
                    this.computePosition(scale, eventClientX(event), eventClientY(event));
                    this._transform();
                });
            }
        }

        if (options.zoomOnClick || options.zoomOnDblClick) {
            const eventType = options.zoomOnDblClick ? EVENT_DBLCLICK : EVENT_CLICK;

            interactionObserver.on(eventType, (event:any) => {
                const scale = this.direction === 1 ? content.maxScale : content.minScale;
                this.computePosition(scale, eventClientX(event), eventClientY(event));
                this._transform();

                this.direction *= -1;
            });
        }
    }
    private _prepare() {
        const { viewport, content, options } = this;
        const { left, top } = getElementPosition(viewport.$element);

        viewport.originalWidth = viewport.$element!.offsetWidth;
        viewport.originalHeight = viewport.$element!.offsetHeight;
        viewport.originalLeft = left;
        viewport.originalTop = top;

        if (options.type === 'image') {
            content.originalWidth = options.width || content.$element?.naturalWidth;
            content.originalHeight = options.height || content.$element?.naturalHeight;
        } else {
            content.originalWidth = options.width || content.$element?.offsetWidth;
            content.originalHeight = options.height || content.$element?.offsetHeight;
        }

        content.maxScale = options.maxScale;
        content.minScale = options.minScale || Math.min(viewport.originalWidth / content.originalWidth, viewport.originalHeight / content.originalHeight, content.maxScale);

        content.currentScale = content.minScale;
        content.currentWidth = content.originalWidth * content.currentScale;
        content.currentHeight = content.originalHeight * content.currentScale;

        [ content.alignPointX, content.alignPointY ] = calculateAlignPoint(viewport, content, options.alignContent);

        content.currentLeft = content.alignPointX;
        content.currentTop = content.alignPointY;

        // calculate indent-left and indent-top to of content from viewport borders
        [ content.correctX, content.correctY ] = calculateCorrectPoint(viewport, content, options.alignContent);

        if (typeof options.prepare === 'function') {
            options.prepare(this);
        }

        this._transform();
    }

    private computeScale(direction:number) {
        this.direction = direction < 0 ? 1 : -1;

        const { minScale, maxScale, currentScale } = this.content;

        const scale = currentScale * Math.pow(this.options.speed, this.direction);

        if (scale <= minScale) {
            this.direction = 1;
            return minScale;
        }

        if (scale >= maxScale) {
            this.direction = -1;
            return maxScale;
        }

        return scale;
    }

    /**
     * @param {number} scale
     * @param {number} x
     * @param {number} y
     * @private
     */

    private computePosition(scale:number, x:number, y:number) {
        const { viewport, content, options, direction } = this;

        const contentNewWidth = content.originalWidth * scale;
        const contentNewHeight = content.originalHeight * scale;

        const scrollLeft = getPageScrollLeft();
        const scrollTop = getPageScrollTop();

        // calculate the parameters along the X axis
        let contentNewLeft = calculateContentShift(x, scrollLeft, viewport.originalLeft, content.currentLeft, viewport.originalWidth, contentNewWidth / content.currentWidth);
        // calculate the parameters along the Y axis
        let contentNewTop = calculateContentShift(y, scrollTop, viewport.originalTop, content.currentTop, viewport.originalHeight, contentNewHeight / content.currentHeight);

        if (direction === -1) {
            // check that the content does not go beyond the X axis
            contentNewLeft = calculateContentMaxShift(options.alignContent, viewport.originalWidth, content.correctX, contentNewWidth, contentNewLeft);
            // check that the content does not go beyond the Y axis
            contentNewTop = calculateContentMaxShift(options.alignContent, viewport.originalHeight, content.correctY, contentNewHeight, contentNewTop);
        }

        if (scale === content.minScale) {
            contentNewLeft = content.alignPointX;
            contentNewTop = content.alignPointY;
        }

        content.currentWidth = contentNewWidth;
        content.currentHeight = contentNewHeight;
        content.currentLeft = contentNewLeft;
        content.currentTop = contentNewTop;
        content.currentScale = scale;
    }

    /**
     * @param {number} smoothTime
     * @private
     */

    private _transform(smoothTime?:number) {
        if (smoothTime === undefined) smoothTime = this.options.smoothTime;

        transition(this.content.$element, smoothTime);
        transform(this.content.$element, this.content.currentLeft, this.content.currentTop, this.content.currentScale);

        if (typeof this.options.rescale === 'function') {
            this.options.rescale(this);
        }
    }

    /**
     * todo добавить проверку на то что бы переданные координаты не выходили за пределы возможного
     * @param {number} scale
     * @param {Object} coordinates
     * @private
     */

    private zoom(scale:number, coordinates?:Coordinates) {
        // if the coordinates are not passed, then use the coordinates of the center
        if (coordinates === undefined) {
            coordinates = calculateViewportCenter(this.viewport);
        }

        this.computePosition(scale, coordinates?.x, coordinates?.y);
        this._transform();
    }

    private destroyObservers() {
        for (const observer of this.observers) {
            observer.destroy();
        }
    }

    prepare() {
        this._prepare();
    }

    /**
     * todo добавить проверку на то что бы переданный state вообще возможен для данного instance
     * @param {number} top
     * @param {number} left
     * @param {number} scale
     */

    transform(top:number, left:number, scale:number) {
        const { content } = this;

        content.currentWidth = content.originalWidth * scale;
        content.currentHeight = content.originalHeight * scale;
        content.currentLeft = left;
        content.currentTop = top;
        content.currentScale = scale;

        this._transform();
    }

    zoomUp() {
        this.zoom(this.computeScale(-1));
    }

    zoomDown() {
        this.zoom(this.computeScale(1));
    }

    maxZoomUp() {
        this.zoom(this.content.maxScale);
    }

    maxZoomDown() {
        this.zoom(this.content.minScale);
    }

    zoomUpToPoint(coordinates:Coordinates) {
        this.zoom(this.computeScale(-1), coordinates);
    }

    zoomDownToPoint(coordinates:Coordinates) {
        this.zoom(this.computeScale(1), coordinates);
    }

    maxZoomUpToPoint(coordinates:Coordinates) {
        this.zoom(this.content.maxScale, coordinates);
    }

    destroy() {
        this.content.$element.style.removeProperty('transition');
        this.content.$element.style.removeProperty('transform');

        if (this.options.type === 'image') {
            off(this.content.$element, 'load', this.init);
        }

        this.destroyObservers();

        for (let key in this) {
            if (this.hasOwnProperty(key)) {
                delete this[key];
            }
        }
    }

    /**
     * Create WZoom instance
     * @param {string|HTMLElement} selectorOrHTMLElement
     * @param {WZoomOptions} [options]
     * @returns {WZoom}
     */

    static create(selectorOrHTMLElement: string|HTMLImageElement, options: Partial<DefaultOptions> = {}) {
        return new WZoom(selectorOrHTMLElement, options);
    };
};

/**
 * @param {?WZoomOptions} targetOptions
 * @param {?WZoomOptions} defaultOptions
 * @returns {?WZoomOptions}
 */

function optionsConstructor(targetOptions: Partial<DefaultOptions>, defaultOptions: Partial<DefaultOptions>):DefaultOptions {
    const options = Object.assign({}, defaultOptions, targetOptions);

    if (isTouch()) {
        options.smoothTime = 0;
        options.smoothTimeDrag = 0;
    } else {
        const smoothTime = Number(options.smoothTime);
        const smoothTimeDrag = Number(options.smoothTimeDrag);

        options.smoothTime = !isNaN(smoothTime) ? smoothTime : ZoomDefaultOptions.smoothTime;
        options.smoothTimeDrag = !isNaN(smoothTimeDrag) ? smoothTimeDrag : options.smoothTime;
    }

    return <DefaultOptions>options;
}

/**
 * @typedef ZoomContent
 * @type {Object}
 * @property {HTMLElement} [$element]
 * @property {number} [originalWidth]
 * @property {number} [originalHeight]
 * @property {number} [currentWidth]
 * @property {number} [currentHeight]
 * @property {number} [currentLeft]
 * @property {number} [currentTop]
 * @property {number} [currentScale]
 * @property {number} [maxScale]
 * @property {number} [minScale]
 * @property {number} [alignPointX]
 * @property {number} [alignPointY]
 * @property {number} [correctX]
 * @property {number} [correctY]
 */

/**
 * @typedef WZoomViewport
 * @type {Object}
 * @property {HTMLElement} [$element]
 * @property {number} [originalWidth]
 * @property {number} [originalHeight]
 * @property {number} [originalLeft]
 * @property {number} [originalTop]
 */
