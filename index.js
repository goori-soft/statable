const Observable = require('@goori-soft/observable');

const cloneState = (state)=>{
    let newState = {};

    for(let i in state){
        newState[i] = state[i];
    }

    return newState;
}

class History{
    history = [];
    pointer = -1;
    parent = null;

    constructor(parent){
        this.parent = parent;
    }

    back = ()=>{
        let p = this.pointer - 1;
        return this.setPointer(p);
    }

    forward = ()=>{
        let p = this.pointer + 1;
        return this.setPointer(p);
    }

    getParent = ()=>{
        if(this.parent){
            return this.parent
        }
        return this;
    }

    normalize = ()=>{
        const _ = this;
        this.history = this.history.filter((state, index)=>{
            if(index > _.pointer) return false;
            return true;
        });

        return this.history;
    }

    push = (state)=>{
        this.normalize();
        this.history.push(state);
        this.pointer++;
        
        return this.getParent();
    }

    setPointer = (pointer)=>{
        if(pointer < 0) pointer = 0;
        if(pointer >= this.history.length) pointer = this.history.length - 1;

        if(pointer >= 0){
            this.pointer = pointer;
            let state = cloneState(this.history[this.pointer]);
            if(this.parent){
                this.parent.state = state;
                this.parent.notify(this.parent.state);
            }
        }
        return this.getParent();
    }
}

class Statable extends Observable{

    history = null;
    historyPointer = 0;
    state = {};
    status = null;
    statusObservers = [];

    constructor(status){
        super();

        if(typeof(status) == 'undefined'){
            this.status = Statable.status.DISABLE;
        }
        else{
            this.status = status;
        }

        this.history = new History(this);
        this.history.push(cloneState(this.state));
    }

    /**
     * Change status to DISABLE
     */
    disable = ()=>{
        return this.setStatus(Statable.status.DISABLE);
    }


    /**
     * Get a variable from state
     * @param {String} variable 
     */
    get = (variableName)=>{
        if(typeof(variableName) != 'string') return undefined;
        return this.state[variableName];
    }

    /**
     * Notify all 'on' function registreds
     */
    notifyStatusObservers = ()=>{
        this.statusObservers.map( observer =>{
            observer(this.status, this);
        });
    }

    /**
     * Set a status observer
     * @param {String} status 
     * @param {Function} callback 
     */
    on = (status, callback)=>{
        if(typeof(callback) != 'function') return this;
        status = status.toString().toUpperCase();

        const _ = this;

        const func = (newStatus)=>{
            if(newStatus == status || status == 'STATUSCHANGE'){
                callback(newStatus, _);
            }
        }

        this.statusObservers.push(func);

        return this;
    }

    onStatusChange = (callback)=>{
        return this.on('statusChange', callback);
    }

    onReady = (callback)=>{
        return this.on('ready', callback);
    }

    onError = (callback)=>{
        return this.on('error', callback);
    }

    onTrying = (callback)=>{
        return this.on('trying', callback);
    }

    onDisable = (callback)=>{
        return this.on('disable', callback);
    }

    /**
     * Change the status to READY
     */
    ready = ()=>{
        return this.setStatus(Statable.status.READY);
    }

    /**
     * Change de state object
     * @param {Object} state 
     */
    set = (state)=>{
        let hasChanges = false;

        if(typeof(state) == 'object'){
            for(let i in state){
                if(this.state[i] != state[i]){
                    this.state[i] = state[i];
                    hasChanges = true;
                }
            }
        }

        if(hasChanges){
            this.history.push(cloneState(this.state));
            this.notify(this.state);
        }

        return this;
    }

    setStatus = (newStatus)=>{
        if(newStatus != this.status){
            this.status = newStatus;
            this.notifyStatusObservers();
        }
        
        return this;
    }

    /**
     * Try to execute a promise.
     * This method changes the object's status automatically.
     * If variableName is given, the positive result of the promise is automatically allocated to this state variable.
     * @param {Promise} promise 
     * @param {String} variableName
     */
    try = (promise, variableName)=>{
        this.setStatus(Statable.status.TRYING);
        const toReturn = Promise.resolve(promise);

        toReturn.then(value=>{
            if(typeof(variableName) == 'string'){
                let newState = {};
                newState[variableName] = value;
                this.set(newState);
            }

            this.setStatus(Statable.status.READY);
        }).catch(err=>{
            this.setStatus(Statable.status.ERROR);
        });

        return toReturn;
    }

    /**
     * Change status to TRYING
     */
    trying = ()=>{
        return this.setStatus(Statable.status.TRYING);
    }

    static status = {
        DISABLE: 'DISABLE',
        READY: 'READY',
        TRYING: 'TRYING',
        ERROR: 'ERROR'
    }
}

module.exports = Statable;