class AbstractObserver {
    /**
     * @constructor
     */
    constructor() {
        /** @type {Object<string, (event: Event) => void>} */
        this.subscribes = {};
    }

    subscribes:any;  // !!!

    /**
     * @param {string} eventType
     * @param {(event: Event) => void} eventHandler
     * @returns {AbstractObserver}
     */
    on(eventType:string, eventHandler:Function) {
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
    protected run(eventType:string, event:Event) {
        if (this.subscribes[eventType]) {
            for (const eventHandler of this.subscribes[eventType]) {
                eventHandler(event);
            }
        }
    }
}

export default AbstractObserver;
