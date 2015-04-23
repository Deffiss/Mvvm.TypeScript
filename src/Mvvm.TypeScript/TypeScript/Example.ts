//class ExampleViewModel  {

//    name: string;

//    bithday: Date;

//    isVisible: boolean;

//    someArray: Array<string>;

//}

//var rootViewModel = new ExampleViewModel();
//rootViewModel.name = "Hello";
//rootViewModel.bithday = new Date(2000, 1, 1);
//rootViewModel.isVisible = false;
//rootViewModel.someArray = ["Hello", "World"];

//class ExampleApplication extends Mvvm.TypeScript.Application {
    
//    protected getRoot(): any {
//        return rootViewModel;
//    }

//}

class TodoItemViewModel {
    isDone = false;

    constructor(public description: string) {
    }
}


class TodoViewModel {
    newItemDescription: string;
    todoItems: Array<TodoItemViewModel>;

    constructor() {
        this.newItemDescription = null;
        this.todoItems = new Array();
    }

    addNewItem() {
        this.todoItems.push(new TodoItemViewModel(this.newItemDescription));
        this.newItemDescription = null;
    }

    removeItem(itemIndex: number) {
        this.todoItems.splice(itemIndex, 1);
    }

}



class TodoApplication extends Mvvm.TypeScript.Application {
    protected getRoot(): any {
        var rootViewModel = new TodoViewModel();
        rootViewModel.todoItems.push(new TodoItemViewModel("Hello"));
        rootViewModel.todoItems.push(new TodoItemViewModel("World"));
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


    var app = new TodoApplication();
    app.startup();


    //rootViewModel.someArray.splice(1, 1);
    //rootViewModel.someArray.push("c#");
    //rootViewModel.someArray.push("in");
    //rootViewModel.someArray.push("depth");

    //rootViewModel.someArray[1] = "WPF";

};

