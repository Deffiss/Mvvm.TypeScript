interface ObjectConstructor {
    observe<T>(object: T, handler: (update: Array<ChangedRecord<T>>) => any, acceptList?: Array<string>): any;
    unobserve<T>(beingObserved: T, handler: (update: Array<ChangedRecord<T>>) => any): any;
    getNotifier(object: any): any;
    deliverChangeRecords(handler: (update: any) => any): any;
}

interface ChangedRecord<T> {
    "type": string;
    oldValue: any;
    name: string;
    object: T;
}