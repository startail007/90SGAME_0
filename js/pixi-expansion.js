PIXI.bodyList = [];
PIXI.DisplayObject.prototype = Object.assign(PIXI.DisplayObject.prototype, {            
    body:null,
    createBody:function(option,bound){
        option = option||{};
        bound = bound||{};
        bound.left = bound.left||0;
        bound.right = bound.right||0;
        bound.top = bound.top||0;
        bound.bottom = bound.bottom||0;
        this.body=Bodies.rectangle(this.width*0.5,this.height*0.5,this.width-bound.left-bound.right,this.height-bound.top-bound.bottom,option,false); 

        this.pivot.set((bound.left- bound.right)*0.5, (bound.top - bound.bottom)*0.5);                 
        return this;
    },
    addBodyfrom:function(target){
        PIXI.bodyList.push(this);
        World.add(target,this.body);
        return this;
    },
    update:function(){
        if(this.body){  
            this.position = this.body.position;
            this.rotation = this.body.angle;
        }
        return this;
    },
    beforeUpdate:function(){
        //console.log(this,this.onCollisionStart,'aaa');
    },           
    translate:function(x , y){
        if(this.body){
            Body.translate(this.body,{x: x, y: y});
        }
        return this;              
    },
    move:function(x, y){
        if(this.body){
            Body.setPosition(this.body, {x:this.body.position.x + x,y:this.body.position.y + y});
            Body.setVelocity(this.body, {x:x,y:y});
        }
        return this;  
    }
});
var AnimatedSprite_gotoAndPlay = PIXI.AnimatedSprite.prototype.gotoAndPlay;
var AnimatedSprite_gotoAndStop = PIXI.AnimatedSprite.prototype.gotoAndStop;
var AnimatedSprite_render = PIXI.AnimatedSprite.prototype._render;
//PIXI.AnimatedSprite.prototype.aaa = 'asdasd';
PIXI.AnimatedSprite.prototype = Object.assign(PIXI.AnimatedSprite.prototype, {
    frameTags:{},
    currentlyTag:0,
    gotoAndPlay:function(t){
        var tag = this.frameTags[t];        
        if(tag){
            this.currentlyTag = t;
            AnimatedSprite_gotoAndPlay.call(this,tag.start);
        }else if(typeof(t)==='number'){
            this.currentlyTag = t;
            AnimatedSprite_gotoAndPlay.call(this,t);
        }        
    },
    gotoAndStop:function(t){
        var tag = this.frameTags[t];
        if(tag){
            this.currentlyTag = t;
            AnimatedSprite_gotoAndStop.call(this,tag.start);
        }else if(typeof(t)==='number'){
            this.currentlyTag = t;
            AnimatedSprite_gotoAndStop.call(this,t);
        } 
    },
    changeFrame:function(){
        var tag = this.frameTags[this.currentlyTag];
        if(tag){
            if(tag.loop){
                var f = tag.start + (this.currentFrame-tag.start)%(tag.end-tag.start);               
                if(this.currentFrame!==f){
                    AnimatedSprite_gotoAndPlay.call(this,f);
                }
            }else{
                if(this.currentFrame>=tag.end){
                    AnimatedSprite_gotoAndStop.call(this,tag.end);
                }
            }
        }        
    },
    _render:function(t){
        AnimatedSprite_render.call(this,t);
        this.changeFrame();
    }
});
var stateMachine = function(){
    var state = '';
    var list = {};
    //this.stateMachine = null;
    this.addState = function(name,option){
        option = Object.assign({
            stateMachine: null,
            id:name
        },option);
        list[name] = option;
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
                if(list[name]&&list[name].input){
                    list[name].input.call(this,list[state],list[name]);
                }       
                state = name;
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

var componentCharacter = function(data) {
    this.__super(); 

    var player = new PIXI.AnimatedSprite(data);
    player.scale.set(0.8);
    player.frameTags['idle'] = {start:0,end:23,loop:true};
    player.frameTags['run'] = {start:24,end:47,loop:true};
    player.frameTags['jump'] = {start:48,end:71,loop:false};
    player.frameTags['fall'] = {start:72,end:95,loop:true};
    player.animationSpeed = 0.75;
    this.player = player;
    this.addChild(this.player);

    this.control = null;
    this.sensorLeftBool = false;
    this.sensorRightBool = false;
    this.sensorFloorBool = false;
    this.sensorFloorCount = 0;
    this.direction = 'right';

    var that = this;
    var stateMachine01 = new stateMachine();
    stateMachine01.addState('',{
        trigger:function(){
            if(that.sensorFloorBool){
                this.setState('base');
            }else{                
                this.setState('fall');
            }
        }
    });

    stateMachine01.addState('base',{
        trigger:function(){   
            if(that.sensorFloorBool&&that.control.spacebar.isDown){
                this.setState('jump');          
            }
            if(that.body.velocity.y>=1){
                this.setState('fall');
            }
        },
        input:function(from, to){
            to.stateMachine.setState('idle');
        },
        nav:['jump','fall']
    });
    var stateMachine01_base = stateMachine01.activeSubStateMachine('base');
    stateMachine01_base.addState('idle',{
        trigger:function(){
            if(that.control.left.isDown||that.control.right.isDown){                
                this.setState('run'); 
            }
        },
        input:function(){
            that.player.gotoAndPlay('idle');
        },
        nav:['run']
    });
    stateMachine01_base.addState('run',{
        trigger:function(){
            if(!that.control.left.isDown&&!that.control.right.isDown){                
                this.setState('idle'); 
            }
        },
        input:function(){                
            that.player.gotoAndPlay('run');
        },
        nav:['idle']
    });


    stateMachine01.addState('jump',{
        trigger:function(state){
            if(that.body.velocity.y>0){
                this.setState('fall');
            }
            if(that.sensorFloorBool){
                this.setState('base');
            }
            //console.log(that.player.currentFrame,player.frameTags[state.id].end);
        },
        input:function(){
            that.player.gotoAndPlay('jump');
            var f = that.body.mass*0.04;
            Body.applyForce(that.body,that.body.position, {x: 0, y: -f});  
        },
        enter:function(){
            return that.sensorFloorBool;
            return false;
        },
        nav:['fall','base']
    });

    stateMachine01.addState('fall',{
        trigger:function(){
            if(that.sensorFloorBool){
                this.setState('base');
            }
        },
        input:function(){
            that.player.gotoAndPlay('fall');
        },
        nav:['base']
    });

    

    this.stateMachine = stateMachine01;

    this.createBody = function(dimension,option){
        dimension = Object.assign({
            head: 40,
            bodyWidth: 60,
            bodyHeight: 120,
            footRadius: 15,
            footDistance: 20
        },dimension);
        var bodiesBodyBottom = -dimension.bodyWidth*0.5;
        var bodiesBodyTop = -dimension.bodyHeight+dimension.bodyWidth*0.5+dimension.head*0.5;
        var bodiesBodyY = (bodiesBodyTop + bodiesBodyBottom)*0.5;
        var bodiesHead = Bodies.rectangle(0,-dimension.bodyHeight+dimension.head*0.5,dimension.head,dimension.head);
        var bodiesLeftFoot = Bodies.circle(0+dimension.footDistance*0.5,-dimension.footRadius,dimension.footRadius);
        var bodiesRightFoot = Bodies.circle(0-dimension.footDistance*0.5,-dimension.footRadius,dimension.footRadius);
        this.bodiesBody = Bodies.circle(0,bodiesBodyY,dimension.bodyWidth*0.5);
        var tt = -dimension.bodyHeight;
        var bb = -dimension.footRadius;
        this.sensorLeft = Bodies.rectangle(0-dimension.bodyWidth*0.5+dimension.bodyWidth*0.1,(bb+tt)*0.5,dimension.bodyWidth*0.5,bb-tt,{isSensor:true,density:0});                
        this.sensorRight = Bodies.rectangle(0+dimension.bodyWidth*0.5-dimension.bodyWidth*0.1,(bb+tt)*0.5,dimension.bodyWidth*0.5,bb-tt,{isSensor:true,density:0});                
        this.sensorFloor = Bodies.rectangle(0,-dimension.footRadius+dimension.footRadius*0.5,dimension.footDistance+dimension.footRadius*2,dimension.footRadius,{isSensor:true,density:0});

        option = Object.assign({
            friction: 0.5,   
            inertia: Infinity,
            parts:[bodiesHead,bodiesLeftFoot,bodiesRightFoot,this.bodiesBody,this.sensorRight,this.sensorLeft,this.sensorFloor]
        },option);

        var bodiesMain=Body.create(option);
        bodiesMain.position.x = 0;
        bodiesMain.position.y = 0;
        bodiesMain.positionPrev.x = 0;
        bodiesMain.positionPrev.y = 0;
        this.body=bodiesMain;
        return this;
    }
    this.onCollisionStart = function(pair){        
        if(pair.isSensor){
            if(pair.bodyA.id===this.sensorLeft.id||pair.bodyB.id===this.sensorLeft.id){
                this.sensorLeftBool = true;
                /*var v = this.body.velocity;
                v.x *= 0.5;
                Body.setVelocity( this.body, v);*/ 
            }else if(pair.bodyA.id===this.sensorRight.id||pair.bodyB.id===this.sensorRight.id){
                this.sensorRightBool = true;
                /*var v = this.body.velocity;
                v.x *= 0.5;
                Body.setVelocity( this.body, v);*/
            }else if(pair.bodyA.id===this.sensorFloor.id||pair.bodyB.id===this.sensorFloor.id){
                this.sensorFloorCount++;
                this.updateFloor();
            }
        }else{
            if(pair.bodyA.id===this.bodiesBody.id||pair.bodyB.id===this.bodiesBody.id){
                if(this.sensorLeftBool){
                    Body.translate( this.body, {x:1,y:0});
                }else{
                    Body.translate( this.body, {x:-1,y:0});
                }
            }
        }
    }
    this.onCollisionEnd = function(pair){
        if(pair.isSensor){
            if(pair.bodyA.id===this.sensorLeft.id||pair.bodyB.id===this.sensorLeft.id){
                this.sensorLeftBool = false;
            }else if(pair.bodyA.id===this.sensorRight.id||pair.bodyB.id===this.sensorRight.id){
                this.sensorRightBool = false;
            }else if(pair.bodyA.id===this.sensorFloor.id||pair.bodyB.id===this.sensorFloor.id){
                this.sensorFloorCount--;
                this.updateFloor();
            }
        }
    }
    this.updateFloor = function(){
        if(this.sensorFloorCount>0){
            this.sensorFloorBool = true;
        }else{
            this.sensorFloorBool = false;
        }
    }
    this.setControl =  function(control){
        this.control = control;
    }
    this.beforeUpdate = function(){
        this.constructor.prototype.beforeUpdate();    
        this.stateMachine.stateTrigger();
        if(this.control.left.isDown){
            if(this.direction!=='left'){
                this.direction='left';
                this.player.scale.set(-Math.abs(this.player.scale.x),this.player.scale.y);
            }else if(!this.sensorLeftBool){
                var f = this.body.mass*0.008;
                Body.applyForce(this.body,this.body.position, {x: (!this.sensorLeftBool&&this.sensorFloorBool)?-f:-f*0.03, y: 0});
                //Body.translate( this.body, {x: -10*delta, y: 0});
                /*var v = this.body.velocity;
                v.x = Common.clamp(v.x,-5,5);
                Body.setVelocity( this.body, v);    */             
            }                      
        }
        if(this.control.right.isDown){
            if(this.direction!=='right'){
                this.direction='right';
                this.player.scale.set(Math.abs(this.player.scale.x),this.player.scale.y);
            }else if(!this.sensorRightBool){
                var f = this.body.mass*0.008;
                Body.applyForce(this.body,this.body.position, {x: (!this.sensorRightBool&&this.sensorFloorBool)?f:f*0.03, y: 0});
                //Body.translate( this.body, {x: 10*delta, y: 0});
                /*var v = this.body.velocity;
                v.x = Common.clamp(v.x,-5,5);
                Body.setVelocity( this.body, v);*/
            }
        }
    }
}
extend(componentCharacter, PIXI.Container);