class TodoItemViewModel {
    constructor(description) {
        this.description = description;
        this.isDone = false;
        this.isEditing = false;
        this.editStatus = "";
        this.completeStatus = "";
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
        }
        else {
            this.completeStatus = "";
        }
    }
}
var TodoFilter;
(function (TodoFilter) {
    TodoFilter[TodoFilter["All"] = 0] = "All";
    TodoFilter[TodoFilter["Active"] = 1] = "Active";
    TodoFilter[TodoFilter["Completed"] = 2] = "Completed";
})(TodoFilter || (TodoFilter = {}));
class FilterViewModel {
    constructor() {
        this.currentFilter = TodoFilter.All;
        this.allFilterStatus = "selected";
        this.activeFilterStatus = "";
        this.completedFilterStatus = "";
    }
    setCurrentFilter(filter) {
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
    addItem(description, isDone) {
        var newTodo = new TodoItemViewModel(description);
        newTodo.isDone = isDone;
        if (isDone)
            newTodo.completionChanged();
        if (this.filter.currentFilter === TodoFilter.All
            || (this.filter.currentFilter === TodoFilter.Active && !isDone)
            || (this.filter.currentFilter === TodoFilter.Completed && isDone)) {
            this.filteredTodoItems.push(newTodo);
        }
        this.todoItems.push(newTodo);
        this.newItemDescription = null;
        this.updateCounts();
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
    removeItem(itemIndex) {
        var todo = this.filteredTodoItems[itemIndex];
        this.filteredTodoItems.splice(itemIndex, 1);
        this.todoItems.splice(this.todoItems.indexOf(todo), 1);
        this.updateCounts();
    }
    checkTodo(item) {
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
        var notCompletedCount = 0;
        this.todoItems.forEach(item => {
            if (!item.isDone)
                notCompletedCount++;
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
        }
        else {
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
    filterTodos(filter) {
        this.filter.setCurrentFilter(filter);
        this.updateCurrentCollection();
    }
    updateCurrentCollection() {
        var filterFunc;
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
            if (filterFunc(todo))
                this.filteredTodoItems.push(todo);
        });
    }
}
var rootViewModel = new TodoViewModel();
class TodoApplication extends Mvvm.TypeScript.Application {
    getRoot() {
        return rootViewModel;
    }
}
window.onload = (e) => {
    if (Storage) {
        var todos = JSON.parse(localStorage.getItem("todos"));
        if (todos) {
            for (var todoNumber = 0; todoNumber < todos.length; todoNumber++) {
                rootViewModel.addItem(todos[todoNumber].description, todos[todoNumber].isDone);
            }
        }
    }
    var app = new TodoApplication();
    app.startup();
};
if (Storage) {
    window.addEventListener("unload", e => {
        var serializedTodos = JSON.stringify(rootViewModel.todoItems);
        localStorage.setItem("todos", serializedTodos);
    });
}
//# sourceMappingURL=Example.js.map