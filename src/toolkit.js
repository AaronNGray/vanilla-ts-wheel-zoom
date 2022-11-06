/**
 * Get element position (with support old browsers)
 * @param {Element} element
 * @returns {{top: number, left: number}}
 */
export function getElementPosition(element) {
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
export function getPageScrollLeft() {
    const supportPageOffset = window.pageXOffset !== undefined;
    const isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat');

    return supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft;
}

/**
 * Get page scroll top
 * @returns {number}
 */
export function getPageScrollTop() {
    const supportPageOffset = window.pageYOffset !== undefined;
    const isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat');

    return supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
}

/**
 * @param target
 * @param type
 * @param listener
 * @param options
 */
export function on(target, type, listener, options = false) {
    target.addEventListener(type, listener, options);
}

/**
 * @param target
 * @param type
 * @param listener
 * @param options
 */
export function off(target, type, listener, options = false) {
    target.removeEventListener(type, listener, options);
}

/**
 * @returns {boolean}
 */
export function isTouch() {
    return 'ontouchstart' in window || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

/**
 * @param {Event} event
 * @returns {number}
 */
export function eventClientX(event) {
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
export function eventClientY(event) {
    return event.type === 'wheel' ||
    event.type === 'pointerup' ||
    event.type === 'pointerdown' ||
    event.type === 'pointermove' ||
    event.type === 'mousedown' ||
    event.type === 'mousemove' ||
    event.type === 'mouseup' ? event.clientY : event.changedTouches[0].clientY;
}
