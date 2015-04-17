class ExampleViewModel  {

    name: string;

    bithday: Date;

    isVisible: boolean;

    someArray: Array<string>;

}

class ExampleApplication extends Mvvm.TypeScript.Application {
    
    protected getRoot(): any {
        var rootViewModel = new ExampleViewModel();
        rootViewModel.name = "Hello";
        rootViewModel.bithday = new Date(2000, 1, 1);
        rootViewModel.isVisible = false;
        rootViewModel.someArray = ["Hello", "World"];

        return rootViewModel;
    }

}

window.onload = (e) => {

    //var testArray = [1, 2, 3];
    //Object.observe(testArray, (e) => {
    //    console.log(e);
    //});

    //testArray.push(10);
    //testArray.splice(0, 1);


    var app = new ExampleApplication();
    app.startup();    
};

