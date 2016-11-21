var Mvvm;
(function (Mvvm) {
    var TypeScript;
    (function (TypeScript) {
        class Application {
            constructor() {
                this.initialize();
            }
            startup() {
                var context = new BindingContext(this.root, new Array(this.root), this.root, document.body);
                this.bindings = this.binder.bind(context, true);
                this.bindings.forEach(b => b.applyBinding());
            }
            dispose() {
                this.bindings.forEach((binding) => {
                    binding.dispose();
                });
            }
            getBinder() {
                return new Binder(this.parser);
            }
            getExpressionParser() {
                return new ExpressionParser();
            }
            getRoot() {
                throw new Error("Root view model should be provided");
            }
            initialize() {
                this.parser = this.getExpressionParser();
                this.binder = this.getBinder();
                this.root = this.getRoot();
            }
        }
        TypeScript.Application = Application;
        class ExpressionParser {
            parse(exprValue, context) {
                var expressions = new Array();
                exprValue.split(",").forEach((bindingExpr) => {
                    var splitedBinding = bindingExpr.split(":", 2);
                    //ExpressionParser.contextRegexp.exec("");
                    // TODO: Parse complex expressions in the future. 
                    expressions.push({
                        bindingName: splitedBinding[0].trim(),
                        evalExpression: new Expression(splitedBinding[1]),
                        contextExpression: new Expression("$this"),
                        memberName: splitedBinding[1].trim()
                    });
                });
                return expressions;
            }
        }
        //private static contextRegexp: RegExp = new RegExp("(?<params>(?<param>[^\.]+)(?:\.(?<param>[^\.]+))*");
        ExpressionParser.contextRegexp = new RegExp("");
        ExpressionParser.propertyNameExpression = new RegExp("");
        class Expression {
            constructor(body) {
                var scopedBody = "with($this){return " + body + ";}";
                this.exprFunction = new Function("$this", "$parent", "$parents", "$root", "$index", scopedBody);
                this.evalMemberField = body.trim();
            }
            get evalMember() {
                // TODO: perform calculation of invoked member
                return this.evalMemberField.replace("!", "");
            }
            eval(context) {
                return this.exprFunction(context.thisContext, context.parents[context.parents.length - 1], context.parents, context.root, context.index);
            }
        }
        TypeScript.Expression = Expression;
        class Binder {
            constructor(parser) {
                this.bindingFactories = {
                    "text": new SimpleBindingFactory((ctx, expr) => new TextBinding(ctx, expr)),
                    "value": new SimpleBindingFactory((ctx, evalExpr, ctxExpr) => new ValueBinding(ctx, evalExpr, ctxExpr)),
                    "visible": new SimpleBindingFactory((ctx, evalExpr) => new VisiblilityBinding(ctx, evalExpr)),
                    "selected": new SimpleBindingFactory((ctx, evalExpr, ctxExpr) => new SelectedBinding(ctx, evalExpr, ctxExpr)),
                    "list": new SimpleBindingFactory((ctx, evalExpr) => new ListBinding(ctx, evalExpr, this)),
                    "submit": new SimpleBindingFactory((ctx, evalExpr) => new EventBinding(ctx, evalExpr, "submit")),
                    "click": new SimpleBindingFactory((ctx, evalExpr) => new EventBinding(ctx, evalExpr, "click")),
                    "change": new SimpleBindingFactory((ctx, evalExpr) => new EventBinding(ctx, evalExpr, "change")),
                    "dblClick": new SimpleBindingFactory((ctx, evalExpr) => new EventBinding(ctx, evalExpr, "dblclick")),
                    "blur": new SimpleBindingFactory((ctx, evalExpr) => new EventBinding(ctx, evalExpr, "blur")),
                    "escape": new SimpleBindingFactory((ctx, evalExpr) => new EscapeBinding(ctx, evalExpr)),
                    "class": new SimpleBindingFactory((ctx, evalExpr) => new ClassBinding(ctx, evalExpr)),
                };
                this.parser = parser;
            }
            bind(context, bindRootElement) {
                var bindingList = new Array();
                if (bindRootElement) {
                    var rootElement = context.view;
                    this.bindElement(rootElement, context).forEach((binding) => {
                        bindingList.push(binding);
                    });
                }
                for (var i = 0; i < context.view.children.length; i++) {
                    var child = context.view.children[i];
                    this.bindElement(child, context, true).forEach((binding) => {
                        bindingList.push(binding);
                    });
                    ;
                }
                return bindingList;
            }
            bindElement(element, context, recursiveBind) {
                var bindingList = new Array();
                var thisContext;
                var parents;
                // data-context
                var dataContextAttr = element.attributes.getNamedItem("data-context");
                if (dataContextAttr != null) {
                    var ctxExpression = new Expression(dataContextAttr.value);
                    thisContext = ctxExpression.eval(context);
                    parents = new Array(context.parents, context.thisContext);
                }
                else {
                    thisContext = context.thisContext;
                    parents = context.parents;
                }
                var newContext = new BindingContext(thisContext, parents, context.root, element, context.index);
                // data-bind
                var dataBindAttr = element.attributes.getNamedItem("data-bind");
                if (dataBindAttr != null) {
                    var expressions = this.parser.parse(dataBindAttr.value, newContext);
                    expressions.forEach((expr) => {
                        var bindingFactory = this.bindingFactories[expr.bindingName];
                        var binding = bindingFactory != null
                            ? bindingFactory.buildBinding(newContext, expr.evalExpression, expr.contextExpression)
                            : this.defaultBindingFactory.buildBinding(newContext, expr.evalExpression, expr.contextExpression);
                        bindingList.push(binding);
                    });
                }
                if (recursiveBind) {
                    // store to list
                    this.bind(newContext).forEach((binding) => {
                        bindingList.push(binding);
                    });
                }
                return bindingList;
            }
        }
        class SimpleBindingFactory {
            constructor(buildBinding) {
                this.buildBinding = buildBinding;
            }
            buildBinding(context, evalExpression, contextExpression) {
                return this.buildBinding(context, evalExpression, contextExpression);
            }
        }
        class BindingBase {
            constructor(context, evalExpression) {
                this.contextField = context;
                this.evalExpressionField = evalExpression;
            }
            get isDispossed() { return this.isDispossedField; }
            get context() { return this.contextField; }
            get evalExpression() { return this.evalExpressionField; }
            applyBinding() { throw new Error("Binding should be applied."); }
            dispose() {
                this.isDispossedField = true;
            }
        }
        TypeScript.BindingBase = BindingBase;
        class PropertyBinding extends BindingBase {
            constructor(context, evalExpression, elementPropertyName) {
                super(context, evalExpression);
                this.elementPropertyNameField = elementPropertyName;
            }
            get objectObserver() { return this.objectObserverField; }
            get elementPropertyName() { return this.elementPropertyNameField; }
            // Apply the reaction on the view model changes
            applyBinding() {
                this.objectObserverField = new ModernPropertyChangeObserver(this.context.thisContext, (changeInfo) => {
                    if (changeInfo.propertyName !== this.evalExpression.evalMember || this.isDispossed)
                        return;
                    this.updateView();
                });
                this.applyElementBinding();
                this.updateView();
            }
            applyElementBinding() { }
            getConverter() {
                return new ToStringConverter();
            }
            updateView() {
                var newValue = this.evalExpression.eval(this.context);
                var convertedValue = this.getConverter().convert(newValue);
                var currentElementValue = this.context.view[this.elementPropertyName];
                if (convertedValue === currentElementValue)
                    return;
                this.context.view[this.elementPropertyName] = convertedValue;
            }
            dispose() {
                this.objectObserverField.dispose();
                super.dispose();
            }
        }
        TypeScript.PropertyBinding = PropertyBinding;
        class DuplexBinding extends PropertyBinding {
            constructor(context, evalExpression, contextExpression, elementPropertyName, changeEventName) {
                super(context, evalExpression, elementPropertyName);
                this.changeEventName = changeEventName;
                this.contextExpression = contextExpression;
            }
            // Apply the reaction on dom element changes
            applyElementBinding() {
                // TODO: perform the validation
                var elementPropertyName = this.elementPropertyName;
                var context = this.context;
                var evalExpression = this.evalExpression;
                this.eventHandler = (e) => {
                    var convertedValue = this.getConverter().convertBack(context.view[elementPropertyName]);
                    var thisContext = this.contextExpression.eval(context);
                    // Set property back
                    thisContext[evalExpression.evalMember] = convertedValue;
                };
                this.context.view.addEventListener(this.changeEventName, this.eventHandler);
            }
            dispose() {
                this.context.view.removeEventListener(this.changeEventName, this.eventHandler);
                super.dispose();
            }
        }
        TypeScript.DuplexBinding = DuplexBinding;
        class ValueBinding extends DuplexBinding {
            constructor(context, evalExpression, contextExpression) {
                super(context, evalExpression, contextExpression, "value", "input");
            }
        }
        TypeScript.ValueBinding = ValueBinding;
        class SelectedBinding extends DuplexBinding {
            constructor(context, evalExpression, contextExpression) {
                super(context, evalExpression, contextExpression, "checked", "change");
            }
            getConverter() { return new CheckedConverter(); }
        }
        TypeScript.SelectedBinding = SelectedBinding;
        class CheckedConverter {
            convert(value) {
                return value;
            }
            convertBack(elementValue) {
                return elementValue;
            }
        }
        class StyleBinding extends PropertyBinding {
            updateView() {
                var newValue = this.evalExpression.eval(this.context);
                var convertedValue = this.getConverter().convert(newValue);
                this.context.view.style[this.elementPropertyName] = convertedValue;
            }
        }
        TypeScript.StyleBinding = StyleBinding;
        class VisiblilityBinding extends StyleBinding {
            constructor(context, evalExpression) {
                super(context, evalExpression, "display");
                this.elementDisplayValue = context.view.style["display"];
            }
            getConverter() { return new VisibilityValueConverter(this.elementDisplayValue); }
        }
        TypeScript.VisiblilityBinding = VisiblilityBinding;
        class VisibilityValueConverter {
            constructor(elementDisplayValue) {
                this.elementDisplayValue = elementDisplayValue;
            }
            convert(value) {
                return value ? this.elementDisplayValue : "none";
            }
            convertBack(elementValue) { throw new Error("Back convertion is not supported."); }
        }
        class TextBinding extends PropertyBinding {
            constructor(context, expression) {
                super(context, expression, "textContent");
            }
        }
        TypeScript.TextBinding = TextBinding;
        class ClassBinding extends PropertyBinding {
            constructor(context, expression) {
                super(context, expression);
                this.previousClass = "";
            }
            updateView() {
                var newValue = this.evalExpression.eval(this.context);
                var convertedValue = this.getConverter().convert(newValue);
                //this.context.view[this.elementPropertyName] = convertedValue;
                this.removePreviousClasses();
                var view = this.context.view;
                convertedValue.split(" ").forEach(c => {
                    if (c !== "")
                        view.classList.add(c);
                });
                this.previousClass = convertedValue;
            }
            dispose() {
                this.removePreviousClasses();
                super.dispose();
            }
            removePreviousClasses() {
                var view = this.context.view;
                this.previousClass.split(" ").forEach(c => {
                    if (c !== "")
                        view.classList.remove(c);
                });
            }
        }
        TypeScript.ClassBinding = ClassBinding;
        class ListBinding extends BindingBase {
            constructor(context, listExpression, binder) {
                super(context, listExpression);
                this.binder = binder;
                this.listBindingContexts = new Array();
                this.extractTemplate();
            }
            applyBinding() {
                this.clearElement();
                // perform observing for array property itself
                this.objectObserver = new ModernPropertyChangeObserver(this.context.thisContext, (changeInfo) => {
                    if (changeInfo.propertyName !== this.evalExpression.evalMember)
                        return;
                    // just perform rebinding
                    this.applyBinding();
                });
                // and now we have to observe collection changes
                var observedArray = this.evalExpression.eval(this.context);
                this.arrayObserver = new ModernArrayChangeObserver(observedArray, (changeInfos) => {
                    var list = this.evalExpression.eval(this.context);
                    // update each dom element according to changes
                    changeInfos.forEach(ci => {
                        switch (ci.action) {
                            case NotifyCollectionChangedAction.Add:
                                if (list[ci.index])
                                    this.addNewItem(list[ci.index], ci.index);
                                break;
                            case NotifyCollectionChangedAction.Delete:
                                this.deleteItem(ci.index);
                                break;
                            case NotifyCollectionChangedAction.Update:
                                if (list[ci.index])
                                    this.updateItem(ci.index, list[ci.index]);
                            default:
                                break;
                        }
                    });
                });
                this.populateElement();
            }
            extractTemplate() {
                this.template = document.createElement("div");
                for (var i = 0; i < this.context.view.children.length; i++) {
                    var clonedNode = this.context.view.children[i].cloneNode(true);
                    this.template.appendChild(clonedNode);
                }
                this.clearElement();
            }
            populateElement() {
                var list = this.evalExpression.eval(this.context);
                list.forEach((item, i) => this.addNewItem(item, i));
            }
            addNewItem(item, index) {
                var clonedTemplate = this.template.cloneNode(true);
                var context = new BindingContext(item, new Array(this.context.parents, item), this.context.root, clonedTemplate, index);
                // create bindings for cloned template
                var newBindings = this.binder.bind(context);
                var listBindingCtx = new ListBindingContex(new Array(), newBindings);
                newBindings.forEach(b => b.applyBinding());
                // add all children to our view
                while (clonedTemplate.children.length > 0) {
                    var child = clonedTemplate.children[0];
                    this.context.view.appendChild(child);
                    listBindingCtx.elements.push(child);
                }
                // Save new binding for updates
                this.listBindingContexts.push(listBindingCtx);
            }
            deleteItem(index) {
                var listBindingCtx = this.listBindingContexts[index];
                listBindingCtx.bindings.forEach(b => b.dispose());
                // dont know why sometimes this swiched to timer context
                listBindingCtx.elements.forEach(e => this.context.view.removeChild(e));
                this.listBindingContexts.splice(index, 1);
            }
            updateItem(index, item) {
                var listBindingCtx = this.listBindingContexts[index];
                // dispose all bindings
                listBindingCtx.bindings.forEach(b => b.dispose());
                listBindingCtx.bindings.splice(0, listBindingCtx.bindings.length);
                // and recreate all
                listBindingCtx.elements.forEach(e => {
                    var context = new BindingContext(item, new Array(this.context.parents, item), this.context.root, e, index);
                    var newBindings = this.binder.bind(context, true);
                    newBindings.forEach(b => {
                        b.applyBinding();
                        listBindingCtx.bindings.push(b);
                    });
                });
            }
            clearElement() {
                while (this.context.view.firstChild) {
                    this.context.view.removeChild(this.context.view.firstChild);
                }
            }
            dispose() {
                this.objectObserver.dispose();
                super.dispose();
            }
        }
        TypeScript.ListBinding = ListBinding;
        class ListBindingContex {
            constructor(elements, bindings) {
                this.elements = elements;
                this.bindings = bindings;
            }
        }
        class EventBinding extends BindingBase {
            constructor(context, eventExpression, eventName) {
                super(context, eventExpression);
                this.eventNameField = eventName;
            }
            get eventName() { return this.eventNameField; }
            applyBinding() {
                // create local scope because addEventListener forces to set "this" to dom element
                var thisContext = this.context;
                this.eventHandler = (e) => {
                    this.evalEventHandler(e, thisContext);
                    //e.preventDefault();
                    //if (this.isDispossed) return;
                    //this.evalExpression.eval(thisContext);
                };
                this.context.view.addEventListener(this.eventName, this.eventHandler);
            }
            dispose() {
                this.context.view.removeEventListener(this.eventName, this.eventHandler);
                super.dispose();
            }
            evalEventHandler(e, thisContext) {
                e.preventDefault();
                if (this.isDispossed)
                    return;
                this.evalExpression.eval(thisContext);
            }
        }
        TypeScript.EventBinding = EventBinding;
        class EscapeBinding extends EventBinding {
            constructor(context, eventExpression) {
                super(context, eventExpression, "keyup");
            }
            evalEventHandler(e, thisContext) {
                if (e.keyCode !== 27)
                    return;
                e.preventDefault();
                if (this.isDispossed)
                    return;
                this.evalExpression.eval(thisContext);
                this.context.view.blur();
            }
        }
        TypeScript.EscapeBinding = EscapeBinding;
        class ToStringConverter {
            convert(value) {
                if (value == null)
                    return "";
                return value.toString();
            }
            convertBack(elementValue) {
                return elementValue;
            }
        }
        TypeScript.ToStringConverter = ToStringConverter;
        class BindingContext {
            constructor(thisContext, parents, root, view, index) {
                this.thisContextField = thisContext;
                this.parentsField = parents;
                this.rootField = root;
                this.viewField = view;
                this.indexField = index;
            }
            get thisContext() { return this.thisContextField; }
            get parents() { return this.parentsField; }
            get root() { return this.rootField; }
            get view() { return this.viewField; }
            get index() { return this.indexField; }
        }
        TypeScript.BindingContext = BindingContext;
        class ModernPropertyChangeObserver {
            constructor(observable, handler) {
                this.observable = observable;
                this.handler = handler;
                this.subscribe();
            }
            subscribe() {
                this.observeFunc = e => {
                    for (var i = 0; i < e.length; i++) {
                        this.handler({ propertyName: e[i].name });
                    }
                };
                if (this.observable == null || typeof this.observable == "string")
                    return;
                Object.observe(this.observable, this.observeFunc);
            }
            dispose() {
                Object.unobserve(this.observable, this.observeFunc);
            }
        }
        TypeScript.ModernPropertyChangeObserver = ModernPropertyChangeObserver;
        (function (NotifyCollectionChangedAction) {
            NotifyCollectionChangedAction[NotifyCollectionChangedAction["Add"] = 0] = "Add";
            NotifyCollectionChangedAction[NotifyCollectionChangedAction["Update"] = 1] = "Update";
            NotifyCollectionChangedAction[NotifyCollectionChangedAction["Delete"] = 2] = "Delete";
        })(TypeScript.NotifyCollectionChangedAction || (TypeScript.NotifyCollectionChangedAction = {}));
        var NotifyCollectionChangedAction = TypeScript.NotifyCollectionChangedAction;
        class ModernArrayChangeObserver {
            constructor(observableArray, handler) {
                this.observableArray = observableArray;
                this.handler = handler;
                this.subscribe();
            }
            subscribe() {
                this.observeFunc = e => {
                    var changeInfos = new Array();
                    for (var i = 0; i < e.length; i++) {
                        if (e[i].name === "length")
                            continue;
                        var action;
                        switch (e[i].type) {
                            case "add":
                                action = NotifyCollectionChangedAction.Add;
                                break;
                            case "update":
                                action = NotifyCollectionChangedAction.Update;
                                break;
                            case "delete":
                                action = NotifyCollectionChangedAction.Delete;
                                break;
                            default:
                                throw new Error("Unknown change");
                        }
                        changeInfos.push({
                            action: action,
                            index: parseInt(e[i].name)
                        });
                    }
                    this.handler(changeInfos);
                };
                Object.observe(this.observableArray, this.observeFunc);
            }
            dispose() {
                Object.unobserve(this.observableArray, this.observeFunc);
            }
        }
    })(TypeScript = Mvvm.TypeScript || (Mvvm.TypeScript = {}));
})(Mvvm || (Mvvm = {}));
//# sourceMappingURL=Mvvm.TypeScript.js.map