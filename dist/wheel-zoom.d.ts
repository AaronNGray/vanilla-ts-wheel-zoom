// Generated by dts-bundle-generator v7.2.0

declare class Coordinates {
	x: number;
	y: number;
}
declare class Viewport {
	constructor($element: HTMLElement);
	$element: HTMLElement;
	originalTop: number;
	originalLeft: number;
	originalHeight: number;
	originalWidth: number;
}
declare class AbstractObserver {
	/**
	 * @constructor
	 */
	constructor();
	subscribes: any;
	/**
	 * @param {string} eventType
	 * @param {(event: Event) => void} eventHandler
	 * @returns {AbstractObserver}
	 */
	on(eventType: string, eventHandler: Function): this;
	destroy(): void;
	/**
	 * @param {string} eventType
	 * @param {Event} event
	 * @protected
	 */
	protected run(eventType: string, event: Event): void;
}
/** @type {WZoomOptions} */
export type DefaultOptions = {
	type: string;
	width?: number;
	height?: number;
	minScale?: number;
	maxScale: number;
	speed: number;
	zoomOnClick: boolean;
	zoomOnDblClick: boolean;
	smoothTime: number;
	alignContent: string;
	disableWheelZoom: boolean;
	reverseWheelDirection: boolean;
	dragScrollable: boolean;
	smoothTimeDrag?: number;
	onGrab?: Function;
	onMove?: Function;
	onDrop?: Function;
	rescale?: Function;
	prepare?: Function;
};
declare class Content {
	constructor(selectorOrHTMLElement: string | HTMLImageElement);
	getParent(): HTMLElement;
	$element: HTMLImageElement;
	currentLeft: number;
	currentTop: number;
	currentWidth: number;
	currentHeight: number;
	currentScale: number;
	originalHeight: number;
	originalWidth: number;
	originalScale: number;
	alignPointX: number;
	alignPointY: number;
	correctX: number;
	correctY: number;
	minScale: number;
	maxScale: number;
}
/**
 * @class WZoom
 * @param {string|HTMLElement} selectorOrHTMLElement
 * @param {WZoomOptions} options
 * @constructor
 */
export default class WZoom {
	constructor(selectorOrHTMLElement: string | HTMLImageElement, options?: Partial<DefaultOptions>);
	content: Content;
	viewport: Viewport;
	options: DefaultOptions;
	observers: AbstractObserver[];
	direction: number;
	isTouch: boolean;
	private init;
	private _prepare;
	private computeScale;
	/**
	 * @param {number} scale
	 * @param {number} x
	 * @param {number} y
	 * @private
	 */
	private computePosition;
	/**
	 * @param {number} smoothTime
	 * @private
	 */
	private _transform;
	/**
	 * todo добавить проверку на то что бы переданные координаты не выходили за пределы возможного
	 * @param {number} scale
	 * @param {Object} coordinates
	 * @private
	 */
	private zoom;
	private destroyObservers;
	prepare(): void;
	/**
	 * todo добавить проверку на то что бы переданный state вообще возможен для данного instance
	 * @param {number} top
	 * @param {number} left
	 * @param {number} scale
	 */
	transform(top: number, left: number, scale: number): void;
	zoomUp(): void;
	zoomDown(): void;
	maxZoomUp(): void;
	maxZoomDown(): void;
	zoomUpToPoint(coordinates: Coordinates): void;
	zoomDownToPoint(coordinates: Coordinates): void;
	maxZoomUpToPoint(coordinates: Coordinates): void;
	destroy(): void;
	/**
	 * Create WZoom instance
	 * @param {string|HTMLElement} selectorOrHTMLElement
	 * @param {WZoomOptions} [options]
	 * @returns {WZoom}
	 */
	static create(selectorOrHTMLElement: string | HTMLImageElement, options?: Partial<DefaultOptions>): WZoom;
}

export {};