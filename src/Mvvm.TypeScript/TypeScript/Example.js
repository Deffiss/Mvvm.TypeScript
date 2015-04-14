var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ExampleViewModel = (function () {
    function ExampleViewModel() {
    }
    return ExampleViewModel;
})();
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