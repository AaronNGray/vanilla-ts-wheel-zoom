export class Coordinates {
    x:number = 0;
    y:number = 0;
}

/**
 * Get element position (with support old browsers)
 * @param {Element} element
 * @returns {{top: number, left: number}}
 */
export function getElementPosition(element:HTMLElement): {top:number, left:number} {
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
export function getPageScrollLeft():number {
    const supportPageOffset = window.pageXOffset !== undefined;
    const isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat');

    return supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft;
}

/**
 * Get page scroll top
 * @returns {number}
 */
export function getPageScrollTop():number {
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

export function on(target:HTMLElement|Document, type: string, listener: (event:Event) => void, options: boolean | AddEventListenerOptions = false) {
    target.addEventListener(type, listener, options);
}

/**
 * @param target
 * @param type
 * @param listener
 * @param options
 */
export function off(target:HTMLElement|Document, type: string, listener: (event:Event) => void, options: boolean | AddEventListenerOptions = false) {
    target.removeEventListener(type, listener, options);
}

/**
 * @returns {boolean}
 */
export function isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 /*|| navigator["msMaxTouchPoints"] > 0 */;
}

/**
 * @param {Event} event
 * @returns {number}
 */
export function eventClientX(event:MouseEvent|TouchEvent) {
    return event.type === 'wheel' ||
    event.type === 'pointerup' ||
    event.type === 'pointerdown' ||
    event.type === 'pointermove' ||
    event.type === 'mousedown' ||
    event.type === 'mousemove' ||
    event.type === 'mouseup' ? (<MouseEvent>event).clientX : (<TouchEvent>event).changedTouches[0].clientX;
}

/**
 * @param {Event} event
 * @returns {number}
 */
export function eventClientY(event:MouseEvent|TouchEvent) {
    return event.type === 'wheel' ||
    event.type === 'pointerup' ||
    event.type === 'pointerdown' ||
    event.type === 'pointermove' ||
    event.type === 'mousedown' ||
    event.type === 'mousemove' ||
    event.type === 'mouseup' ? (<MouseEvent>event).clientY : (<TouchEvent>event).changedTouches[0].clientY;
}

/**
 * @param {HTMLElement} $element
 * @param {number} left
 * @param {number} top
 * @param {number} scale
 */
export function transform($element:HTMLElement, left:number, top:number, scale:number) {
    $element.style.transform = `translate(${ left }px, ${ top }px) scale(${ scale })`;
}

/**
 * @param {HTMLElement} $element
 * @param {number} time
 */
export function transition($element:HTMLElement, time:number) {
    if (time) {
        $element.style.transition = `transform ${ time }s`;
    } else {
        $element.style.removeProperty('transition');
    }
}
