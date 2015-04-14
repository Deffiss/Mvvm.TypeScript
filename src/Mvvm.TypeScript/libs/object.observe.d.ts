interface ObjectConstructor {
    observe(object: any, handler: (update: any) => any, acceptList?: Array<string>): any;
    unobserve(beingObserved: any, handler: (update: any) => any): any;
    getNotifier(object: any): any;
    deliverChangeRecords(handler: (update: any) => any): any;
}