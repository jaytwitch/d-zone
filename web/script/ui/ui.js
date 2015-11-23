'use strict';
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var BetterCanvas = require('./../common/bettercanvas.js');
var TextBlotter = require('./../common/textblotter.js');
var Button = require('./button.js');
var Panel = require('./panel.js');

module.exports = UI;
inherits(UI, EventEmitter);

function UI(game) {
    this.game = game;
    TextBlotter.loadImage(this.game.renderer.images.font);
    this.game.on('resize', this.onResize.bind(this));
    this.game.on('mousemove', this.onMouseMove.bind(this));
    this.game.on('mousedown', this.onMouseDown.bind(this));
    this.game.on('mouseup', this.onMouseUp.bind(this));
    this.elements = [];
    this.x = 0; this.y = 0;
    this.canvas = new BetterCanvas(1,1);
    var self = this;
    this.on('draw', function(canvas) { canvas.drawStatic(self.canvas.canvas); });
    this.boundRedraw = this.redraw.bind(this);
    this.boundonMouseOnElement = this.onMouseOnElement.bind(this);
    this.boundonMouseOffElement = this.onMouseOffElement.bind(this);
}

UI.prototype.addButton = function(options) {
    if(!options.parent) options.parent = this;
    options.ui = this;
    var newButton = new Button(options);
    options.parent.elements.push(newButton);
    if(options.parent !== this) this.elements.push(newButton);
    newButton.on('redraw', this.boundRedraw);
    newButton.on('mouse-on-element', this.boundonMouseOnElement);
    newButton.on('mouse-off-element', this.boundonMouseOffElement);
    return newButton;
};

UI.prototype.addPanel = function(options) {
    if(!options.parent) options.parent = this;
    options.ui = this;
    var newPanel = new Panel(options);
    options.parent.elements.push(newPanel);
    if(options.parent !== this) this.elements.push(newPanel);
    newPanel.on('redraw', this.boundRedraw);
    return newPanel;
};

UI.prototype.redraw = function() {
    this.canvas.clear();
    for(var i = 0; i < this.elements.length; i++) {
        this.elements[i].redraw(this.canvas);
    }
};

UI.prototype.onMouseMove = function(mouseEvent) {
    if(mouseEvent.button) return;
    for(var i = 0; i < this.elements.length; i++) {
        var elem = this.elements[i];
        if(mouseEvent.x >= elem.x && mouseEvent.x < elem.x + elem.w
            && mouseEvent.y >= elem.y && mouseEvent.y < elem.y + elem.h) {
            elem.emit('mouse-on', mouseEvent);
        } else {
            elem.emit('mouse-off', mouseEvent);
        }
    }
};

UI.prototype.onMouseDown = function(mouseEvent) {
    if(this.mouseOnElement) this.mouseOnElement.emit('mouse-down');
};

UI.prototype.onMouseUp = function(mouseEvent) {
    for(var i = 0; i < this.elements.length; i++) {
        this.elements[i].emit('mouse-up');
    }
};

UI.prototype.onMouseOnElement = function(elem) {
    this.mouseOnElement = elem;
    this.game.mouseOver = false;
};

UI.prototype.onMouseOffElement = function(elem) {
    this.mouseOnElement = this.mouseOnElement === elem ? false : this.mouseOnElement;
};

UI.prototype.onResize = function(resize) {
    this.w = resize.width; this.h = resize.height;
    this.canvas.canvas.width = this.w;
    this.canvas.canvas.height = this.h;
    for(var i = 0; i < this.elements.length; i++) {
        this.elements[i].reposition();
    }
    this.redraw();
};