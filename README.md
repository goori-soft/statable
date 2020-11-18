# Statable (goori-soft)
Simple state and status manager

# Install
```bash
$ npm install @goori-soft/statable
```

# How to use it
You can either expand this class or create an object directly from it.
```javascript
const Statable = require('@goori-soft/statable');

class myClass extends Statable{
    state = {}
}

const myObj = new myClass();
```
To change the object's state use the set method, transferring an object that contains the values ​​you want to assign.
```javascript
myObj.set({
    name: 'Mary',
    age: 45,
    epecies: 'Trill'
});
```
To capture any value use the get method.
```javascript
console.log(myObj.get('name'));
```
You can monitor the object in three different ways:

1 - Checking the change of some state variable.
```javascript
const myObserver = (state)=>{
    console.log(state.name)
}

myObj
    .subscribe(myObserver)
    .set({name: 'Johnny'});
```
2 - Checking object status change.
```javascript
const myStatusObserver = (status)=>{
    console.log(status);
}

const onReady = ()=>{
    console.log('All ready here!');
}

myObj
    .on('statusChange', myStatusObserver)
    .on('ready', onReady)
    .trying()
    .ready()
    .disable()
    .error()
```
3 - Requesting the execution of a promise.
```javascript
const myPromiseObserver = (status, obj)=>{
    console.log(status);
    console.log(obj.get('message'));
}

myObj
    .on('statusChange', myPromiseObserver)
    .try(new Promise(resolve, reject)=>{
        settimeout(()=>{
            resolve('This is my message');
        }, 1000);
    }, 'message');
```
> **Note**: A reject result should change the object's status to 'ERROR'.