const Statable = require('./index.js');
class myClass extends Statable{
    state = {}
}

const myObserver = (state, obj)=>{
    console.log('>> ' + state.name);
}

const myInstance = new myClass();

myInstance
    .subscribe(myObserver)

    .on('statusChange', (status)=>{
        console.log(status);
    })
    
    .on('ready', (status, obj)=>{
        console.log('All ready here!');
        console.log('Message from status observer: ' + obj.get('message'));
    })

    .try(new Promise((resolve, reject)=>{
        setTimeout(()=>{
            resolve('Promise done!');
        }, 3000);
    }), 'message')
    
    .then(value => {
        console.log('Message directly from the promise resolver: ' + value);
    });

myInstance
    .set({name: 'Mary'})
    .set({name: 'Johnny'})
    .history.forward()
    .history.back()
    .set({name: 'Petter'})
    .set({name: 'Orlnado'})
    .history.back()
    .history.back()
    .history.back()
    .history.forward();

const props = {
    level: 13,
    life: 5,
    xp: 5000
};

myInstance
    .unsubscribe(myObserver)
    .set({props});

const myState = myInstance.cloneState(true);
myState.props.xp = 7000;
console.log(myInstance.state.props, myState.props);