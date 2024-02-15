import { eventClientX, eventClientY, isTouch, off, on, Coordinates } from '../toolkit';
import AbstractObserver from './AbstractObserver';

export const EVENT_CLICK = 'click';
export const EVENT_DBLCLICK = 'dblclick';
export const EVENT_WHEEL = 'wheel';

export default class InteractionObserver extends AbstractObserver {
    /**
     * @param {HTMLElement} target
     * @constructor
     */
    constructor(target:HTMLElement) {
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

        this._downHandler = <(event:Event) => void> this.downHandler.bind(this);
        this._upHandler = <(event:Event) => void> this.upHandler.bind(this);
        this._wheelHandler = <(event:Event) => void> this.wheelHandler.bind(this);

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

    target:HTMLElement;
    coordsOnDown?:Coordinates;
    pressingTimeout:number;
    firstClick:boolean;
    isTouch:boolean;
    events:any;

    _downHandler:(event: Event) => void;
    _upHandler:(event: Event) => void;
    _wheelHandler:(event: Event) => void;

    /**
     * @param {TouchEvent|MouseEvent|PointerEvent} event
     * @private
     */
    private downHandler(event:TouchEvent|MouseEvent|PointerEvent) {
        this.coordsOnDown = undefined;

        if ((this.isTouch && (<TouchEvent>event).touches.length === 1) || (<MouseEvent>event).buttons === 1) {
            this.coordsOnDown = { x: eventClientX(event), y: eventClientY(event) };
        }

        clearTimeout(this.pressingTimeout);
    }

    /**
     * @param {TouchEvent|MouseEvent|PointerEvent} event
     * @private
     */
    private upHandler(event:TouchEvent|MouseEvent|PointerEvent) {
        const delay = 200;
        const setTimeoutInner = this.subscribes[EVENT_DBLCLICK]
            ? setTimeout
            : (cb:Function, delay:number) => cb();

        if (this.firstClick) {
            this.firstClick = false;

            this.pressingTimeout = setTimeoutInner(() => {
                if (!this.isDetectedShift(event)) {
                    this.run(EVENT_CLICK, event);
                }

                this.firstClick = true;
            }, delay);
        } else {
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
    wheelHandler(event:WheelEvent) {
        this.run(EVENT_WHEEL, event);
    }

    /**
     * @param {TouchEvent|MouseEvent|PointerEvent} event
     * @return {boolean}
     * @private
     */
    private isDetectedShift(event:TouchEvent|MouseEvent|PointerEvent) {
        return !(this.coordsOnDown &&
            this.coordsOnDown?.x === eventClientX(event) &&
            this.coordsOnDown?.y === eventClientY(event));
    }
}
