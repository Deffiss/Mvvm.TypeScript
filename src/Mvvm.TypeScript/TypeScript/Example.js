var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ExampleViewModel = (function (_super) {
    __extends(ExampleViewModel, _super);
    function ExampleViewModel() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(ExampleViewModel.prototype, "name", {
        get: function () {
            return this.nameField;
        },
        set: function (value) {
            if (value === this.nameField)
                return;
            this.nameField = value;
            this.notifyPropertyChanged({ propertyName: "name" });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExampleViewModel.prototype, "bithday", {
        get: function () {
            return this.bithdayField;
        },
        set: function (value) {
            if (value === this.bithdayField)
                return;
            this.bithdayField = value;
            this.notifyPropertyChanged({ propertyName: "bithday" });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExampleViewModel.prototype, "isVisible", {
        get: function () {
            return this.isVisibleField;
        },
        set: function (value) {
            if (value === this.isVisibleField)
                return;
            this.isVisibleField = value;
            this.notifyPropertyChanged({ propertyName: "isVisible" });
        },
        enumerable: true,
        configurable: true
    });
    return ExampleViewModel;
})(Mvvm.TypeScript.ViewModelBase);
var ExampleApplication = (function (_super) {
    __extends(ExampleApplication, _super);
    function ExampleApplication() {
        _super.apply(this, arguments);
    }
    ExampleApplication.prototype.getRoot = function () {
        var rootViewModel = new ExampleViewModel();
        rootViewModel.name = "Hello";
        rootViewModel.bithday = new Date(2000, 1, 1);
        rootViewModel.isVisible = false;
        return rootViewModel;
    };
    return ExampleApplication;
})(Mvvm.TypeScript.Application);
window.onload = function (e) {
    var app = new ExampleApplication();
    app.startup();
};
//# sourceMappingURL=Example.js.map