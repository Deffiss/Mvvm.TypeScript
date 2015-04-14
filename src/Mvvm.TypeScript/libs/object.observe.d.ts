interface ObjectConstructor {
    observe(object: any, handler: (update: Array<ChangedRecord>) => any, acceptList?: Array<string>): any;
    unobserve(beingObserved: any, handler: (update: Array<ChangedRecord>) => any): any;
    getNotifier(object: any): any;
    deliverChangeRecords(handler: (update: any) => any): any;
}

interface ChangedRecord {
    "type": string;
    oldValue: any;
    name: string;
    object: any;
}