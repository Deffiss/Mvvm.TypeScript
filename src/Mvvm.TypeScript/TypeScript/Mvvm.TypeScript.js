var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mvvm;
(function (Mvvm) {
    var TypeScript;
    (function (TypeScript) {
        var Application = (function () {
            function Application() {
                this.initialize();
            }
            Application.prototype.startup = function () {
                var context = new BindingContext(this.root, new Array(this.root), this.root, document.body);
                this.bindings = this.binder.bind(context);
            };
            Application.prototype.dispose = function () {
                this.bindings.forEach(function (binding) {
                    binding.dispose();
                });
            };
            Application.prototype.getBinder = function () {
                return new Binder(this.parser);
            };
            Application.prototype.getExpressionParser = function () {
                return new ExpressionParser();
            };
            Application.prototype.getRoot = function () {
                throw new Error("Root view model should be provided");
            };
            Application.prototype.initialize = function () {
                this.parser = this.getExpressionParser();
                this.binder = this.getBinder();
                this.root = this.getRoot();
            };
            return Application;
        })();
        TypeScript.Application = Application;
        var ExpressionParser = (function () {
            function ExpressionParser() {
            }
            ExpressionParser.prototype.parse = function (exprValue, context) {
                var expressions = new Array();
                exprValue.split(",").forEach(function (bindingExpr) {
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
            };
            //private static contextRegexp: RegExp = new RegExp("(?<params>(?<param>[^\.]+)(?:\.(?<param>[^\.]+))*");
            ExpressionParser.contextRegexp = new RegExp("");
            ExpressionParser.propertyNameExpression = new RegExp("");
            return ExpressionParser;
        })();
        var Expression = (function () {
            function Expression(body) {
                var scopedBody = "with($this){return " + body + ";}";
                this.exprFunction = new Function("$this", "$parent", "$parents", "$root", scopedBody);
                this.evalMemberField = body.trim();
            }
            Object.defineProperty(Expression.prototype, "evalMember", {
                get: function () {
                    // TODO: perform calculation of invoked member
                    return this.evalMemberField;
                },
                enumerable: true,
                configurable: true
            });
            Expression.prototype.eval = function (context) {
                return this.exprFunction(context.thisContext, context.parents[context.parents.length - 1], context.parents, context.root);
            };
            return Expression;
        })();
        TypeScript.Expression = Expression;
        var Binder = (function () {
            function Binder(parser) {
                this.bindingFactories = {
                    "text": new SimpleBindingFactory(function (ctx, expr) { return new TextBinding(ctx, expr); }),
                    "value": new SimpleBindingFactory(function (ctx, evalExpr, ctxExpr) { return new ValueBinding(ctx, evalExpr, ctxExpr); }),
                    "visible": new SimpleBindingFactory(function (ctx, evalExpr) { return new VisiblilityBinding(ctx, evalExpr); }),
                    "selected": new SimpleBindingFactory(function (ctx, evalExpr, ctxExpr) { return new SelectedBinding(ctx, evalExpr, ctxExpr); })
                };
                this.parser = parser;
            }
            Binder.prototype.bind = function (context) {
                var _this = this;
                var bindingList = new Array();
                for (var i = 0; i < context.view.children.length; i++) {
                    var child = context.view.children[i];
                    var thisContext;
                    var parents;
                    // data-context
                    var dataContextAttr = child.attributes.getNamedItem("data-context");
                    if (dataContextAttr != null) {
                        var ctxExpression = new Expression(dataContextAttr.value);
                        thisContext = ctxExpression.eval(context);
                        parents = new Array(context.parents, context.thisContext);
                    }
                    else {
                        thisContext = context.thisContext;
                        parents = context.parents;
                    }
                    var newContext = new BindingContext(thisContext, parents, context.root, child);
                    // data-bind
                    var dataBindAttr = child.attributes.getNamedItem("data-bind");
                    if (dataBindAttr != null) {
                        var expressions = this.parser.parse(dataBindAttr.value, newContext);
                        expressions.forEach(function (expr) {
                            var bindingFactory = _this.bindingFactories[expr.bindingName];
                            var binding = bindingFactory != null ? bindingFactory.buildBinding(newContext, expr.evalExpression, expr.contextExpression) : _this.defaultBindingFactory.buildBinding(newContext, expr.evalExpression, expr.contextExpression);
                            bindingList.push(binding);
                        });
                    }
                    // store to list
                    this.bind(newContext).forEach(function (binding) {
                        bindingList.push(binding);
                    });
                }
                return bindingList;
            };
            return Binder;
        })();
        var SimpleBindingFactory = (function () {
            function SimpleBindingFactory(buildBinding) {
                this.buildBinding = buildBinding;
            }
            SimpleBindingFactory.prototype.buildBinding = function (context, evalExpression, contextExpression) {
                return this.buildBinding(context, evalExpression, contextExpression);
            };
            return SimpleBindingFactory;
        })();
        var BindingBase = (function () {
            function BindingBase(context, evalExpression) {
                this.contextField = context;
                this.evalExpressionField = evalExpression;
                this.applyBinding();
            }
            Object.defineProperty(BindingBase.prototype, "context", {
                get: function () {
                    return this.contextField;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BindingBase.prototype, "evalExpression", {
                get: function () {
                    return this.evalExpressionField;
                },
                enumerable: true,
                configurable: true
            });
            BindingBase.prototype.getConverter = function () {
                return new ToStringConverter();
            };
            BindingBase.prototype.applyBinding = function () {
                throw new Error("Binding should be applied.");
            };
            BindingBase.prototype.dispose = function () {
            };
            return BindingBase;
        })();
        TypeScript.BindingBase = BindingBase;
        var PropertyBinding = (function (_super) {
            __extends(PropertyBinding, _super);
            function PropertyBinding(context, evalExpression, elementPropertyName) {
                this.elementPropertyNameField = elementPropertyName;
                _super.call(this, context, evalExpression);
            }
            Object.defineProperty(PropertyBinding.prototype, "elementPropertyName", {
                get: function () {
                    return this.elementPropertyNameField;
                },
                enumerable: true,
                configurable: true
            });
            PropertyBinding.prototype.applyBinding = function () {
                var _this = this;
                this.objectObserver = new PropertyChangeObserver(this.context.thisContext, function (changeInfo) {
                    if (changeInfo.propertyName !== _this.evalExpression.evalMember)
                        return;
                    _this.updateView();
                });
                this.applyElementBinding();
                this.updateView();
            };
            PropertyBinding.prototype.applyElementBinding = function () {
            };
            PropertyBinding.prototype.updateView = function () {
                var newValue = this.evalExpression.eval(this.context);
                var convertedValue = this.getConverter().convert(newValue);
                this.context.view[this.elementPropertyName] = convertedValue;
            };
            return PropertyBinding;
        })(BindingBase);
        TypeScript.PropertyBinding = PropertyBinding;
        var DuplexBinding = (function (_super) {
            __extends(DuplexBinding, _super);
            function DuplexBinding(context, evalExpression, contextExpression, elementPropertyName, changeEventName) {
                this.changeEventName = changeEventName;
                this.contextExpression = contextExpression;
                _super.call(this, context, evalExpression, elementPropertyName);
            }
            DuplexBinding.prototype.applyElementBinding = function () {
                var _this = this;
                // TODO: perform the validation
                var elementPropertyName = this.elementPropertyName;
                var context = this.context;
                var evalExpression = this.evalExpression;
                this.context.view.addEventListener(this.changeEventName, function (e) {
                    var convertedValue = _this.getConverter().convertBack(context.view[elementPropertyName]);
                    var thisContext = _this.contextExpression.eval(context);
                    // Set property back
                    thisContext[evalExpression.evalMember] = convertedValue;
                });
            };
            return DuplexBinding;
        })(PropertyBinding);
        TypeScript.DuplexBinding = DuplexBinding;
        var ValueBinding = (function (_super) {
            __extends(ValueBinding, _super);
            function ValueBinding(context, evalExpression, contextExpression) {
                _super.call(this, context, evalExpression, contextExpression, "value", "input");
            } //constructor(context: BindingContext, evalExpression: IExpression, private contextExpression: IExpression) {
            return ValueBinding;
        })(DuplexBinding);
        TypeScript.ValueBinding = ValueBinding;
        var SelectedBinding = (function (_super) {
            __extends(SelectedBinding, _super);
            function SelectedBinding(context, evalExpression, contextExpression) {
                _super.call(this, context, evalExpression, contextExpression, "checked", "change");
            }
            //constructor(context: BindingContext, evalExpression: IExpression, private contextExpression: IExpression) {
            //    super(context, evalExpression, "checked");
            //}
            //protected applyElementBinding() {
            //    // TODO: perform the validation
            //    var elementPropertyName = this.elementPropertyName;
            //    var context = this.context;
            //    var evalExpression = this.evalExpression;
            //    this.context.view.addEventListener("change", (e) => {
            //        var convertedValue = this.getConverter().convertBack(context.view[elementPropertyName]);
            //        var thisContext = this.contextExpression.eval(context);
            //        // Set property back
            //        thisContext[evalExpression.evalMember] = convertedValue;
            //    });
            //}
            SelectedBinding.prototype.getConverter = function () {
                return new CheckedConverter();
            };
            return SelectedBinding;
        })(DuplexBinding);
        TypeScript.SelectedBinding = SelectedBinding;
        var CheckedConverter = (function () {
            function CheckedConverter() {
            }
            CheckedConverter.prototype.convert = function (value) {
                return value;
            };
            CheckedConverter.prototype.convertBack = function (elementValue) {
                return elementValue;
            };
            return CheckedConverter;
        })();
        var StyleBinding = (function (_super) {
            __extends(StyleBinding, _super);
            function StyleBinding() {
                _super.apply(this, arguments);
            }
            StyleBinding.prototype.updateView = function () {
                var newValue = this.evalExpression.eval(this.context);
                var convertedValue = this.getConverter().convert(newValue);
                this.context.view.style[this.elementPropertyName] = convertedValue;
            };
            return StyleBinding;
        })(PropertyBinding);
        TypeScript.StyleBinding = StyleBinding;
        var VisiblilityBinding = (function (_super) {
            __extends(VisiblilityBinding, _super);
            function VisiblilityBinding(context, evalExpression) {
                _super.call(this, context, evalExpression, "visibility");
            }
            VisiblilityBinding.prototype.getConverter = function () {
                return new VisibilityValueConverter();
            };
            return VisiblilityBinding;
        })(StyleBinding);
        TypeScript.VisiblilityBinding = VisiblilityBinding;
        var VisibilityValueConverter = (function () {
            function VisibilityValueConverter() {
            }
            VisibilityValueConverter.prototype.convert = function (value) {
                return value ? "visible" : "collapse";
            };
            VisibilityValueConverter.prototype.convertBack = function (elementValue) {
                throw new Error("Back convertion is not supported.");
            };
            return VisibilityValueConverter;
        })();
        var TextBinding = (function (_super) {
            __extends(TextBinding, _super);
            function TextBinding(context, expression) {
                _super.call(this, context, expression, "innerText");
            }
            return TextBinding;
        })(PropertyBinding);
        TypeScript.TextBinding = TextBinding;
        var EventBinding = (function (_super) {
            __extends(EventBinding, _super);
            function EventBinding(context, expression, eventName) {
                _super.call(this, context, expression);
                this.eventNameField = eventName;
            }
            Object.defineProperty(EventBinding.prototype, "eventName", {
                get: function () {
                    return this.eventNameField;
                },
                enumerable: true,
                configurable: true
            });
            EventBinding.prototype.applyBinding = function () {
                var _this = this;
                this.context.view.addEventListener(this.eventName, function () {
                    _this.evalExpression.eval(_this.context);
                });
            };
            return EventBinding;
        })(BindingBase);
        TypeScript.EventBinding = EventBinding;
        var ToStringConverter = (function () {
            function ToStringConverter() {
            }
            ToStringConverter.prototype.convert = function (value) {
                return value.toString();
            };
            ToStringConverter.prototype.convertBack = function (elementValue) {
                return elementValue;
            };
            return ToStringConverter;
        })();
        TypeScript.ToStringConverter = ToStringConverter;
        var BindingContext = (function () {
            function BindingContext(thisContext, parents, root, view) {
                this.thisContextField = thisContext;
                this.parentsField = parents;
                this.viewField = view;
            }
            Object.defineProperty(BindingContext.prototype, "thisContext", {
                get: function () {
                    return this.thisContextField;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BindingContext.prototype, "parents", {
                get: function () {
                    return this.parentsField;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BindingContext.prototype, "root", {
                get: function () {
                    return this.rootField;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BindingContext.prototype, "view", {
                get: function () {
                    return this.viewField;
                },
                enumerable: true,
                configurable: true
            });
            return BindingContext;
        })();
        TypeScript.BindingContext = BindingContext;
        var PropertyChangeObserver = (function () {
            function PropertyChangeObserver(observable, handler) {
                this.observable = observable;
                this.handler = handler;
                this.observable.subscribe(this);
            }
            PropertyChangeObserver.prototype.propertyChanged = function (sender, changeInfo) {
                this.handler(changeInfo);
            };
            return PropertyChangeObserver;
        })();
        var ViewModelBase = (function () {
            function ViewModelBase() {
                this.changeSubscribers = new Array();
            }
            ViewModelBase.prototype.subscribe = function (handler) {
                this.changeSubscribers.push(handler);
            };
            ViewModelBase.prototype.unsubscribe = function (handler) {
                this.changeSubscribers.splice(0, this.changeSubscribers.indexOf(handler));
            };
            ViewModelBase.prototype.notifyPropertyChanged = function (changeInfo) {
                var _this = this;
                this.changeSubscribers.forEach(function (value) {
                    value.propertyChanged(_this, changeInfo);
                });
            };
            return ViewModelBase;
        })();
        TypeScript.ViewModelBase = ViewModelBase;
        var BindableArray = (function () {
            function BindableArray(innerArray) {
                this.innerArray = innerArray;
                this.changeSubscribers = new Array();
            }
            Object.defineProperty(BindableArray.prototype, "innerArray", {
                get: function () {
                    return this.innerArrayField;
                },
                enumerable: true,
                configurable: true
            });
            BindableArray.prototype.add = function (item) {
                var _this = this;
                this.innerArrayField.push(item);
                this.changeSubscribers.forEach(function (value) {
                    value.collectionChanged(_this, { added: new Array(item), removed: new Array() });
                });
            };
            BindableArray.prototype.remove = function (item) {
                var _this = this;
                this.innerArrayField.splice(0, this.innerArray.indexOf(item));
                this.changeSubscribers.forEach(function (value) {
                    value.collectionChanged(_this, { added: new Array(), removed: new Array(item) });
                });
            };
            BindableArray.prototype.subscribe = function (handler) {
                this.changeSubscribers.push(handler);
            };
            BindableArray.prototype.unsubscribe = function (handler) {
                this.changeSubscribers.splice(0, this.changeSubscribers.indexOf(handler));
            };
            return BindableArray;
        })();
        TypeScript.BindableArray = BindableArray;
    })(TypeScript = Mvvm.TypeScript || (Mvvm.TypeScript = {}));
})(Mvvm || (Mvvm = {}));
//# sourceMappingURL=Mvvm.TypeScript.js.map