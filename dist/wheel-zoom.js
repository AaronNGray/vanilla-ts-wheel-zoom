(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.WZoom = factory());
})(this, (function () { 'use strict';

    class Coordinates {
        x = 0;
        y = 0;
    }
    /**
     * Get element position (with support old browsers)
     * @param {Element} element
     * @returns {{top: number, left: number}}
     */
    function getElementPosition(element) {
        const box = element.getBoundingClientRect();
        const { body, documentElement } = document;
        const scrollTop = getPageScrollTop();
        const scrollLeft = getPageScrollLeft();
        const clientTop = documentElement.clientTop || body.clientTop || 0;
        const clientLeft = documentElement.clientLeft || body.clientLeft || 0;
        const top = box.top + scrollTop - clientTop;
        const left = box.left + scrollLeft - clientLeft;
        return { top, left };
    }
    /**
     * Get page scroll left
     * @returns {number}
     */
    function getPageScrollLeft() {
        const supportPageOffset = window.pageXOffset !== undefined;
        const isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat');
        return supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft;
    }
    /**
     * Get page scroll top
     * @returns {number}
     */
    function getPageScrollTop() {
        const supportPageOffset = window.pageYOffset !== undefined;
        const isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat');
        return supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
    }
    /**
     * @param target
     * @param type: string
     * @param listener: EventListenerOrEventListenerObject
     * @param options?: boolean | AddEventListenerOptions
     */
    function on(target, type, listener, options = false) {
        target.addEventListener(type, listener, options);
    }
    /**
     * @param target
     * @param type
     * @param listener
     * @param options
     */
    function off(target, type, listener, options = false) {
        target.removeEventListener(type, listener, options);
    }
    /**
     * @returns {boolean}
     */
    function isTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0 /*|| navigator["msMaxTouchPoints"] > 0 */;
    }
    /**
     * @param {Event} event
     * @returns {number}
     */
    function eventClientX(event) {
        return event.type === 'wheel' ||
            event.type === 'pointerup' ||
            event.type === 'pointerdown' ||
            event.type === 'pointermove' ||
            event.type === 'mousedown' ||
            event.type === 'mousemove' ||
            event.type === 'mouseup' ? event.clientX : event.changedTouches[0].clientX;
    }
    /**
     * @param {Event} event
     * @returns {number}
     */
    function eventClientY(event) {
        return event.type === 'wheel' ||
            event.type === 'pointerup' ||
            event.type === 'pointerdown' ||
            event.type === 'pointermove' ||
            event.type === 'mousedown' ||
            event.type === 'mousemove' ||
            event.type === 'mouseup' ? event.clientY : event.changedTouches[0].clientY;
    }
    /**
     * @param {HTMLElement} $element
     * @param {number} left
     * @param {number} top
     * @param {number} scale
     */
    function transform($element, left, top, scale) {
        $element.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    }
    /**
     * @param {HTMLElement} $element
     * @param {number} time
     */
    function transition($element, time) {
        if (time) {
            $element.style.transition = `transform ${time}s`;
        }
        else {
            $element.style.removeProperty('transition');
        }
    }

    /**
     *
     * @param {WZoomViewport} viewport
     * @param {WZoomContent} content
     * @param {string} align
     * @returns {number[]}
     */
    class Viewport {
        constructor($element) {
            this.$element = $element;
        }
        $element;
        originalTop = 0;
        originalLeft = 0;
        originalHeight = 0;
        originalWidth = 0;
    }
    function calculateAlignPoint(viewport, content, align) {
        let pointX = 0;
        let pointY = 0;
        switch (align) {
            case 'top':
                pointY = (content.currentHeight - viewport.originalHeight) / 2;
                break;
            case 'right':
                pointX = (content.currentWidth - viewport.originalWidth) / 2 * -1;
                break;
            case 'bottom':
                pointY = (content.currentHeight - viewport.originalHeight) / 2 * -1;
                break;
            case 'left':
                pointX = (content.currentWidth - viewport.originalWidth) / 2;
                break;
        }
        return [pointX, pointY];
    }
    /**
     * @param {WZoomViewport} viewport
     * @param {WZoomContent} content
     * @param {string} align
     * @returns {number[]}
     */
    function calculateCorrectPoint(viewport, content, align) {
        let pointX = Math.max(0, (viewport.originalWidth - content.currentWidth) / 2);
        let pointY = Math.max(0, (viewport.originalHeight - content.currentHeight) / 2);
        switch (align) {
            case 'top':
                pointY = 0;
                break;
            case 'right':
                pointX = 0;
                break;
            case 'bottom':
                pointY = pointY * 2;
                break;
            case 'left':
                pointX = pointX * 2;
                break;
        }
        return [pointX, pointY];
    }
    /**
     * @returns {number}
     */
    function calculateContentShift(axisValue, axisScroll, axisViewportPosition, axisContentPosition, originalViewportSize, contentSizeRatio) {
        const viewportShift = axisValue + axisScroll - axisViewportPosition;
        const centerViewportShift = originalViewportSize / 2 - viewportShift;
        const centerContentShift = centerViewportShift + axisContentPosition;
        return centerContentShift * contentSizeRatio - centerContentShift + axisContentPosition;
    }
    function calculateContentMaxShift(align, originalViewportSize, correctCoordinate, size, shift) {
        switch (align) {
            case 'left':
                if (size / 2 - shift < originalViewportSize / 2) {
                    shift = (size - originalViewportSize) / 2;
                }
                break;
            case 'right':
                if (size / 2 + shift < originalViewportSize / 2) {
                    shift = (size - originalViewportSize) / 2 * -1;
                }
                break;
            default:
                if ((size - originalViewportSize) / 2 + correctCoordinate < Math.abs(shift)) {
                    const positive = shift < 0 ? -1 : 1;
                    shift = ((size - originalViewportSize) / 2 + correctCoordinate) * positive;
                }
        }
        return shift;
    }
    /**
     * @param {WZoomViewport} viewport
     * @returns {{x: number, y: number}}
     */
    function calculateViewportCenter(viewport) {
        const viewportPosition = getElementPosition(viewport.$element);
        return {
            x: viewportPosition.left + (viewport.originalWidth / 2) - getPageScrollLeft(),
            y: viewportPosition.top + (viewport.originalHeight / 2) - getPageScrollTop(),
        };
    }

    class AbstractObserver {
        /**
         * @constructor
         */
        constructor() {
            /** @type {Object<string, (event: Event) => void>} */
            this.subscribes = {};
        }
        subscribes; // !!!
        /**
         * @param {string} eventType
         * @param {(event: Event) => void} eventHandler
         * @returns {AbstractObserver}
         */
        on(eventType, eventHandler) {
            if (!(eventType in this.subscribes)) {
                this.subscribes[eventType] = [];
            }
            this.subscribes[eventType].push(eventHandler);
            return this;
        }
        destroy() {
            for (let key in this) {
                if (this.hasOwnProperty(key)) {
                    delete this[key];
                }
            }
        }
        /**
         * @param {string} eventType
         * @param {Event} event
         * @protected
         */
        run(eventType, event) {
            if (this.subscribes[eventType]) {
                for (const eventHandler of this.subscribes[eventType]) {
                    eventHandler(event);
                }
            }
        }
    }

    const EVENT_GRAB = 'grab';
    const EVENT_MOVE = 'move';
    const EVENT_DROP = 'drop';
    class DragScrollableObserver extends AbstractObserver {
        /**?
         * @param {HTMLElement} target
         * @constructor
         */
        constructor(target) {
            super();
            this.target = target;
            this.moveTimer = -1;
            this.coordinates = new Coordinates();
            this.coordinatesShift = new Coordinates();
            // check if we're using a touch screen
            this.isTouch = isTouch();
            // switch to touch events if using a touch screen
            this.events = this.isTouch
                ? { grab: 'touchstart', move: 'touchmove', drop: 'touchend' }
                : { grab: 'mousedown', move: 'mousemove', drop: 'mouseup' };
            // for the touch screen we set the parameter forcibly
            this.events.options = this.isTouch ? { passive: false } : false;
            this._dropHandler = this.dropHandler.bind(this);
            this._grabHandler = this.grabHandler.bind(this);
            this._moveHandler = this.moveHandler.bind(this);
            on(this.target, this.events.grab, this._grabHandler, this.events.options);
        }
        target;
        moveTimer;
        coordinates;
        coordinatesShift;
        events;
        _dropHandler;
        _grabHandler;
        _moveHandler;
        isTouch;
        // switch to touch events if using a touch screen
        destroy() {
            off(this.target, this.events.grab, this._grabHandler, this.events.options);
            super.destroy();
        }
        /**
         * @param {Event|TouchEvent|MouseEvent} event
         * @private
         */
        grabHandler(event) {
            // if touch started (only one finger) or pressed left mouse button
            if ((this.isTouch && event.touches.length === 1) || event.buttons === 1) {
                this.coordinates = { x: eventClientX(event), y: eventClientY(event) };
                this.coordinatesShift = { x: 0, y: 0 };
                on(document, this.events.drop, this._dropHandler, this.events.options);
                on(document, this.events.move, this._moveHandler, this.events.options);
                this.run(EVENT_GRAB, event);
            }
        }
        /**
         * @param {Event} event
         * @private
         */
        dropHandler(event) {
            off(document, this.events.drop, this._dropHandler);
            off(document, this.events.move, this._moveHandler);
            this.run(EVENT_DROP, event);
        }
        /**
         * @param {Event|TouchEvent} event
         * @private
         */
        moveHandler(event) {
            // so that it does not move when the touch screen and more than one finger
            if (this.isTouch && event.touches.length > 1)
                return false;
            // change of the coordinate of the mouse cursor along the X/Y axis
            this.coordinatesShift.x = eventClientX(event) - this.coordinates.x;
            this.coordinatesShift.y = eventClientY(event) - this.coordinates.y;
            this.coordinates.x = eventClientX(event);
            this.coordinates.y = eventClientY(event);
            clearTimeout(this.moveTimer);
            // reset shift if cursor stops
            this.moveTimer = setTimeout(() => {
                this.coordinatesShift.x = 0;
                this.coordinatesShift.y = 0;
            }, 50);
            event.data = { ...event.data || {}, x: this.coordinatesShift.x, y: this.coordinatesShift.y };
            this.run(EVENT_MOVE, event);
        }
    }

    const EVENT_CLICK = 'click';
    const EVENT_DBLCLICK = 'dblclick';
    const EVENT_WHEEL = 'wheel';
    class InteractionObserver extends AbstractObserver {
        /**
         * @param {HTMLElement} target
         * @constructor
         */
        constructor(target) {
            super();
            this.target = target;
            this.coordsOnDown = undefined;
            this.pressingTimeout = -1;
            this.firstClick = true;
            // check if we're using a touch screen
            this.isTouch = isTouch();
            // switch to touch events if using a touch screen
            this.events = this.isTouch
                ? { down: 'touchstart', up: 'touchend' }
                : { down: 'mousedown', up: 'mouseup' };
            // if using touch screen tells the browser that the default action will not be undone
            this.events.options = this.isTouch ? { passive: true } : false;
            this._downHandler = this.downHandler.bind(this);
            this._upHandler = this.upHandler.bind(this);
            this._wheelHandler = this.wheelHandler.bind(this);
            on(this.target, this.events.down, this._downHandler, this.events.options);
            on(this.target, this.events.up, this._upHandler, this.events.options);
            on(this.target, EVENT_WHEEL, this._wheelHandler);
        }
        destroy() {
            off(this.target, this.events.down, this._downHandler, this.events.options);
            off(this.target, this.events.up, this._upHandler, this.events.options);
            off(this.target, EVENT_WHEEL, this._wheelHandler, this.events.options);
            super.destroy();
        }
        target;
        coordsOnDown;
        pressingTimeout;
        firstClick;
        isTouch;
        events;
        _downHandler;
        _upHandler;
        _wheelHandler;
        /**
         * @param {TouchEvent|MouseEvent|PointerEvent} event
         * @private
         */
        downHandler(event) {
            this.coordsOnDown = undefined;
            if ((this.isTouch && event.touches.length === 1) || event.buttons === 1) {
                this.coordsOnDown = { x: eventClientX(event), y: eventClientY(event) };
            }
            clearTimeout(this.pressingTimeout);
        }
        /**
         * @param {TouchEvent|MouseEvent|PointerEvent} event
         * @private
         */
        upHandler(event) {
            const delay = 200;
            const setTimeoutInner = this.subscribes[EVENT_DBLCLICK]
                ? setTimeout
                : (cb, delay) => cb();
            if (this.firstClick) {
                this.firstClick = false;
                this.pressingTimeout = setTimeoutInner(() => {
                    if (!this.isDetectedShift(event)) {
                        this.run(EVENT_CLICK, event);
                    }
                    this.firstClick = true;
                }, delay);
            }
            else {
                this.pressingTimeout = setTimeoutInner(() => {
                    if (!this.isDetectedShift(event)) {
                        this.run(EVENT_DBLCLICK, event);
                    }
                    this.firstClick = true;
                }, delay / 2);
            }
        }
        /**
         * @param {WheelEvent} event
         * @private
         */
        wheelHandler(event) {
            this.run(EVENT_WHEEL, event);
        }
        /**
         * @param {TouchEvent|MouseEvent|PointerEvent} event
         * @return {boolean}
         * @private
         */
        isDetectedShift(event) {
            return !(this.coordsOnDown &&
                this.coordsOnDown?.x === eventClientX(event) &&
                this.coordsOnDown?.y === eventClientY(event));
        }
    }

    const EVENT_PINCH_TO_ZOOM = 'pinchtozoom';
    const SHIFT_DECIDE_THAT_MOVE_STARTED = 5;
    class PinchToZoomObserver extends AbstractObserver {
        /**
         * @param {HTMLElement} target
         * @constructor
         */
        constructor(target) {
            super();
            this.target = target;
            this.fingersHypot = 0;
            this.zoomPinchWasDetected = false;
            this._touchMoveHandler = this.touchMoveHandler.bind(this);
            this._touchEndHandler = this.touchEndHandler.bind(this);
            on(this.target, 'touchmove', this._touchMoveHandler);
            on(this.target, 'touchend', this._touchEndHandler);
        }
        destroy() {
            off(this.target, 'touchmove', this._touchMoveHandler);
            off(this.target, 'touchend', this._touchEndHandler);
            super.destroy();
        }
        target;
        fingersHypot;
        zoomPinchWasDetected;
        _touchMoveHandler;
        _touchEndHandler;
        /**
         * @param {TouchEvent|PointerEvent} event
         * @private
         */
        touchMoveHandler(event) {
            // detect two fingers
            if (event.targetTouches.length === 2) {
                const pageX1 = event.targetTouches[0].clientX;
                const pageY1 = event.targetTouches[0].clientY;
                const pageX2 = event.targetTouches[1].clientX;
                const pageY2 = event.targetTouches[1].clientY;
                // Math.hypot() analog
                const fingersHypotNew = Math.round(Math.sqrt(Math.pow(Math.abs(pageX1 - pageX2), 2) +
                    Math.pow(Math.abs(pageY1 - pageY2), 2)));
                let direction = 0;
                if (fingersHypotNew > this.fingersHypot + SHIFT_DECIDE_THAT_MOVE_STARTED)
                    direction = -1;
                if (fingersHypotNew < this.fingersHypot - SHIFT_DECIDE_THAT_MOVE_STARTED)
                    direction = 1;
                if (direction !== 0) {
                    if (this.fingersHypot !== null || direction === 1) {
                        // middle position between fingers
                        const clientX = Math.min(pageX1, pageX2) + (Math.abs(pageX1 - pageX2) / 2);
                        const clientY = Math.min(pageY1, pageY2) + (Math.abs(pageY1 - pageY2) / 2);
                        event.data = { ...event.data || {}, clientX, clientY, direction };
                        this.run(EVENT_PINCH_TO_ZOOM, event);
                    }
                    this.fingersHypot = fingersHypotNew;
                    this.zoomPinchWasDetected = true;
                }
            }
        }
        /**
         * @private
         */
        touchEndHandler() {
            if (this.zoomPinchWasDetected) {
                this.fingersHypot = 0;
                this.zoomPinchWasDetected = false;
            }
        }
    }

    /** @type {WZoomOptions} */
    const ZoomDefaultOptions = {
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

    class Content {
        constructor(selectorOrHTMLElement) {
            if (typeof selectorOrHTMLElement === 'string') {
                this.$element = document.querySelector(selectorOrHTMLElement);
                if (!this.$element) {
                    throw `Zoom: Element with selector \`${selectorOrHTMLElement}\` not found`;
                }
            }
            else if (selectorOrHTMLElement instanceof HTMLElement) {
                this.$element = selectorOrHTMLElement;
            }
            else {
                throw `Zoom: \`selectorOrHTMLElement\` must be selector or HTMLElement, and not ${{}.toString.call(selectorOrHTMLElement)}`;
            }
        }
        getParent() {
            return this.$element.parentElement;
        }
        $element;
        currentLeft = 0;
        currentTop = 0;
        currentWidth = 0;
        currentHeight = 0;
        currentScale = 0;
        originalHeight = 0;
        originalWidth = 0;
        originalScale = 0;
        alignPointX = 0;
        alignPointY = 0;
        correctX = 0;
        correctY = 0;
        minScale = 0;
        maxScale = 0;
    }
    /**
     * @class WZoom
     * @param {string|HTMLElement} selectorOrHTMLElement
     * @param {WZoomOptions} options
     * @constructor
     */
    class WZoom {
        constructor(selectorOrHTMLElement, options = {}) {
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
                }
                else {
                    on(this.content.$element, 'load', this.init, { once: true });
                }
            }
            else {
                this.init();
            }
        }
        content;
        viewport;
        options;
        observers;
        direction; // !!!
        isTouch;
        init() {
            const { viewport, content, options, observers } = this;
            this.prepare();
            this.destroyObservers();
            if (options.dragScrollable === true) {
                const dragScrollableObserver = new DragScrollableObserver(content.$element);
                observers.push(dragScrollableObserver);
                if (typeof options.onGrab === 'function') {
                    dragScrollableObserver.on(EVENT_GRAB, (event) => {
                        event.preventDefault();
                        options.onGrab && options.onGrab(event, this); // !!! type
                    });
                }
                if (typeof options.onDrop === 'function') {
                    dragScrollableObserver.on(EVENT_DROP, (event) => {
                        event.preventDefault();
                        options.onDrop && options.onDrop(event, this); // !!! type
                    });
                }
                dragScrollableObserver.on(EVENT_MOVE, (event) => {
                    event.preventDefault();
                    const { x, y } = event.data;
                    const contentNewLeft = content.currentLeft + x;
                    const contentNewTop = content.currentTop + y;
                    let maxAvailableLeft = (content.currentWidth - viewport.originalWidth) / 2 + content.correctX;
                    let maxAvailableTop = (content.currentHeight - viewport.originalHeight) / 2 + content.correctY;
                    // if we do not go beyond the permissible boundaries of the viewport
                    if (Math.abs(contentNewLeft) <= maxAvailableLeft)
                        content.currentLeft = contentNewLeft;
                    // if we do not go beyond the permissible boundaries of the viewport
                    if (Math.abs(contentNewTop) <= maxAvailableTop)
                        content.currentTop = contentNewTop;
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
                    pinchToZoomObserver.on(EVENT_PINCH_TO_ZOOM, (event) => {
                        const { clientX, clientY, direction } = event.data;
                        const scale = this.computeScale(direction);
                        this.computePosition(scale, clientX, clientY);
                        this._transform();
                    });
                }
                else {
                    interactionObserver.on(EVENT_WHEEL, (event) => {
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
                interactionObserver.on(eventType, (event) => {
                    const scale = this.direction === 1 ? content.maxScale : content.minScale;
                    this.computePosition(scale, eventClientX(event), eventClientY(event));
                    this._transform();
                    this.direction *= -1;
                });
            }
        }
        _prepare() {
            const { viewport, content, options } = this;
            const { left, top } = getElementPosition(viewport.$element);
            viewport.originalWidth = viewport.$element.offsetWidth;
            viewport.originalHeight = viewport.$element.offsetHeight;
            viewport.originalLeft = left;
            viewport.originalTop = top;
            if (options.type === 'image') {
                content.originalWidth = options.width || content.$element?.naturalWidth;
                content.originalHeight = options.height || content.$element?.naturalHeight;
            }
            else {
                content.originalWidth = options.width || content.$element?.offsetWidth;
                content.originalHeight = options.height || content.$element?.offsetHeight;
            }
            content.maxScale = options.maxScale;
            content.minScale = options.minScale || Math.min(viewport.originalWidth / content.originalWidth, viewport.originalHeight / content.originalHeight, content.maxScale);
            content.currentScale = content.minScale;
            content.currentWidth = content.originalWidth * content.currentScale;
            content.currentHeight = content.originalHeight * content.currentScale;
            [content.alignPointX, content.alignPointY] = calculateAlignPoint(viewport, content, options.alignContent);
            content.currentLeft = content.alignPointX;
            content.currentTop = content.alignPointY;
            // calculate indent-left and indent-top to of content from viewport borders
            [content.correctX, content.correctY] = calculateCorrectPoint(viewport, content, options.alignContent);
            if (typeof options.prepare === 'function') {
                options.prepare(this);
            }
            this._transform();
        }
        computeScale(direction) {
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
        computePosition(scale, x, y) {
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
        _transform(smoothTime) {
            if (smoothTime === undefined)
                smoothTime = this.options.smoothTime;
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
        zoom(scale, coordinates) {
            // if the coordinates are not passed, then use the coordinates of the center
            if (coordinates === undefined) {
                coordinates = calculateViewportCenter(this.viewport);
            }
            this.computePosition(scale, coordinates?.x, coordinates?.y);
            this._transform();
        }
        destroyObservers() {
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
        transform(top, left, scale) {
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
        zoomUpToPoint(coordinates) {
            this.zoom(this.computeScale(-1), coordinates);
        }
        zoomDownToPoint(coordinates) {
            this.zoom(this.computeScale(1), coordinates);
        }
        maxZoomUpToPoint(coordinates) {
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
        static create(selectorOrHTMLElement, options = {}) {
            return new WZoom(selectorOrHTMLElement, options);
        }
        ;
    }
    /**
     * @param {?WZoomOptions} targetOptions
     * @param {?WZoomOptions} defaultOptions
     * @returns {?WZoomOptions}
     */
    function optionsConstructor(targetOptions, defaultOptions) {
        const options = Object.assign({}, defaultOptions, targetOptions);
        if (isTouch()) {
            options.smoothTime = 0;
            options.smoothTimeDrag = 0;
        }
        else {
            const smoothTime = Number(options.smoothTime);
            const smoothTimeDrag = Number(options.smoothTimeDrag);
            options.smoothTime = !isNaN(smoothTime) ? smoothTime : ZoomDefaultOptions.smoothTime;
            options.smoothTimeDrag = !isNaN(smoothTimeDrag) ? smoothTimeDrag : options.smoothTime;
        }
        return options;
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

    return WZoom;

}));
