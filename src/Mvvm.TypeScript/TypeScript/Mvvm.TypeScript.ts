module Mvvm.TypeScript {

    export class Application {

        private binder: IBinder;
        private parser: IExpressionParser;

        constructor() {
            this.initialize();
        }

        private initialize() {
            this.binder = this.getBinder();
            this.parser = this.getExpressionParser();
        }

        protected getBinder(): IBinder {
            return new Binder();
        }

        protected  getExpressionParser(): IExpressionParser {
            return new ExpressionParser();
        }

    }

    export interface IExpressionParser {
        
        parse(exprValue: string): Array<{propName: IExpression}>;

    }

    class ExpressionParser implements IExpressionParser {

        parse(exprValue: string): Array<{ propName: IExpression }> { throw new Error("Not implemented"); }
    }

    export interface IExpression {

        eval(): string;

    }

    export interface IBinder {
        
        bind(view: HTMLElement, viewModel: any): Array<BindingBase>;

    }

    class Binder implements IBinder {

        bind(view: HTMLElement, viewModel): Array<BindingBase> { throw new Error("Not implemented"); }
    }

    export class BindingBase {

        private contextField: BindingContext;
        protected get context(): BindingContext { return this.contextField; }

        constructor(context: BindingContext) {
            this.contextField = context;
        }

        dispose() {
            
        }

    }

    export class BindingContext {

        private viewModelField: any;
        get viewModel(): any { return this.viewModelField; }
        set viewModel(value: any) { this.viewModelField = value; }

        private propertyNameField: string;
        get propertyName(): string { return this.propertyNameField; }
        set propertyName(value: string) { this.propertyNameField = value; }

    }

}