/**
 * 1、定义Observe，监听数据的每一个属性，set方法中需要重新observe一次
 * 2、添加一个发布订阅模式，用于监听数据变化，通知模板更新数据
 * 3、添加一个编译方法，将observe中的数据读取到模板中显示
 * 4、在数据添加到模板的初始化方法中，给每个模板渲染的方法添加事件监听
 * 5、在数据修改的时候，调用发布模式，通知所有的模板重新进行数据更新编译操作。
 */

function Vue(options = {}) {
    this.$options = options;
    var data = (this._data = this.$options.data);
    observe(data);
    for (let key in data) {
        Object.defineProperty(this, key, {
            get() {
                return this._data[key];
            },
            set(newVal) {
                this._data[key] = newVal;
            }
        });
    }
    new Compile(options.el, this);
}

function Compile(el, vm) {
    vm.$el = document.getElementById(el);
    let fragement = document.createDocumentFragment();
    while ((child = vm.$el.firstChild)) {
        fragement.appendChild(child);
    }
    replace(fragement);
    function replace(fragement) {
        Array.from(fragement.childNodes).forEach(node => {
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;
            let val = vm;
            if (node.nodeType == 3 && reg.test(text)) {
                RegExp.$1.split(".").forEach(k => {
                    console.log('----------','将要发生读取操作操作',k);
                    val = val[k];
                });
                new Watcher(vm, RegExp.$1, function(newVal) {
                    //在初始化渲染数据的时候，订阅数据更新之后需要执行的什么操作
                    node.textContent = text.replace(/\{\{(.*)\}\}/, newVal);
                });
                node.textContent = text.replace(/\{\{(.*)\}\}/, val);
            }
            if (node.childNodes) {
                replace(node);
            }
        });
    }

    vm.$el.appendChild(fragement);
}

function Observe(data) {
    let dep = new Dep();
    // console.log(dep)
    for (let key in data) {
        let val = data[key];
        observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            get() {
                console.log('----------','发生了读取操作操作');
                console.log(Dep.target)
                Dep.target && dep.addSub(Dep.target);
                return val;
            },
            set(newVal) {
                
                if (newVal == val) {
                    return;
                }
                console.log('----------','发生了写操作操作');
                val = newVal;
                observe(newVal);
                dep.notify();
            }
        });
    }
}

function observe(data) {
    if (typeof data != "object") return;
    new Observe(data);
}

/**
 * 发布订阅
 */
function Dep() {
    this.subs = [];
}
Dep.prototype.addSub = function(sub) {
    this.subs.push(sub);
};
Dep.prototype.notify = function() {
    this.subs.forEach(sub => sub.update());
};

function Watcher(vm, exp, fn) {
    this.fn = fn;
    this.vm = vm;
    this.exp = exp;
    Dep.target = this;
    let val = vm;
    let arr = exp.split(".");
    arr.forEach(k => {
        val = val[k];
    });
    Dep.target = null;
}
Watcher.prototype.update = function() {
    let val = this.vm;
    let arr = this.exp.split(".");
    arr.forEach(k => {
        val = val[k];
    });
    this.fn(val);
};
