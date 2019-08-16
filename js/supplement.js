var keyboard = function(keyCode) {
    var key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = [];
    key.release = [];

    key.downHandler = function(event) {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press.length){
                for(var temp in key.press){
                    key.press[temp]();
                }
            }
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    key.upHandler = function(event) {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release.length){
                for(var temp in key.release){
                    key.release[temp]();
                }
            }
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    window.addEventListener("keydown", key.downHandler.bind(key), false);
    window.addEventListener("keyup", key.upHandler.bind(key), false);
    return key;
}
function extend(child, supertype) {
    child.prototype.__proto__ = supertype.prototype;
    child.prototype.__super = supertype;
}

var stateMachine = function(){
    var state = '';
    var list = {};
    //this.stateMachine = null;
    this.init = function(){
        state = '';
    }
    this.addState = function(name,option){
        option = Object.assign({
            stateMachine: null,
            id:name
        },option);
        list[name] = option;
    }
    this.getCurrentlyState = function(){
        return state;
    }
    this.getAllCurrentlyState = function(){
        var stateMachine = list[state];        
        var ss = state;
        var nextStateMachine = stateMachine.stateMachine;
        while (nextStateMachine) {
            var nextCurrentlyState = stateMachine&&nextStateMachine.getCurrentlyState();
            if(nextCurrentlyState){
                ss += "." + nextCurrentlyState;
            }
            nextStateMachine = nextStateMachine.getState(nextCurrentlyState).stateMachine;
        }
        return ss;
    }
    this.getState = function(name){
        return list[name];
    }
    this.setState = function(name){
        if(list[name]){       
            var bool = false;                      
            var temp0 = (list[state]&&list[state].nav)?list[state].nav.indexOf(name)!==-1:true;
            if(temp0){             
                var temp1 = (list[state]&&list[state].to)?list[state].to.call(this,name):true;
                if(temp1){
                    var temp2 = (list[name]&&list[name].enter)?list[name].enter.call(this,state):true;
                    if(temp2){
                        if(list[state]&&list[state].output){
                            list[state].output.call(this,list[state],list[name]);
                        }            
                        bool = true;
                    }
                }
            }
            if(bool||state===name){ 
                var oldState = state;  
                state = name;       
                if(list[name]&&list[name].input){
                    list[name].input.call(this,list[oldState],list[name]);
                }          
            }
        }
    }
    this.stateTrigger = function(){  
        if(list[state]){                
            list[state].trigger.call(this,list[state]);
            if(list[state].stateMachine){
                list[state].stateMachine.stateTrigger();  
            }
        }
    }
    this.activeSubStateMachine = function(name){
        if(list[name]&&list[name].stateMachine===null){
            list[name].stateMachine = new stateMachine();
            return list[name].stateMachine;
        }  
    }
}
var animation = function(name, duration, loop, fun){
    this.name = name;
    this.time = 0;
    this.duration = duration;
    this.loop = loop;
    this.run = function(delta){
        if(this.playing){
            this.time+=delta;
            this.update();
        }
    };
    this.update = function(){
        if(this.loop){
            this.time%=this.duration;
        }else{
            if(this.time>this.duration){
                this.time = this.duration;
                this.playing = false;
            }
        }
        //console.log(delta,this.time)
        fun(this.time/this.duration,this);
    };
    this.playing = false;
    this.play = function(){
        this.playing = true;
        return this;
    }
    this.setTime = function(value){
        this.time = value;
        this.update();
        return this;
    }
}