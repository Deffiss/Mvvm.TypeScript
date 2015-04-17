﻿module Mvvm.TypeScript {

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
            this.bindings.forEach(b => b.applyBinding());
        }

        dispose() {
            this.bindings.forEach((binding: BindingBase) => {
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
            evalExpression: IExpression;
            contextExpression: IExpression;
            bindingName: string;
            memberName: string;
        }>;

    }

    class ExpressionParser implements IExpressionParser {

        //private static contextRegexp: RegExp = new RegExp("(?<params>(?<param>[^\.]+)(?:\.(?<param>[^\.]+))*");
        private static contextRegexp: RegExp = new RegExp("");
        private static propertyNameExpression = new RegExp("");

        parse(exprValue: string, context: BindingContext): Array<{
            evalExpression: IExpression;
            contextExpression: IExpression;
            bindingName: string;
            memberName: string;
        }> {
            var expressions = new Array<{
                evalExpression: IExpression;
                contextExpression: IExpression;
                bindingName: string;
                memberName: string;
            }>();

            exprValue.split(",").forEach((bindingExpr) => {
                var splitedBinding = bindingExpr.split(":", 2);

                //ExpressionParser.contextRegexp.exec("");
                // TODO: Parse complex expressions in the future. 
                expressions.push({
                    bindingName: splitedBinding[0],
                    evalExpression: new Expression(splitedBinding[1]),
                    contextExpression: new Expression("$this"),
                    memberName: splitedBinding[1]
                });
            });

            return expressions;
        }

    }

    export interface IExpression {

        evalMember: string;

        eval(context: BindingContext): any;

    }

    export class Expression implements IExpression {
        
        private exprFunction: Function;
        private evalMemberField: string;

        get evalMember(): string {
            // TODO: perform calculation of invoked member
            return this.evalMemberField;
        }

        constructor(body: string) {
            var scopedBody = "with($this){return " + body + ";}";
            this.exprFunction = new Function("$this", "$parent", "$parents", "$root", scopedBody);
            this.evalMemberField = body.trim();
        }

        eval(context: BindingContext): any {
            return this.exprFunction(context.thisContext, context.parents[context.parents.length - 1],
                context.parents, context.root);
        }
    }

    export interface IBinder {
        
        bind(context: BindingContext): Array<BindingBase>;

    }

    class Binder implements IBinder {

        private bindingFactories: { [bindingName: string]: IBindingFactory } = {
            "text": new SimpleBindingFactory((ctx, expr) => new TextBinding(ctx, expr)),
            "value": new SimpleBindingFactory((ctx, evalExpr, ctxExpr) => new ValueBinding(ctx, evalExpr, ctxExpr)),
            "visible": new SimpleBindingFactory((ctx, evalExpr) => new VisiblilityBinding(ctx, evalExpr)),
            "selected": new SimpleBindingFactory((ctx, evalExpr, ctxExpr) => new SelectedBinding(ctx, evalExpr, ctxExpr)),
            "list": new SimpleBindingFactory((ctx, evalExpr) => new ListBinding(ctx, evalExpr, this))
        };
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
                    var ctxExpression = new Expression(dataContextAttr.value);
                    thisContext = ctxExpression.eval(context);
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
                            ? bindingFactory.buildBinding(newContext, expr.evalExpression, expr.contextExpression)
                            : this.defaultBindingFactory.buildBinding(newContext, expr.evalExpression, expr.contextExpression);
                        //binding.applyBinding();
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
        
        buildBinding(context: BindingContext, evalExpression: IExpression, contextExpression: IExpression): BindingBase;

    }

    class SimpleBindingFactory implements IBindingFactory {

        constructor(buildBinding: (context: BindingContext, evalExpression: IExpression, contextExpression: IExpression) => BindingBase) {
             this.buildBinding = buildBinding;
        }

        buildBinding(context: BindingContext, evalExpression: IExpression, contextExpression: IExpression): BindingBase {
            return this.buildBinding(context, evalExpression, contextExpression);
        }

    }

    export class BindingBase {

        private contextField: BindingContext;
        protected get context(): BindingContext { return this.contextField; }

        private evalExpressionField: IExpression;
        protected get evalExpression(): IExpression { return this.evalExpressionField; }

        constructor(context: BindingContext, evalExpression: IExpression) {
            this.contextField = context;
            this.evalExpressionField = evalExpression;
            //this.applyBinding();
        }

        applyBinding() { throw new Error("Binding should be applied."); }

        dispose() { }

    }

    export class PropertyBinding extends BindingBase {

        private objectObserver: ModernPropertyChangeObserver;

        private elementPropertyNameField: string;
        protected get elementPropertyName(): string { return this.elementPropertyNameField; }

        constructor(context: BindingContext, evalExpression: IExpression, elementPropertyName: string) {
            this.elementPropertyNameField = elementPropertyName;
            super(context, evalExpression);
        }

        // Apply the reaction on the view model changes
        applyBinding() {
            this.objectObserver = new ModernPropertyChangeObserver(this.context.thisContext, (changeInfo) => {
                if (changeInfo.propertyName !== this.evalExpression.evalMember) return;
                this.updateView();
            });

            this.applyElementBinding();

            this.updateView();
        }

        protected applyElementBinding() { }

        protected getConverter(): IValueConverter {
            return new ToStringConverter();
        }

        protected updateView(): any {
            var newValue = this.evalExpression.eval(this.context);
            var convertedValue = this.getConverter().convert(newValue);
            this.context.view[this.elementPropertyName] = convertedValue;
        }

    }

    export class DuplexBinding extends PropertyBinding {

        private contextExpression: IExpression;
        private changeEventName: string;

        constructor(context: BindingContext, evalExpression: IExpression, contextExpression: IExpression, elementPropertyName: string, changeEventName: string) {
            this.changeEventName = changeEventName;
            this.contextExpression = contextExpression;
            super(context, evalExpression, elementPropertyName);
        }

        // Apply the reaction on dom element changes
        protected applyElementBinding() {
            // TODO: perform the validation
            var elementPropertyName = this.elementPropertyName;
            var context = this.context;
            var evalExpression = this.evalExpression;
            this.context.view.addEventListener(this.changeEventName, (e) => {
                var convertedValue = this.getConverter().convertBack(context.view[elementPropertyName]);
                var thisContext = this.contextExpression.eval(context);
                // Set property back
                thisContext[evalExpression.evalMember] = convertedValue;
            });
        }
    }

    export class ValueBinding extends DuplexBinding {
        constructor(context: BindingContext, evalExpression: IExpression, contextExpression: IExpression) {
            super(context, evalExpression, contextExpression, "value", "input");
        }

    }

    export class SelectedBinding extends DuplexBinding {

        constructor(context: BindingContext, evalExpression: IExpression, contextExpression: IExpression) {
            super(context, evalExpression, contextExpression, "checked", "change");
        } 

        getConverter(): IValueConverter { return new CheckedConverter(); }
    }

    class CheckedConverter implements IValueConverter {

        convert(value) {
            return value;
        }

        convertBack(elementValue) {
            return elementValue;
        }
    }

    export class StyleBinding extends PropertyBinding {
        updateView() {
            var newValue = this.evalExpression.eval(this.context);
            var convertedValue = this.getConverter().convert(newValue);
            this.context.view.style[this.elementPropertyName] = convertedValue;
        }
    }

    export class VisiblilityBinding extends StyleBinding {

        private elementDisplayValue: string;

        constructor(context: BindingContext, evalExpression: IExpression) {
            this.elementDisplayValue = context.view.style["display"];
            super(context, evalExpression, "display");
        }

        getConverter(): IValueConverter { return new VisibilityValueConverter(this.elementDisplayValue); }
    }

    class VisibilityValueConverter implements IValueConverter {

        constructor(private elementDisplayValue: string) {  }

        convert(value) {
            return value ? this.elementDisplayValue : "none";
        }

        convertBack(elementValue) { throw new Error("Back convertion is not supported."); }
    }

    export class TextBinding extends PropertyBinding {

        constructor(context: BindingContext, expression: IExpression) {
            super(context, expression, "innerText");
        }

    }

    export class ListBinding extends BindingBase {
        private template: HTMLElement;
        private arrayObserver: ModernArrayChangeObserver;
        private objectObserver: ModernPropertyChangeObserver;

        constructor(context: BindingContext, listExpression: IExpression, private binder: IBinder) {
            super(context, listExpression);
            this.extractTemplate();
        }

        applyBinding() {
            this.clearElement();

            // perform observing for array property itself
            this.objectObserver = new ModernPropertyChangeObserver(this.context.thisContext, (changeInfo) => {
                if (changeInfo.propertyName !== this.evalExpression.evalMember) return;
                // just perform rebinding
                this.applyBinding();
            });

            // and now we have to observe collection changes
            var observedArray = <Array<any>>this.evalExpression.eval(this.context);
            this.arrayObserver = new ModernArrayChangeObserver(observedArray,(changeInfos) => {
                // update each dom element according to changes
                changeInfos.forEach(ci => {

                });
            });

            this.populateElement();
        }

        private extractTemplate() {
            this.template = document.createElement("div");
            for (var i = 0; i < this.context.view.children.length; i++) {
                var clonedNode = this.context.view.children[i].cloneNode(true);
                this.template.appendChild(clonedNode);
            }
            this.clearElement();
        }

        private populateElement() {
            var list = <Array<any>>this.evalExpression.eval(this.context);
            list.forEach((item, i) => {
                var clonedTemplate = <HTMLElement>this.template.cloneNode(true);
                var context = new BindingContext(item, new Array(this.context.parents, item), this.context.root, clonedTemplate);
                var newBindings = this.binder.bind(context);
                newBindings.forEach(b => b.applyBinding());
                for (var childIndex = 0; childIndex < clonedTemplate.children.length; childIndex++) {
                    var child = clonedTemplate.children[childIndex];
                    //var attr = new Attr();
                    //attr.name = "data-list-index";
                    //attr.value = i.toString();
                    //child.attributes.setNamedItem(attr);
                    this.context.view.appendChild(child);
                }
                // TODO: Save new binding for updates
            });
        }


        private clearElement() {
            while (this.context.view.firstChild) {
                this.context.view.removeChild(this.context.view.firstChild);
            }
        }

    }

    export class EventBinding extends BindingBase {

        private eventNameField: string;
        protected get eventName(): string { return this.eventNameField; }

        constructor(context: BindingContext, eventExpression: IExpression, eventName: string) {
            super(context, eventExpression);
            this.eventNameField = eventName;
        }

        applyBinding() {
            this.context.view.addEventListener(this.eventName, () => {
                this.evalExpression.eval(this.context);
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

    class ModernPropertyChangeObserver {

        constructor(private observable: any, private handler: (changeInfo: { propertyName: string }) => void) {
            this.subscribe();
        }

        private subscribe() {
            if (typeof this.observable == "string") return;
            Object.observe(this.observable, e => {
                for (var i = 0; i < e.length; i++) {
                    this.handler({ propertyName: e[i].name });
                }
            });
        }

        dispose() { }

    }

    export enum NotifyCollectionChangedAction {
        Add,
        Update,
        Delete,
    }

    class ModernArrayChangeObserver {

        constructor(private observableArray: Array<any>, private handler: (changeInfos: Array<{
            action: NotifyCollectionChangedAction;
            index: number;
        }>) => void) {
            this.subscribe();
        }

        private subscribe() {
            Object.observe(this.observableArray, e => {
                var changeInfos: Array<{
                    action: NotifyCollectionChangedAction;
                    index: number;
                }> = new Array();
                for (var i = 0; i < e.length; i++) {
                    if (e[i].name === "length") continue;

                    changeInfos.push({
                        action: NotifyCollectionChangedAction.Add,
                        index: parseInt(e[i].name)
                    });
                }
                this.handler(changeInfos);
            });
        }

        dispose() { }

    }

}