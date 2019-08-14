PIXI.bodyList = [];
PIXI.DisplayObject.prototype = Object.assign(PIXI.DisplayObject.prototype, {            
    body:null,
    /*createBody:function(type, option, bound){
        option = option||{};
        if(type==="rect"){
            bound = bound||{};
            bound.left = bound.left||0;
            bound.right = bound.right||0;
            bound.top = bound.top||0;
            bound.bottom = bound.bottom||0;
            this.body=Bodies.rectangle(this.width*0.5,this.height*0.5,this.width-bound.left-bound.right,this.height-bound.top-bound.bottom,option,false); 
            this.pivot.set((bound.left- bound.right)*0.5, (bound.top - bound.bottom)*0.5);     
        }else if(type==="circle"){
            this.body=Bodies.circle(0,0,this.width*0.5,option);
        }
                    
        return this;
    },*/
    createBody:function(type, option, bound){
        option = option||{};
        if(type==="rect"){
            bound = bound||{};
            bound.left = bound.left||0;
            bound.right = bound.right||0;
            bound.top = bound.top||0;
            bound.bottom = bound.bottom||0;
            this.body=Bodies.rectangle(0,0,this.width-bound.left-bound.right,this.height-bound.top-bound.bottom,option,false); 
            this.pivot.set((bound.left- bound.right)*0.5, (bound.top - bound.bottom)*0.5);     
        }else if(type==="circle"){
            this.body=Bodies.circle(0,0,this.width*0.5,option);
            //this.pivot.set(this.width*0.5, this.height*0.5);
            /*this.pivot.set((bound.left- bound.right)*0.5, (bound.top - bound.bottom)*0.5);*/
        }
                    
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
    translate:function(x, y){
        if(this.body){
            Body.translate(this.body,{x: x, y: y});
        }
        return this;              
    },
    rotate:function(angle, point){
        if(this.body){
            Body.rotate(this.body, angle, point)
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
            this.animationSpeed = tag.speed;
            AnimatedSprite_gotoAndPlay.call(this,tag.start);
        }else if(typeof(t)==='number'){
            this.currentlyTag = t;
            this.animationSpeed = 1;
            AnimatedSprite_gotoAndPlay.call(this,t);
        }        
    },
    gotoAndStop:function(t){
        var tag = this.frameTags[t];
        if(tag){
            this.currentlyTag = t;
            this.animationSpeed = tag.speed;
            AnimatedSprite_gotoAndStop.call(this,tag.start);
        }else if(typeof(t)==='number'){
            this.currentlyTag = t;
            this.animationSpeed = 1;
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
    player.scale.set(1);
    player.frameTags['idle'] = {start:0,end:23,loop:true,speed:0.4};
    player.frameTags['run'] = {start:24,end:47,loop:true,speed:1.4};
    player.frameTags['jumpBefore'] = {start:48,end:61,loop:false,speed:1.2};
    player.frameTags['jump'] = {start:62,end:71,loop:false,speed:0.8};
    player.frameTags['fall'] = {start:72,end:95,loop:true,speed:0.8};
    /*player.animationSpeed = 0.75;*/
    this.player = player;
    this.addChild(this.player);

    this.control = null;
    this.sensorLeftBool = false;
    this.sensorRightBool = false;
    this.sensorFloorBool = false;
    this.direction = 'right';
    //this.parts = [];

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
                this.setState('jumpBefore');          
            }
            if(!that.sensorFloorBool&&that.body.velocity.y>=1){
                this.setState('fall');
            }
        },
        input:function(from, to){
            to.stateMachine.setState('idle');
        },
        nav:['jumpBefore','fall']
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
            if(that.control.left.isDown){
                that.controlMove(!that.sensorLeftBool?1:0.03);
            }else if(that.control.right.isDown){
                that.controlMove(!that.sensorRightBool?1:0.03);
            }
        },
        input:function(){                
            that.player.gotoAndPlay('run');
        },
        nav:['idle']
    });

    stateMachine01.addState('jumpBefore',{
        trigger:function(state){
            that.controlMove(0.7);
            if(that.player.currentFrame>=player.frameTags[state.id].end){                
                this.setState('jump');
            }
        },
        input:function(){
            that.player.gotoAndPlay('jumpBefore');
        },
        enter:function(){
            return that.sensorFloorBool;
            return false;
        },
        nav:['jump']
    });

    stateMachine01.addState('jump',{
        trigger:function(state){
            that.controlMove(0.1);
            if(that.body.velocity.y>0){
                this.setState('fall');
            }
            if(that.sensorFloorBool){
                this.setState('base');
            }
            //console.log(that.player.currentFrame,player.frameTags[state.id].end);
            if(!that.control.spacebar.isDown){
                var v = that.body.velocity;
                v.y *= 0.96;
                Body.setVelocity(that.body, v);         
            }
        },
        input:function(){
            that.player.gotoAndPlay('jump');
            var f = that.body.mass*0.04;
            Body.applyForce(that.body,that.body.position, {x: 0, y: -f});  
        },
        nav:['fall','base']
    });

    stateMachine01.addState('fall',{
        trigger:function(){
            that.controlMove(0.03);
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
        var bodiesBody = Bodies.circle(0,bodiesBodyY,dimension.bodyWidth*0.5);
        var tt = -dimension.bodyHeight;
        var bb = -dimension.footRadius;
        
        var sensorLeft = Bodies.rectangle(0-dimension.bodyWidth*0.5+dimension.bodyWidth*0.1,(bb+tt)*0.5,dimension.bodyWidth*0.5,bb-tt-dimension.footRadius,{isSensor:true,density:0});                
        var sensorRight = Bodies.rectangle(0+dimension.bodyWidth*0.5-dimension.bodyWidth*0.1,(bb+tt)*0.5,dimension.bodyWidth*0.5,bb-tt-dimension.footRadius,{isSensor:true,density:0});                
        var sensorFloor = Bodies.rectangle(0,-dimension.footRadius+dimension.footRadius*1,dimension.footDistance+dimension.footRadius*2*0.8,dimension.footRadius,{isSensor:true,density:0});

        var sensorCollision = Bodies.circle(0,-dimension.bodyHeight*0.5,dimension.bodyWidth*0.5,{isSensor:true,density:0});

        var that = this;

        Engine.collision.addCollisionStart(sensorCollision,function(body){
                if(body.data){
                    if(body.data.collision){
                        body.data.collision();
                    }
                }
            });
        function collisionToBool(sensor, judge, fun){
            var sensorCount = 0;
            var updateCollision = function(body){
                console.log(sensorFloor===sensor,sensorCount)
                fun(body,sensorCount>0);
            }
            Engine.collision.addCollisionStart(sensor,function(body){
                    if(judge(body)){
                        sensorCount++;
                        updateCollision(body);
                    }
                });
            Engine.collision.addCollisionEnd(sensor,function(body){
                    if(judge(body)){                        
                        sensorCount--;
                        updateCollision(body);
                    }
                });
        }
        collisionToBool(sensorLeft,function(body){
            if(body.isSensor){
                return;
            }
            return true;
        },function(body,bool){            
            that.sensorLeftBool = bool;
        });
        collisionToBool(sensorRight,function(body){
            if(body.isSensor){
                return;
            }
            return true;
        },function(body,bool){
            that.sensorRightBool = bool;
        });
        collisionToBool(sensorFloor,function(body){
            if(body.isSensor){
                return;
            }
            return true;
        },function(body,bool){
            that.sensorFloorBool = bool;
        });
        Engine.collision.addCollisionEnd(bodiesBody,function(body){
                if(body.isSensor){
                    return
                }
                if(that.sensorLeftBool){
                    Body.translate( that.body, {x:1,y:0});
                }
                if(that.sensorRightBool){
                    Body.translate( that.body, {x:-1,y:0});
                }
            });

        option = Object.assign({
            friction: 0.5,   
            inertia: Infinity,
            parts:[bodiesHead,bodiesLeftFoot,bodiesRightFoot,bodiesBody,sensorLeft,sensorRight,sensorFloor,sensorCollision]
        },option);

        var bodiesMain=Body.create(option);
        bodiesMain.position.x = 0;
        bodiesMain.position.y = 0;
        bodiesMain.positionPrev.x = 0;
        bodiesMain.positionPrev.y = 0;
        this.body=bodiesMain;
        return this;
    }
    this.setControl =  function(control){
        this.control = control;
    }
    this.beforeUpdate = function(delta){
        this.constructor.prototype.beforeUpdate.call(this);    
        this.stateMachine.stateTrigger();
    }
    this.controlMove = function(s){
        if(this.control.left.isDown){
            if(this.direction!=='left'){
                this.direction='left';
                this.player.scale.set(-Math.abs(this.player.scale.x),this.player.scale.y);
            }else if(!this.sensorLeftBool){
                var v = this.body.velocity;
                if(v.x<-8){
                    v.x *= 0.5;
                    Body.setVelocity(this.body, v);
                }
                //var v = this.body.velocity;
                var temp = 1-Math.max(0, Math.min(1, v.x/(-8)));
                var f = this.body.mass*0.008*temp;
                Body.applyForce(this.body,this.body.position, {x: -s*f, y: 0});        
            }                      
        }
        if(this.control.right.isDown){
            if(this.direction!=='right'){
                this.direction='right';
                this.player.scale.set(Math.abs(this.player.scale.x),this.player.scale.y);
            }else if(!this.sensorRightBool){
                var v = this.body.velocity;
                if(v.x<-8){
                    v.x *= 0.5;
                    Body.setVelocity(this.body, v);
                }
                //var v = this.body.velocity;
                var temp = 1-Math.max(0, Math.min(1, v.x/(8)));
                var f = this.body.mass*0.008*temp;
                Body.applyForce(this.body,this.body.position, {x: s*f, y: 0});               
            }
        }
    }
}
extend(componentCharacter, PIXI.Container);