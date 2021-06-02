const FlowContext = function() {
    const me = this;

    me.level = 0;
    me.loopLevels = [];

    return me;
};

FlowContext.prototype.isInLoop = function () {
    return this.loopLevels.length != 0;
};

FlowContext.prototype.pushScope = function (isLoop) {
    const me = this;
    me.level = me.level + 1;
    if (isLoop) me.loopLevels.push(me.level);
};

FlowContext.prototype.popScope = function () {
    const me = this;
    const levels = me.loopLevels;
    const levlen = levels.length;
    if (levlen != 0 && levels[levlen - 1] === me.level) {
        levels.pop();
    }
    me.level = me.level - 1;
};

module.exports = FlowContext;