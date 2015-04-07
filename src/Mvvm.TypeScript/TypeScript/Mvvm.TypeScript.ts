module Mvvm.TypeScript {

    export class Application {

        private binder: IBinder;
        private parser: IExpressionParser;
        private bindings: Array<BindingBase>;
        private root: any;

        constructor() {
            this.initialize();
        }

        startup() {
            var context = new BindingContext(this.root, new Array(this.root), this.root, document.body);
            this.bindings = this.binder.bind(context);
        }

        dispose() {
            this.bindings.forEach((binding) => {
                binding.dispose();
            });
        }

        protected getBinder(): IBinder {
            return new Binder(this.parser);
        }

        protected getExpressionParser(): IExpressionParser {
            return new ExpressionParser();
        }

        protected getRoot(): any {
            throw new Error("Root view model should be provided");
        }

        private initialize() {
            this.parser = this.getExpressionParser();
            this.binder = this.getBinder();
            this.root = this.getRoot();
        }

    }

    export interface IExpressionParser {

        parse(exprValue: string, context: BindingContext): Array<{
            expression: IExpression;
            contextExpression: IExpression;
            bindingName: string;
            propertyName: string;
        }>;

    }

    class ExpressionParser implements IExpressionParser {

        private static contextRegexp: RegExp = new RegExp("(?<params>(?<param>[^\.]+)(?:\.(?<param>[^\.]+))*");
        private static propertyNameExpression = new RegExp("");

        parse(exprValue: string, context: BindingContext): Array<{
            expression: IExpression;
            contextExpression: IExpression;
            bindingName: string;
            propertyName: string;
        }> {
            var expressions = new Array<{
                expression: IExpression;
                contextExpression: IExpression;
                bindingName: string;
                propertyName: string;
            }>();

            exprValue.split(",").forEach((bindingExpr) => {
                var splitedBinding = bindingExpr.split(":", 2);

                ExpressionParser.contextRegexp.exec("");

                expressions.push({
                    bindingName: splitedBinding[0],
                    expression: new Expression(context, splitedBinding[1]),
                    contextExpression: null,
                    propertyName: null
                });
            });

            return expressions;
        }

    }

    export interface IExpression {

        eval(): any;

    }

    export class Expression implements IExpression {
        
        private context: BindingContext;
        private exprFunction: Function;

        constructor(context: BindingContext, body: string) {
            this.context = context;
            var scopedBody = "with($this){return " + body + ";}";
            this.exprFunction = new Function("$this", "$parent", "$parents", "$root", scopedBody);
        }

        eval(): any {
            return this.exprFunction(this.context.thisContext, this.context.parents[this.context.parents.length - 1],
                this.context.parents, this.context.root);
        }
    }

    export interface IBinder {
        
        bind(context: BindingContext): Array<BindingBase>;

    }

    class Binder implements IBinder {

        private bindingFactories: { [bindingName: string]: IBindingFactory };
        private defaultBindingFactory: IBindingFactory;
        private parser: IExpressionParser;

        constructor(parser: IExpressionParser) {
            this.parser = parser;
        }

        bind(context: BindingContext): Array<BindingBase> {
            var bindingList = new Array<BindingBase>();
            
            for (var i = 0; i < context.view.children.length; i++) {
                
                var child = <HTMLElement>context.view.children[i];

                var thisContext: any;
                var parents: Array<any>;

                // data-context
                var dataContextAttr = child.attributes.getNamedItem("data-context");
                if (dataContextAttr != null) {
                    var ctxExpression = new Expression(context, dataContextAttr.value);
                    thisContext = ctxExpression.eval();
                    parents = new Array(context.parents, context.thisContext);
                } else {
                    thisContext = context.thisContext;
                    parents = context.parents;
                }

                var newContext = new BindingContext(thisContext, parents, context.root, child);

                // data-bind
                var dataBindAttr = child.attributes.getNamedItem("data-bind");
                if (dataBindAttr != null) {
                    var expressions = this.parser.parse(dataBindAttr.value, newContext);
                    expressions.forEach((expr) => {
                        var bindingFactory = this.bindingFactories[expr.bindingName];
                        var binding = bindingFactory != null
                            ? bindingFactory.buildBinding(newContext, expr.expression)
                            : this.defaultBindingFactory.buildBinding(newContext, expr.expression);

                        bindingList.push(binding);
                    });
                }

                // store to list
                this.bind(newContext).forEach((binding) => {
                    bindingList.push(binding);
                });
            }

            return bindingList;
        }
    }

    export interface IBindingFactory {
        
        buildBinding(context: BindingContext, expression: IExpression);

    }

    export class BindingBase {

        private contextField: BindingContext;
        protected get context(): BindingContext { return this.contextField; }

        private expressionField: IExpression;
        protected get expression(): IExpression { return this.expressionField; }

        constructor(context: BindingContext, expression: IExpression) {
            this.contextField = context;
        }

        getConverter(): IValueConverter {
            return new ToStringConverter();
        }

        protected applyBinding() { throw new Error("Binding should be applied."); }

        dispose() { }

    }

    export class PropertyBinding extends BindingBase {

        private propertyNameField: string;
        protected get propertyName(): string { return this.propertyNameField; }

        constructor(context: BindingContext, expression: IExpression, propertyName) {
            super(context, expression);
            this.propertyName = propertyName;
        }

        protected applyBinding() {
            var observer = new PropertyChangeObserver(this.context.thisContext,(changeInfo) => {
                if (changeInfo.propertyName !== this.propertyName) return;

                var newValue = this.context.thisContext[changeInfo.propertyName];
                var convertedValue = this.getConverter().convert(newValue);

            });
        }

    }

    export class EventBinding extends BindingBase {

        private eventNameField: string;
        protected get eventName(): string { return this.eventNameField; }

        constructor(context: BindingContext, expression: IExpression, eventName: string) {
            super(context, expression);
            this.eventNameField = eventName;
        }

        protected applyBinding() {
            this.context.view.addEventListener(this.eventName, () => {
                this.expression.eval();
            });
        }        
    }


    export interface IValueConverter {
        
        convert(value: any): any;
        convertBack(elementValue: any): any; 

    }

    export class ToStringConverter implements IValueConverter {

        convert(value) {
            return value.toString();
        }

        convertBack(elementValue) {
            return elementValue;
        }
    }

    export class BindingContext {

        private thisContextField: any;
        get thisContext(): any { return this.thisContextField; }

        private parentsField: Array<any>;
        get parents(): Array<any> { return this.parentsField; }

        private rootField: any;
        get root(): any { return this.rootField; }

        private viewField: HTMLElement;
        get view(): HTMLElement { return this.viewField; }

        constructor(thisContext: any, parents: Array<any>, root: any, view: HTMLElement) {
            this.thisContextField = thisContext;
            this.parentsField = parents;
            this.viewField = view;
        }

    }

    export interface INotifyPropertyChanged {
     
        subscribe(handler: IPropertyChangeHandler);
        unsubscribe(handler: IPropertyChangeHandler);
           
    }

    export interface IPropertyChangeHandler {
        
        propertyChanged(sender: any, changeInfo: { propertyName: string; });

    }

    class PropertyChangeObserver implements IPropertyChangeHandler {

        private observable: INotifyPropertyChanged;
        private handler: (changeInfo: { propertyName: string }) => void;

        constructor(observable: any, handler: (changeInfo: { propertyName: string }) => void) {
            this.observable = observable;
            this.handler = handler;
            this.observable.subscribe(this);
        }

        propertyChanged(sender, changeInfo: { propertyName: string }) {
            this.handler(changeInfo);
        }
    }

    export interface INotifyCollectionChanged {
        
        subscribe(handler: ICollectionChangeHandler);
        unsubscribe(handler: ICollectionChangeHandler);

    }

    export interface ICollectionChangeHandler {
        
        collectionChanged(sender: any, changeInfo: {added: any[]; removed: any[]})

    }

    export class ViewModelBase implements INotifyPropertyChanged {

        private changeSubscribers: Array<IPropertyChangeHandler>;

        constructor() {
            this.changeSubscribers = new Array();
        }

        subscribe(handler: IPropertyChangeHandler) {
            this.changeSubscribers.push(handler);
        }

        unsubscribe(handler: IPropertyChangeHandler) {
            this.changeSubscribers.splice(0, this.changeSubscribers.indexOf(handler));
        }

        protected notifyPropertyChanged(changeInfo: { propertyName: string }) {
            this.changeSubscribers.forEach((value) => {
                value.propertyChanged(this, changeInfo);
            });
        }
    }

    export class BindableArray<T> implements INotifyCollectionChanged {

        private changeSubscribers: Array<ICollectionChangeHandler>;

        private innerArrayField: Array<T>;
        get innerArray(): Array<T> { return this.innerArrayField; }

        constructor(innerArray: Array<T>) {
            this.innerArray = innerArray;
            this.changeSubscribers = new Array();
        }

        add(item: T) {
            this.innerArrayField.push(item);
            this.changeSubscribers.forEach((value) => {
                value.collectionChanged(this, { added: new Array(item), removed: new Array() });
            });
        }

        remove(item: T) {
            this.innerArrayField.splice(0, this.innerArray.indexOf(item));
            this.changeSubscribers.forEach((value) => {
                value.collectionChanged(this, { added: new Array(), removed: new Array(item) });
            });
        }

        subscribe(handler: ICollectionChangeHandler) {
            this.changeSubscribers.push(handler);
        }

        unsubscribe(handler: ICollectionChangeHandler) {
            this.changeSubscribers.splice(0, this.changeSubscribers.indexOf(handler));
        }
    }

}