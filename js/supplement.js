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