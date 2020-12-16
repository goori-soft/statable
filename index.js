const Observable = require('@goori-soft/observable');

/**
 * This is a deep clone function
 * @param {Object} obj 
 */
const cloneDeepObj = (obj)=>{
    const cloneObj = {};

    for(let i in obj){
        if(typeof(obj[i]) == 'object' && obj[i] != null){
            cloneObj[i] = cloneDeepObj(obj[i]);
        }
        else if(typeof(obj[i]) == 'function'){
            cloneObj[i] = obj[i];
            cloneObj[i].bind(cloneObj);
        }
        else{
            cloneObj[i] = obj[i];
        }
    }

    return cloneObj;
}

/**
 * This is a simple shallow clone function
 * @param {Object} state 
 */
const cloneState = (state)=>{
    let newState = {};

    for(let i in state){
        newState[i] = state[i];
    }

    return newState;
}

class History{

    constructor(parent){
        this.history = [];
        this.pointer = -1;
        this.parent = parent;
    }

    back(){
        let p = this.pointer - 1;
        return this.setPointer(p);
    }

    forward(){
        let p = this.pointer + 1;
        return this.setPointer(p);
    }

    getParent(){
        if(this.parent){
            return this.parent
        }
        return this;
    }

    normalize(){
        const _ = this;
        this.history = this.history.filter((state, index)=>{
            if(index > _.pointer) return false;
            return true;
        });

        return this.history;
    }

    push(state){
        this.normalize();
        this.history.push(state);
        this.pointer++;
        
        return this.getParent();
    }

    setPointer(pointer){
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

    constructor(status){
        super();

        this.status = null;
        this.state = {};
        this._changingState = false;
        this.statusObservers = [];

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
     * This method is called just after instance updates the state
     * @param {Object} oldState 
     */
    afterSetState(oldState){
        //nothing to do here;
    }

    /**
     * This method is called before instance updates the state
     * @param {Object} newState 
     */
    beforeSetState(newState){
        //nothing to do here;
    }

    /**
     * Return a clone of state object
     * If state has objects they will be passed as reference. Clone fucntion is one level only.
     * If you need a deep clone set deep iquals true.
     */
    cloneState(deep){
        if(!deep){
            return cloneState(this.state);
        }
        else{
            return cloneDeepObj(this.state);
        }
    }

    /**
     * Change status to DISABLE
     */
    disable(){
        return this.setStatus(Statable.status.DISABLE);
    }

    /**
     * Get a variable from state
     * @param {String} variable 
     */
    get(variableName){
        if(typeof(variableName) != 'string') return undefined;
        return this.state[variableName];
    }

    /**
     * Copares the status of instance
     * @param {String} status 
     */
    is(status){
        if(typeof(status) != 'string') return false;
        status = status.toUpperCase().trim();
        if(status == 'TRY') status = 'TRYING';
        if(this.status.toUpperCase().trim() == status) return true;
        return false;
    }

    /**
     * Notify all 'on' function registreds
     */
    notifyStatusObservers(){
        this.statusObservers.map( observer =>{
            observer(this.status, this);
        });
    }

    /**
     * Set a status observer
     * @param {String} status 
     * @param {Function} callback 
     */
    on(status, callback){
        if(typeof(callback) != 'function') return this;
        status = status.toString().toUpperCase();

        const _ = this;

        const func = (newStatus)=>{
            if(newStatus == status || status == 'STATUSCHANGE'){
                callback(newStatus, _);
            }
        }

        this.statusObservers.push(func);

        if(this.status == status){
            callback(this.status, this);
        }

        return func;
    }

    onStatusChange(callback){
        return this.on('statusChange', callback);
    }

    onReady(callback){
        return this.on('ready', callback);
    }

    onError(callback){
        return this.on('error', callback);
    }

    onTrying(callback){
        return this.on('trying', callback);
    }

    onDisable(callback){
        return this.on('disable', callback);
    }

    /**
     * Change the status to READY
     */
    ready(){
        return this.setStatus(Statable.status.READY);
    }

    /**
     * Change de state object
     * @param {Object} state 
     */
    set(state){
        let hasChanges = false;
        let oldState = cloneState(this.state);
        let clone = cloneState(this.state);

        if(typeof(state) == 'object'){
            for(let i in state){
                if(clone[i] != state[i]){
                    clone[i] = state[i];
                    hasChanges = true;
                }
            }
        }

        if(hasChanges){
            this._changingState = true;

            this.beforeSetState(clone);
            this.state = clone;
            this.history.push(this.state);
            this.afterSetState(oldState);
            this.notify(this.state);

            this._changingState = false;
        }

        return this;
    }

    setStatus(newStatus){
        if(newStatus != this.status){
            this.status = newStatus;
            this.notifyStatusObservers();
        }
        
        return this;
    }

    /**
     * Try to onReadyFunctionleName is given, the positive result of the promise is automatically allocated to this state variable.
     * @param {Promise} promise 
     * @param {String} variableName
     */
    try(promise, variableName){
        this.setStatus(Statable.status.TRYING);
        console.log('trying?: ', this.status)
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
    trying(){
        return this.setStatus(Statable.status.TRYING);
    }

    unsubscribe(func){
        this.statusObservers = this.statusObservers.filter((indexFunc)=>{
            if(indexFunc == func) return false;
            return true;
        });

        return Observable.prototype.unsubscribe.call(this, func);
    }
}

/**
 * Static property
 */
Statable.status = {
    DISABLE: 'DISABLE',
    READY: 'READY',
    TRYING: 'TRYING',
    ERROR: 'ERROR'
}

module.exports = Statable;