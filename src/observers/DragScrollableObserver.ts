import { on, off, eventClientX, eventClientY, isTouch, Coordinates} from '../toolkit';
import AbstractObserver from './AbstractObserver';

export const EVENT_GRAB = 'grab';
export const EVENT_MOVE = 'move';
export const EVENT_DROP = 'drop';

export default class DragScrollableObserver extends AbstractObserver {
    /**?
     * @param {HTMLElement} target
     * @constructor
     */
    constructor(target:HTMLElement) {
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

        this._dropHandler = <(event:Event) => void> this.dropHandler.bind(this);
        this._grabHandler = <(event:Event) => void> this.grabHandler.bind(this);
        this._moveHandler = <(event:Event) => void> this.moveHandler.bind(this);

        on(this.target, this.events.grab, this._grabHandler, this.events.options);
    }

    target:HTMLElement;
    moveTimer:number;
    coordinates:Coordinates;
    coordinatesShift:Coordinates;
    events: {
        grab: string;
        move: string;
        drop: string;
        touch?: string;
        options?: {
            passive: boolean;
        } | boolean;
    };
    _dropHandler:(event:Event) => void;
    _grabHandler:(event:Event) => void;
    _moveHandler:(event:Event) => void;
    isTouch:boolean;

    // switch to touch events if using a touch screen
    destroy() {
        off(this.target, this.events.grab, this._grabHandler, this.events.options);

        super.destroy();
    }

    /**
     * @param {Event|TouchEvent|MouseEvent} event
     * @private
     */
    private grabHandler(event:MouseEvent|TouchEvent) {
        // if touch started (only one finger) or pressed left mouse button
        if ((this.isTouch && (<TouchEvent>event).touches.length === 1) || (<MouseEvent>event).buttons === 1) {
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
    private dropHandler(event:MouseEvent) {
        off(document, this.events.drop, this._dropHandler);
        off(document, this.events.move, this._moveHandler);

        this.run(EVENT_DROP, event);
    }

    /**
     * @param {Event|TouchEvent} event
     * @private
     */
    private moveHandler(event:(MouseEvent|TouchEvent) & {data:Coordinates}) {
        // so that it does not move when the touch screen and more than one finger
        if (this.isTouch && (<TouchEvent>event).touches.length > 1) return false;

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
