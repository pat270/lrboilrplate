YUI.add('carousel', function(Y) {
    'use-strict';

    var CSS_ITEM = 'carousel-item',
        CSS_ITEM_ACTIVE = 'carousel-item-active',
        CSS_ITEM_TRANSITION = 'carousel-item-transition',
        CSS_MENU_ACTIVE = 'carousel-menu-active',
        CSS_MENU_INDEX = 'carousel-menu-index',
        CSS_MENU_ITEM = 'carousel-menu-item',
        CSS_MENU_NEXT = 'carousel-menu-next',
        CSS_MENU_PAUSE = 'carousel-menu-pause',
        CSS_MENU_PLAY = 'carousel-menu-play',
        CSS_MENU_PREV = 'carousel-menu-prev',
        CSS_MENU_ITEM_DEFAULT = [CSS_MENU_ITEM, CSS_MENU_INDEX].join(' '),
        CSS_MENU_ITEM_ACTIVE = [CSS_MENU_ITEM, CSS_MENU_INDEX, CSS_MENU_ACTIVE].join(' '),

        SELECTOR_MENU_INDEX = '.' + CSS_MENU_INDEX,
        SELECTOR_MENU_NEXT = '.' + CSS_MENU_NEXT,
        SELECTOR_MENU_PAUSE = '.' + CSS_MENU_PAUSE,
        SELECTOR_MENU_PLAY = '.' + CSS_MENU_PLAY,
        SELECTOR_MENU_PLAY_OR_PAUSE = [SELECTOR_MENU_PLAY, SELECTOR_MENU_PAUSE].join(),
        SELECTOR_MENU_PREV = '.' + CSS_MENU_PREV;

    /**
    * A class for constructing Carousel instances.
    *
    * @class Carousel
    * @constructor
    * @extends Base
    */
    function Carousel(config) {
        Carousel.superclass.constructor.apply(this, arguments);
    }

    Carousel.NAME = 'carousel';

    Carousel.ATTRS = {
        /**
         * Index of the first visible item of the carousel.
         *
         * @attribute activeIndex
         * @default 0
         * @type Number
         */
        activeIndex: {
            value: 0,
            setter: '_setActiveIndex'
        },

        /**
         * Duration of the animation in seconds.
         *
         * @attribute animationTime
         * @default 0.5
         * @type Number
         */
        animationTime: {
            value: 0.5
        },

        /**
        * The container node
        *
        * @attribute contentBox
        * @type Node
        */
        contentBox: {
            setter: function (contentBox) {
                var n = Y.one(contentBox);

                return n;
            }
        },

        controlsDot: {
            value: 'a'
        },

        controlsNext: {
            value: '&rang;'
        },

        controlsPause: {
            value: 'pause'
        },

        controlsPlay: {
            value: 'play'
        },

        controlsPrev: {
            value: '&lang;'
        },

        /**
         * Interval time in seconds between an item transition.
         *
         * @attribute intervalTime
         * @default 2
         * @type Number
         */
        intervalTime: {
            value: 2
        },

        /**
         * CSS Selector whitch determines the items to be loaded to the
         * Carousel.
         *
         * @attribute itemSelector
         * @default >* (All first childs)
         * @type String
         */
        itemSelector: {
            value: '>*'
        },

        /**
         * Node container of the navigation items.
         *
         * @attribute nodeMenu
         * @default null
         * @type Node | String
         */
        nodeMenu: {
            value: null,
            setter: '_setNodeMenu'
        },

        /**
         * CSS selector to match the navigation items.
         *
         * @attribute nodeMenuItemSelector
         * @default .carousel-menu-item
         * @type String
         */
        nodeMenuItemSelector: {
            value: '.carousel-menu-item'
        },

        /**
         * Attributes that determines the status of transitions between
         * items.
         *
         * @attribute playing
         * @default true
         * @type Boolean
         */
        playing: {
            value: false
        },

        /**
         * Transition name, values are: default, slide, press-away, soft-scale
         * snapin.
         *
         * @attribute transitionType
         * @default slide
         * @type String
         */
        transitionType: {
            value: 'default'
        }
    };

    Y.extend(Carousel, Y.Widget, {
        animation: null,

        nodeSelection: null,

        nodeMenu: null,

        initializer: function() {
            var instance = this;

            instance.transitionType = instance.get('transitionType');
        },

        /**
         * Render the Carousel component instance. Lifecycle.
         *
         * @method renderUI
         * @protected
         */
        renderUI: function() {
            var instance = this;

            instance._updateNodeSelection();
            instance.nodeMenu = instance.get('nodeMenu');

            instance._updateMenuNodes();
        },

        /**
         * Bind the events on the Carousel UI. Lifecycle.
         *
         * @method bindUI
         * @protected
         */
        bindUI: function() {
            var instance = this;

            instance.after({
                activeIndexChange: instance._afterActiveIndexChange,
                animationTimeChange: instance._afterAnimationTimeChange,
                itemSelectorChange: instance._afterItemSelectorChange,
                intervalTimeChange: instance._afterIntervalTimeChange,
                nodeMenuItemSelector: instance._afterNodeMenuItemSelectorChange,
                playingChange: instance._afterPlayingChange
            });

            instance._bindMenu();

            if (instance.get('playing') === true) {
                instance._afterPlayingChange({
                    prevVal: false,
                    newVal: true
                });
            }
        },

        /**
         * Sync the Carousel UI. Lifecycle.
         *
         * @method syncUI
         * @protected
         */
        syncUI: function() {
            var instance = this;

            instance._uiSetActiveIndex(instance.get('activeIndex'));
        },

        /**
         * Set the <code>activeIndex</code> attribute which
         * activates a certain item on Carousel based on its index.
         *
         * @method item
         * @param val
         */
        item: function(val) {
            this.set('activeIndex', val);
        },

        /**
         * Go to the next index.
         *
         * @method next
         */
        next: function() {
            this._updateIndexNext();
        },

        /**
         * Set the <code>playing</code> attribute
         * to false which pauses the animation.
         *
         * @method pause
         */
        pause: function() {
            this.set('playing', false);
        },

        /**
         * Set the <code>playing</code> attribute
         * to true which starts the animation.
         *
         * @method play
         */
        play: function() {
            this.set('playing', true);
        },

        /**
         * Go to previous index.
         *
         * @method prev
         */
        prev: function() {
            this._updateIndexPrev();
        },

        /**
         * Fire after <code>activeIndex</code> attribute changes.
         *
         * @method _afterActiveIndexChange
         * @param event
         * @protected
         */
        _afterActiveIndexChange: function(event) {
            var instance = this;

            instance._uiSetActiveIndex(
                event.newVal, {
                    prevVal: event.prevVal,
                    animate: instance.get('playing'),
                    src: event.src
                }
            );
        },

        /**
         * Fire after <code>animationTime</code> attribute changes.
         *
         * @method _afterAnimationTimeChange
         * @param event
         * @protected
         */
        _afterAnimationTimeChange: function(event) {
            this.animation.set('duration', event.newVal);
        },

        /**
         * Fire after <code>itemSelector</code> attribute change.
         *
         * @method _afterItemSelectorChange
         * @param event
         * @protected
         */
        _afterItemSelectorChange: function(event) {
            this._updateNodeSelection();
        },

        /**
         * Fire after <code>nodeMenuItemSelector</code> attribute change.
         *
         * @method _afterNodeMenuItemSelectorChange
         * @param event
         * @protected
         */
        _afterNodeMenuItemSelectorChange: function(event) {
            var instance = this;

            instance.nodeMenuItemSelector = event.newVal;

            instance._updateMenuNodes();
        },

        /**
         * Fire after <code>intervalTime</code> attribute changes.
         *
         * @method _afterIntervalTimeChange
         * @param event
         * @protected
         */
        _afterIntervalTimeChange: function(event) {
            var instance = this;

            instance._clearIntervalRotationTask();
            instance._createIntervalRotationTask();
        },

        /**
         * Fire after <code>playing</code> attribute changes.
         *
         * @method _afterPlayingChange
         * @param event
         * @protected
         */
        _afterPlayingChange: function(event) {
            var instance = this;

            var menuPlayItem = instance.nodeMenu.one(SELECTOR_MENU_PLAY_OR_PAUSE);
            var playing = event.newVal;

            var fromSelector = SELECTOR_MENU_PAUSE;
            var toSelector = SELECTOR_MENU_PLAY;

            var rotationTaskMethod = '_clearIntervalRotationTask';

            if (playing) {
                fromSelector = SELECTOR_MENU_PLAY;
                toSelector = SELECTOR_MENU_PAUSE;

                rotationTaskMethod = '_createIntervalRotationTask';
            }

            instance[rotationTaskMethod]();

            if (menuPlayItem) {
                instance.nodeMenu.one(fromSelector).addClass('hide');
                instance.nodeMenu.one(toSelector).removeClass('hide');
            }
        },

        /**
         * Attach delegate to the carousel menu.
         *
         * @method _bindMenu
         * @protected
         */
        _bindMenu: function() {
            var instance = this;

            var menu = instance.nodeMenu;

            var nodeMenuItemSelector = instance.get('nodeMenuItemSelector');

            menu.delegate('click', instance._onClickDelegate, nodeMenuItemSelector, instance);

            instance.nodeMenuItemSelector = nodeMenuItemSelector;
        },

        /**
         * Clear the rotation task interval.
         *
         * @method _clearIntervalRotationTask
         * @protected
         */
        _clearIntervalRotationTask: function() {
            clearInterval(this._intervalRotationTask);
        },

        /**
         * Create an random number to be current index.
         *
         * @method _createIndexRandom
         * @protected
         */
        _createIndexRandom: function() {
            return Math.ceil(Math.random() * this.nodeSelection.size()) - 1;
        },

        /**
         * Create an timer for the rotation task.
         *
         * @method _createIntervalRotationTask
         * @protected
         */
        _createIntervalRotationTask: function() {
            var instance = this;

            instance._clearIntervalRotationTask();

            instance._intervalRotationTask = setInterval(
                function() {
                    instance._updateIndexNext({
                        animate: true
                    });
                },
                instance.get('intervalTime') * 1000
            );
        },

        _handleSlideInOrig: function(object, transitionConfig) {
            object.transition(transitionConfig);
        },

        _handleSlideOutOrig: function(object, transitionConfig) {
            object.transition(transitionConfig);
        },

        /**
         * Fire when animation starts.
         *
         * @method _onAnimationStart
         * @param event
         * @param newImage
         * @param oldImage
         * @param newMenuItem
         * @param oldMenuItem
         * @protected
         */
         _onAnimationStart: function(animate, newImage, oldImage, newMenuItem, oldMenuItem, prevVal, newVal) {
            var instance = this;

            if (prevVal > newVal && instance.buttonClicked === 'index') {
                instance.buttonClicked = 'prev'
            }

            instance._transitionIn(newImage);
            instance._transitionOut(oldImage);

            instance.buttonClicked = null;

            if (newMenuItem) {
                newMenuItem.addClass(CSS_MENU_ACTIVE);
            }

            if (oldImage) {
                oldImage.replaceClass(CSS_ITEM_ACTIVE, CSS_ITEM_TRANSITION);
            }

            if (oldMenuItem) {
                oldMenuItem.removeClass(CSS_MENU_ACTIVE);
            }

            newImage.addClass(CSS_ITEM_ACTIVE);
          },

        /**
         * Fire when a click is fired on menu.
         *
         * @method _onClickDelegate
         * @param event
         * @protected
         */
        _onClickDelegate: function(event) {
            var instance = this;

            var currentTarget = event.currentTarget;
            var handler;

            event.preventDefault();

            if (currentTarget.hasClass(CSS_MENU_INDEX)) {
                instance.buttonClicked = 'index';
                handler = instance._onMenuItemClick;
            }
            else if (currentTarget.hasClass(CSS_MENU_PREV)) {
                instance.buttonClicked = 'prev';
                handler = instance._updateIndexPrev;
            }
            else if (currentTarget.hasClass(CSS_MENU_NEXT)) {
                instance.buttonClicked = 'next';
                handler = instance._updateIndexNext;
            }
            else if (currentTarget.test(SELECTOR_MENU_PLAY_OR_PAUSE)) {
                handler = instance._onMenuPlayClick;
            }

            if (handler) {
                handler.apply(instance, arguments);
            }
        },

        /**
         * Execute when delegates handle menuItem click.
         *
         * @method _onMenuItemClick
         * @param event
         * @protected
         */
        _onMenuItemClick: function(event) {
            var instance = this;

            var newIndex = instance.menuNodes.indexOf(event.currentTarget);

            event.preventDefault();

            instance.set('activeIndex', newIndex);
        },

        /**
         * Execute when delegates handle play click.
         *
         * @method _onMenuPlayClick
         * @param event
         * @protected
         */
        _onMenuPlayClick: function(event) {
            var instance = this;

            this.set('playing', !this.get('playing'));
        },

        /**
         * Render the menu in DOM.
         *
         * @method _renderMenu
         * @protected
         */
          _renderMenu: function() {
            var instance = this;

            var activeIndex = instance.get('activeIndex');
            var controlsDot = instance.get('controlsDot');
            var items = [];
            var len = instance.nodeSelection.size();

            items.push('<li class="carousel-menu-index-container"><menu>');

            for (var i = 0; i < len; i++) {
                items.push(
                    '<li><a class="'
                    + CSS_MENU_ITEM
                    + ' '
                    + (activeIndex === i ? CSS_MENU_ITEM_ACTIVE : CSS_MENU_ITEM_DEFAULT)
                    + '" href="">'
                    + (controlsDot ? controlsDot : i)
                    + '</a></li>'
                );
            }

            items.push('</menu></li>');

            if (instance.get('playing') === false) {
                CSS_MENU_PAUSE = CSS_MENU_PAUSE + ' hide';
            }
            else {
                CSS_MENU_PLAY = CSS_MENU_PLAY + ' hide';
            }

            var menu = Y.Node.create(
                '<menu>'
                + '<li><a class="' + CSS_MENU_ITEM + ' ' + CSS_MENU_PLAY + '" href="">'
                + instance.get('controlsPlay')
                + '</a></li><li><a class="' + CSS_MENU_ITEM + ' ' + CSS_MENU_PAUSE + '" href="">'
                + instance.get('controlsPause')
                + '</a></li>'
                + '<li><a class="' + CSS_MENU_ITEM + ' ' + CSS_MENU_PREV + '" href="">'
                + instance.get('controlsPrev')
                + '</a></li>'
                + items.join(' ')
                + '<li><a class="' + CSS_MENU_ITEM + ' ' + CSS_MENU_NEXT + '" href="">'
                + instance.get('controlsNext')
                + '</a></li>'
                + '</menu>'
            );

            instance.get('contentBox').appendChild(menu);

            return menu;
        },

        /**
         * Set the <code>activeIndex</code> attribute.
         *
         * @method _setActiveIndex
         * @param val
         * @protected
         */
        _setActiveIndex: function(val) {
            var instance = this;

            if (val === 'rand') {
                val = instance._createIndexRandom();
            }
            else {
                val = Math.max(Math.min(val, instance.nodeSelection.size()), -1);
            }

            return val;
        },

        /**
         * Set the <code>nodeMenu</code> attribute.
         *
         * @method _setNodeMenu
         * @param val
         * @protected
         */
        _setNodeMenu: function(val) {
            var instance = this;

            return Y.one(val) || instance._renderMenu();
        },

        _transitionIn: function(object) {
            var instance = this;

            var transitionConfig = {
                easing: 'cubic-bezier(0.7, 0, 0.3, 1)'
            };

            switch (instance.transitionType) {
                case 'press-away':
                case 'slide':
                    if (instance.buttonClicked === 'prev') {
                        transitionConfig.left = '0';
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    left: '100%',
                                    opacity: '1'
                                });
                            },
                            end: function() {
                                this.setStyles({
                                    left: '',
                                    opacity: ''
                                });
                            }
                        };
                    }
                    else {
                        transitionConfig.left = '0';
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    left: '-100%',
                                    opacity: '1'
                                });
                            },
                            end: function() {
                                this.setStyles({
                                    left: '',
                                    opacity: ''
                                });
                            }
                        };
                    }
                    instance._handleSlideInOrig(object, transitionConfig);
                    break;
                case 'snapin':
                    if (instance.buttonClicked === 'prev') {
                        transitionConfig.left = {
                            delay: 0.25,
                            duration: 0.3,
                            value: '0'
                        };
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    left: '-100%',
                                    opacity: '1'
                                });
                            },
                            end: function() {
                                this.setStyles({
                                    left: '',
                                    opacity: ''
                                });
                          }
                        };
                    }
                    else {
                        transitionConfig.left = {
                            delay: 0.25,
                            duration: 0.3,
                            value: '0'
                        };
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    left: '100%',
                                    opacity: '1'
                                });
                            },
                            end: function() {
                                this.setStyles({
                                    left: '',
                                    opacity: ''
                                });
                            }
                        };
                    }
                    instance._handleSlideInOrig(object, transitionConfig);
                    break;
                case 'soft-scale':
                    if (instance.buttonClicked === 'prev') {
                        transitionConfig.duration = 1;
                        transitionConfig.opacity = '1';
                        transitionConfig.transform = 'scale(1)';
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    opacity: '0',
                                    transform: 'scale(1.1)'
                                });
                            },
                            end: function() {
                                this.setStyles({
                                    opacity: '',
                                    transform: ''
                                });
                            }
                        }
                    }
                    else {
                        transitionConfig.duration = 1;
                        transitionConfig.opacity = '1';
                        transitionConfig.transform = 'scale(1)';
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    opacity: '0',
                                    transform: 'scale(0.9)'
                                });
                            },
                            end: function() {
                                this.setStyles({
                                    opacity: '',
                                    transform: ''
                                });
                            }
                        }
                    }
                    instance._handleSlideInOrig(object, transitionConfig);
                    break;
                default:
                    transitionConfig.opacity = '1';
                    transitionConfig.on = {
                        start: function() {
                            this.setStyles({
                                opacity: '0'
                            });
                        },
                        end: function() {
                            this.setStyles({
                                opacity: ''
                            });
                        }
                    };
                    instance._handleSlideInOrig(object, transitionConfig);
                    break;
            }
        },

        _transitionOut: function(object) {
            var instance = this;

            var transitionConfig = {
                easing: 'cubic-bezier(0.7, 0, 0.3, 1)'
            };

            switch (instance.transitionType) {
                case 'press-away':
                    if (instance.buttonClicked === 'prev') {
                        transitionConfig.left = '-100%';
                        transitionConfig.opacity = '0';
                        transitionConfig.transform = 'scale(0.9)';
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    left: '0',
                                    opacity: '1'
                                });
                            },
                
                            end: function() {
                                /* 
                                * Alloy 1.5.1 and 2.0.0
                                * .setStyle doesn't remove browser prefixed transform property
                                */
                                this.removeAttribute('style');
                            }
                        };
                    }
                    else {
                        transitionConfig.left = '100%';
                        transitionConfig.opacity = '0';
                        transitionConfig.transform = 'scale(0.9)';
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    left: '0',
                                    opacity: '1'
                                });
                            },
                            end: function() {
                                /* 
                                * Alloy 1.5.1 and 2.0.0
                                * .setStyle doesn't remove browser prefixed transform property
                                */
                                this.removeAttribute('style');
                            }
                        };
                    }

                    instance._handleSlideOutOrig(object, transitionConfig);
                    break;
                case 'slide':
                    if (instance.buttonClicked === 'prev') {
                        transitionConfig.left = '-100%';
                        transitionConfig.on = {
                            start: function() {
                                this.setStyles({
                                    left: '0',
                                    opacity: '1'
                                });
                            },
                            end: function() {
                                this.setStyles({
                                    left: '',
                                    opacity: ''
                                });
                            }
                        };
                    }
                    else {
                      transitionConfig.left = '100%';
                      transitionConfig.on = {
                        start: function() {
                            this.setStyles({
                                left: '0',
                                opacity: '1'
                            });
                        },
                        end: function() {
                            this.setStyles({
                                left: '',
                                opacity: ''
                            });
                        }
                      };
                    }

                    instance._handleSlideOutOrig(object, transitionConfig);
                    break;
                case 'snapin':
                    if (instance.buttonClicked === 'prev') {
                        object.transition({
                            left: '50px',
                            opacity: '0',
                            on: {
                                start: function() {
                                    this.setStyles({
                                        left: '0',
                                        opacity: '1'
                                    });
                                },

                                end: function() {
                                    this.setStyles({
                                        left: '',
                                        opacity: ''
                                    });
                                }
                            }
                        });
                    }
                    else {
                        object.transition({
                            left: '-50px',
                            opacity: '0',
                            on: {
                                start: function() {
                                    this.setStyles({
                                        left: '0',
                                        opacity: '1'
                                  });
                                },

                                end: function() {
                                    this.setStyles({
                                        left: '',
                                        opacity: ''
                                    });
                                }
                            }
                        });
                    }
                    break;
                case 'soft-scale':
                    if (instance.buttonClicked === 'prev') {
                        transitionConfig.opacity = '0';
                        transitionConfig.transform = 'scale(0.9)';

                        transitionConfig.on = {
                            start: function() {
                                /* 
                                * Alloy 1.5.1 and 2.0.0
                                * .setStyle doesn't remove browser prefixed transform property
                                */
                                this.removeAttribute('style');

                                this.setStyles({
                                    opacity: '1'
                                });
                            },

                            end: function() {
                                /* 
                                * Alloy 1.5.1 and 2.0.0
                                * .setStyle doesn't remove browser prefixed transform property
                                */
                                this.removeAttribute('style');

                                this.setStyles({
                                    opacity: ''
                                });
                            }
                        }
                    }
                    else {
                        transitionConfig.opacity = '0';
                        transitionConfig.transform = 'scale(1.1)';

                        transitionConfig.on = {
                            start: function() {
                                /* 
                                * Alloy 1.5.1 and 2.0.0
                                * .setStyle doesn't remove browser prefixed transform property
                                */
                                this.removeAttribute('style');

                                this.setStyles({
                                    opacity: '1'
                                });
                            },
                
                            end: function() {
                                /* 
                                * Alloy 1.5.1 and 2.0.0
                                * .setStyle doesn't remove browser prefixed transform property
                                */
                                this.removeAttribute('style');

                                this.setStyles({
                                    opacity: ''
                                });
                            }
                        }
                    }

                    instance._handleSlideOutOrig(object, transitionConfig);
                    break;
                default:
                    transitionConfig.opacity = '0';
                    transitionConfig.on = {
                        start: function() {
                            this.setStyles({
                                opacity: '1'
                            });
                        },
                        end: function() {
                            this.setStyles({
                                opacity: ''
                            });
                        }
                    };

                    instance._handleSlideOutOrig(object, transitionConfig);
                    break;
            }
        },

        /**
         * Set the <code>activeIndex</code> on the UI.
         *
         * @method _uiSetActiveIndex
         * @param newVal
         * @param objOptions
         * @protected
         */
        _uiSetActiveIndex: function(newVal, objOptions) {
            var instance = this;

            var oldImage = null;
            var oldMenuItem = null;
            var onStart = null;
            var onEnd = null;

            var newImage = instance.nodeSelection.item(newVal);
            var menuNodes = instance.menuNodes;
            var newMenuItem = menuNodes.item(newVal);

            if (objOptions && (objOptions.prevVal !== 'undefined')) {
                var prevVal = objOptions.prevVal;

                oldMenuItem = menuNodes.item(prevVal);
                oldImage = instance.nodeSelection.item(prevVal);
            }
            else {
                if (newImage) {
                    newImage.addClass(CSS_ITEM_ACTIVE);
                }
            }

            if (objOptions) {
                var animate = objOptions.animate;

                instance._onAnimationStart(animate, newImage, oldImage, newMenuItem, oldMenuItem, prevVal, newVal);
            }
        },

        /**
         * Set the <code>activeIndex</code> to the next index.
         *
         * @method _updateIndexNext
         * @param options
         * @protected
         */
        _updateIndexNext: function(options) {
            var instance = this;

            var currentIndex = instance.get('activeIndex');
            var nodeSelectionSize = instance.nodeSelection.size();

            var newIndex = currentIndex + 1;

            if (newIndex > (nodeSelectionSize - 1)) {
                newIndex = 0;
            }

            instance.set('activeIndex', newIndex, options);
        },

        /**
         * Set the <code>activeIndex</code> to the previous index.
         *
         * @method _updateIndexPrev
         * @param options
         * @protected
         */
        _updateIndexPrev: function(options) {
            var instance = this;

            var currentIndex = instance.get('activeIndex');
            var newIndex = currentIndex - 1;

            if (newIndex < 0) {
                newIndex = instance.nodeSelection.size() - 1;
            }

            instance.set('activeIndex', newIndex, options);
        },

        /**
         * Set the <code>menuNodes</code> attribute based on the selector menu index.
         *
         * @method _updateMenuNodes
         * @param options
         * @protected
         */
        _updateMenuNodes: function() {
            var instance = this;

            instance.menuNodes = instance.nodeMenu.all(SELECTOR_MENU_INDEX);
        },

        /**
         * Update the <code>nodeSelection</code> by adding the CSS_ITEM class.
         *
         * @method _updateMenuNodes
         * @param options
         * @protected
         */
        _updateNodeSelection: function() {
            var instance = this;

            var itemSelector = instance.get('itemSelector');
            var nodeSelection = instance.get('contentBox').all(itemSelector);

            nodeSelection.addClass(CSS_ITEM);

            instance.nodeSelection = nodeSelection;
        },

        _intervalRotationTask: null
    });

    Y.Carousel = Carousel;

},'', {requires: ["node", "event", "transition", "widget"]});