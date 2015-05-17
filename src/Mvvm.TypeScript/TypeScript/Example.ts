class TodoItemViewModel {
    private unmodifiedDescription: string;
    isDone = false;
    isEditing = false;
    editStatus = "";
    completeStatus = "";

    constructor(public description: string) {
    }

    startEditing() {
        this.isEditing = true;
        this.editStatus = "editing";
        this.unmodifiedDescription = this.description;
    }

    endEditing() {
        this.isEditing = false;
        this.editStatus = "";
    }

    cancelEditing() {
        this.isEditing = false;
        this.editStatus = "";
        this.description = this.unmodifiedDescription;
    }

    completionChanged() {
        if (this.isDone) {
            this.completeStatus = "completed";
        } else {
            this.completeStatus = "";
        }
    }

}

enum TodoFilter {
    All,
    Active,
    Completed
}

class FilterViewModel {
    currentFilter: TodoFilter = TodoFilter.All;

    allFilterStatus: string = "selected";
    activeFilterStatus: string = "";
    completedFilterStatus: string = "";

    setCurrentFilter(filter: TodoFilter) {
        this.currentFilter = filter;
        this.allFilterStatus = "";
        this.activeFilterStatus = "";
        this.completedFilterStatus = "";
        switch (filter) {
            case TodoFilter.All:
                this.allFilterStatus = "selected";
                break;
            case TodoFilter.Active:
                this.activeFilterStatus = "selected";
                break;
            case TodoFilter.Completed:
                this.completedFilterStatus = "selected";
                break;
            default:
                break;
        }
    }

}

class TodoViewModel {
    newItemDescription: string;

    waitingTodosCount: number;

    allToggled: boolean;
    hasCompletedTodos: boolean;
    hasTodos: boolean;

    filteredTodoItems: Array<TodoItemViewModel>;
    todoItems: Array<TodoItemViewModel>;

    filter: FilterViewModel;

    constructor() {
        this.newItemDescription = null;
        this.todoItems = new Array();
        this.filteredTodoItems = new Array();
        this.waitingTodosCount = 0;
        this.allToggled = false;
        this.hasCompletedTodos = false;
        this.hasTodos = false;
        this.filter = new FilterViewModel();
    }

    addNewItem() {
        var newTodo = new TodoItemViewModel(this.newItemDescription);
        if (this.filter.currentFilter === TodoFilter.All
            || this.filter.currentFilter === TodoFilter.Active) {
            this.filteredTodoItems.push(newTodo);            
        }

        this.todoItems.push(newTodo);
        this.newItemDescription = null;
        this.updateCounts();
    }

    removeItem(itemIndex: number) {
        var todo = this.filteredTodoItems[itemIndex];
        this.filteredTodoItems.splice(itemIndex, 1);

        this.todoItems.splice(this.todoItems.indexOf(todo), 1);

        this.updateCounts();
    }

    checkTodo(item: TodoItemViewModel) {
        item.completionChanged();
        this.updateCounts();

        if (item.isDone && this.filter.currentFilter === TodoFilter.Active) {
            this.filteredTodoItems.splice(this.filteredTodoItems.indexOf(item), 1);
        }
        if (!item.isDone && this.filter.currentFilter === TodoFilter.Completed) {
            this.filteredTodoItems.splice(this.filteredTodoItems.indexOf(item), 1);
        }
    }

    updateCounts() {
        var notCompletedCount: number = 0;
        this.todoItems.forEach(item => {
            if (!item.isDone) notCompletedCount++;
        });
        this.waitingTodosCount = notCompletedCount;
        this.hasTodos = this.todoItems.length !== 0;
        this.allToggled = notCompletedCount === 0 && this.hasTodos;
        this.hasCompletedTodos = notCompletedCount !== this.todoItems.length;
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
        if (this.filter.currentFilter === TodoFilter.Completed
            && this.filteredTodoItems.length != this.todoItems.length) {
            this.updateCurrentCollection();
        }
    }

    clearCompleted() {
        [this.todoItems, this.filteredTodoItems].forEach(collection => {
            for (var todoNumber = 0; todoNumber < collection.length;) {
                var todo = collection[todoNumber];
                if (todo.isDone) {
                    collection.splice(todoNumber, 1);
                    continue;
                }
                todoNumber++;
            }
        });

        this.updateCounts();
    }

    filterTodos(filter: TodoFilter) {
        this.filter.setCurrentFilter(filter);
        this.updateCurrentCollection();
    }

    private updateCurrentCollection() {
        var filterFunc: (todo: TodoItemViewModel) => boolean;
        switch (this.filter.currentFilter) {
            case TodoFilter.All:
                filterFunc = () => true;
                break;
            case TodoFilter.Active:
                filterFunc = (item) => !item.isDone;
                break;
            case TodoFilter.Completed:
                filterFunc = (item) => item.isDone;
                break;
            default:
                break;
        }
        this.filteredTodoItems.splice(0);
        this.todoItems.forEach((todo) => {
            if (filterFunc(todo)) this.filteredTodoItems.push(todo);
        });
    }
}

class TodoApplication extends Mvvm.TypeScript.Application {
    protected getRoot(): any {
        var rootViewModel = new TodoViewModel();
        return rootViewModel;
    }
}

window.onload = (e) => {
    var app = new TodoApplication();
    app.startup();
};

