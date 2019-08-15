(function(){
	var Body_setStatic = Matter.Body.setStatic;
    Matter.Body.setStatic = function(body, isStatic){
        //console.log('aaaa',isStatic)
        if(isStatic){
        	friction = body.friction;
        }
        Body_setStatic(body, isStatic);
        if(isStatic){
	        Body.set(body, "friction", friction);
	    }
    }
})();