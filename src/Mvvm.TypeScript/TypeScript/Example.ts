class ExampleViewModel extends Mvvm.TypeScript.ViewModelBase {

    private nameField: string;
    get name(): string { return this.nameField; }
    set name(value: string) {
        if (value === this.nameField) return;
        this.nameField = value;
        this.notifyPropertyChanged({propertyName: "name"});
    }

    private bithdayField: Date;
    get bithday(): Date { return this.bithdayField; }
    set bithday(value: Date) {
        if (value === this.bithdayField) return;
        this.bithdayField = value;
        this.notifyPropertyChanged({ propertyName: "bithday" });
    }

    private isVisibleField: boolean;
    get isVisible(): boolean { return this.isVisibleField; }
    set isVisible(value: boolean) {
        if (value === this.isVisibleField) return;
        this.isVisibleField = value;
        this.notifyPropertyChanged({ propertyName: "isVisible" });
    }

}

class ExampleApplication extends Mvvm.TypeScript.Application {
    
    protected getRoot(): any {
        var rootViewModel = new ExampleViewModel();
        rootViewModel.name = "Hello";
        rootViewModel.bithday = new Date(2000, 1, 1);
        rootViewModel.isVisible = false;
        //Object.observe(rootViewModel, e => {
        //    console.log(e);
        //});
        return rootViewModel;
    }

}

window.onload = (e) => {
    var app = new ExampleApplication();
    app.startup();    
};

