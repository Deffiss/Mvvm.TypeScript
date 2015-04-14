class ExampleViewModel  {

    name: string;

    bithday: Date;

    isVisible: boolean;

}

class ExampleApplication extends Mvvm.TypeScript.Application {
    
    protected getRoot(): any {
        var rootViewModel = new ExampleViewModel();
        rootViewModel.name = "Hello";
        rootViewModel.bithday = new Date(2000, 1, 1);
        rootViewModel.isVisible = false;

        return rootViewModel;
    }

}

window.onload = (e) => {
    var app = new ExampleApplication();
    app.startup();    
};

