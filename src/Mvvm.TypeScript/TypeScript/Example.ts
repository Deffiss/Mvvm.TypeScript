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
    isEditing = false;
    editStatus = "";
    completeStatus = "";

    constructor(public description: string) {
    }

    startEditing() {
        this.isEditing = true;
        this.editStatus = "editing";
    }

    endEditing() {
        this.isEditing = false;
        this.editStatus = "";
    }

    completionChanged() {
        if (this.isDone) {
            this.completeStatus = "completed";
        } else {
            this.completeStatus = "";
        }
    }

}


class TodoViewModel {
    newItemDescription: string;
    waitingTodosCount: number;
    allToggled: boolean;
    currentTodoCollection: Array<TodoItemViewModel>;
    todoItems: Array<TodoItemViewModel>;

    constructor() {
        this.newItemDescription = null;
        this.todoItems = new Array();
        this.currentTodoCollection = this.todoItems;
        this.waitingTodosCount = 0;
        this.allToggled = false;
    }

    addNewItem() {
        var newTodo = new TodoItemViewModel(this.newItemDescription);
        this.todoItems.push(newTodo);
        this.newItemDescription = null;
        this.updateCounts();
    }

    removeItem(itemIndex: number) {
        this.todoItems.splice(itemIndex, 1);
        this.updateCounts();
    }

    checkTodo(item: TodoItemViewModel) {
        item.completionChanged();
        this.updateCounts();
    }

    updateCounts() {
        var count: number = 0;
        this.todoItems.forEach(item => {
            if (!item.isDone) count++;
        });
        this.waitingTodosCount = count;
        this.allToggled = count === 0;
    }

    toggleAll() {
        if (this.allToggled) {
            this.todoItems.forEach(item => {
                item.isDone = true;
                item.completionChanged();
            });
        } else {
            this.todoItems.forEach(item => {
                item.isDone = false;
                item.completionChanged();
            });
        }
        this.updateCounts();
    }

    clearCompleted() {
        for (var todoNumber = 0; todoNumber < this.todoItems.length;) {
            var todo = this.todoItems[todoNumber];
            if (todo.isDone) {
                this.todoItems.splice(todoNumber, 1);
                continue;
            }
            todoNumber++;
        }
        this.updateCounts();
    }
}



class TodoApplication extends Mvvm.TypeScript.Application {
    protected getRoot(): any {
        var rootViewModel = new TodoViewModel();
        //rootViewModel.todoItems.push(new TodoItemViewModel("Hello"));
        //rootViewModel.todoItems.push(new TodoItemViewModel("World"));
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

