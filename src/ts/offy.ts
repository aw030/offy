/**
 * offy.js
 *
 * @author aw030
 * @copyright 2021
 **/
 
interface OffyInstance {
    config: any;
    offyConfig: OffyConfig;

    $menu: any;
    $trigger: any;
    $container: any;
    $overlay: any;
    $navbar: any;
    $wrapper: any;
    $wrapperInner: any;

    start: any;
    wrapper: any;
    expandedClass: string;
    expandedWidth: number;
    position: string;
    lastScrollTop: number;
    isScrolling: boolean;
    deltaX: number;
    menuShadow: boolean;
    overlayShadow: boolean;
    
    elements: any;
    cssClass: any;

    init(): any;
    initGlobal(): any;
    initOverlay(): any;
    initTrigger(): any;
    initScroll(): any;
    initTouchEvents(): any;
    handleEvent(e: any): any;
    currentPosition(): any;
    inBounds(position: number): any;
    onTouchStart(e: any): any;
    onTouchMove(e: any): any;
    onTouchEnd(e: any): any;
    toggleView(method: string);
    overlayClickBinding(method: string): any;
    onShow(detail: any): any;
    onHide(detail: any): any;
    wait(ms: number): any;
    afterToggleView(ms: number, method: string): any;
    open(): any;
    close(): any;
    toggle(): any;
}

class OffyInstance {
    config: any;
    offyConfig: OffyConfig;

    $menu: any;
    $trigger: any;
    $container: any;
    $overlay: any;
    $navbar: any;
    $wrapper: any;
    $wrapperInner: any;

    start: any;
    wrapper: any;
    expandedClass: string;
    expandedWidth: number;
    dragHandleOffset: number;
    position: string;
    lastScrollTop: number;
    isScrolling: boolean;
    deltaX: number;
    menuShadow: boolean;
    overlayShadow: boolean;
    
    elements: any = {
        body: $('body'),
        wrapper: $('#offy-outer'),
        wrapperInner: $('#offy-inner'),
        overlay: $(".offy-overlay"),
        navbar: $(".offy-navbar"),
        triggerTop: $("#offy-trigger-top")
    }
    
    cssClass: any = {
        overlay: "offy-overlay",
        scroll: "offy-scroll",
        scrollUp: "offy-scroll-up",
        scrollDown: "offy-scroll-down",
        active: "offy-active",
        expanded: "offy-expanded",
        expandedTop: "offy-expanded-top",
        menuShadow: "offy-menu-shadow",
        overlayShadow: "offy-overlay-shadow"
    }

    constructor(config: any, offyConfig: OffyConfig) {
        this.config = config || {};
        this.offyConfig = offyConfig;//@TODO: put more into OffyConfig

        this.$menu = config.$menu;
        this.expandedClass = config.expandedClass; //i.e. offy-expanded-left

        if (this.$menu.length == 0 || !this.expandedClass) {
            return;
        }

        this.$trigger = config.$trigger || [];
        this.$container = config.$container || this.elements.body;
        this.$overlay = config.$overlay || this.elements.overlay;
        this.$navbar = config.$navbar || this.elements.navbar;

        this.$wrapper = config.$wrapper || this.elements.wrapper;
        this.wrapper = this.$wrapper[0];
        this.$wrapperInner = config.$wrapperInner || this.elements.wrapperInner;

        this.dragHandleOffset = config.dragHandleOffset || this.$trigger.outerWidth();
        this.expandedWidth = this.$menu.outerWidth();
        this.position = config.position || 'left';
        
        this.menuShadow = false;
        if (typeof(config.layout) != "undefined") { 
            if (typeof config.layout.menuShadow != "undefined") {
                this.menuShadow = config.layout.menuShadow;
            }
        }
        
        this.overlayShadow = false;
        if (typeof this.offyConfig.get().global.layout != "undefined") {
            if (typeof this.offyConfig.get().global.layout.overlayShadow != "undefined") {
                this.overlayShadow = this.offyConfig.get().global.layout.overlayShadow;
            }
        }
        
        if (typeof(config.callbacks) != "undefined") { 
            if (typeof(config.callbacks.onShow) == "function") {
                this.onShow = config.callbacks.onShow;
            } else if (typeof this.offyConfig.get().global.callbacks != "undefined") {
                if (typeof(this.offyConfig.get().global.callbacks.onShow) == "function") {
                    this.onShow = this.offyConfig.get().global.callbacks.onShow;
                }
            }
            if (typeof(config.callbacks.onHide) == "function") {
                this.onHide = config.callbacks.onHide;
            }else if (typeof this.offyConfig.get().global.callbacks != "undefined") {
                if (typeof(this.offyConfig.get().global.callbacks.onHide) == "function") {
                    this.onHide = this.offyConfig.get().global.callbacks.onHide;
                }
            }
        } else if (typeof this.offyConfig.get().global.callbacks != "undefined") {
            if (typeof(this.offyConfig.get().global.callbacks.onShow) == "function") {
                this.onShow = this.offyConfig.get().global.callbacks.onShow;
            }
            if (typeof(this.offyConfig.get().global.callbacks.onHide) == "function") {
                this.onHide = this.offyConfig.get().global.callbacks.onHide;
            }
        }

        this.init();
        this.start = null;
    }

    init () {
        this.initGlobal();
        this.initOverlay();
        this.initTrigger();
        this.initScroll();
        this.initTouchEvents();
    }

    initGlobal () {
        if (this.menuShadow) {
            this.$menu.addClass(this.cssClass.menuShadow);
        }
        if (this.overlayShadow) {
            this.$overlay.addClass(this.cssClass.overlayShadow);
        }
    }

    initOverlay () {
        if (!this.$overlay.length) {
            this.$overlay = $("<div></div>").addClass(this.cssClass.overlay);
            this.$wrapperInner.prepend(this.$overlay);
        }
    }

    initTrigger () {
        let self = this;
        if (this.$trigger.length > 0) {
            this.$trigger.bind("click", function() {
                var method = !self.$container.hasClass(self.expandedClass) ? 'addClass': 'removeClass';
                self.toggleView(method);
            });
        }
    }

    initScroll () {
        let self = this;
        this.lastScrollTop = 0;
        this.$container.scroll(function(event) {
            var st = $(this).scrollTop();
            if (st <= 60) {
                self.$container.removeClass(self.cssClass.scroll);
                self.$container.removeClass(self.cssClass.scrollUp);
                self.$container.removeClass(self.cssClass.scrollDown);
                self.$container.css("padding-top", "0px");
                self.lastScrollTop = st;
                return;
            }
            if (st > self.lastScrollTop) {
                // Downscroll code
                //self.$navbar.removeClass("navbar-fixed-top");
                self.$container.addClass(self.cssClass.scroll);
                self.$container.addClass(self.cssClass.scrollDown);
                self.$container.css("padding-top", "60px");
                self.$container.removeClass(self.cssClass.scrollUp);
            } else {
                // Upscroll code
                //self.$navbar.addClass("navbar-fixed-top");
                self.$container.addClass(self.cssClass.scroll);
                self.$container.removeClass(self.cssClass.scrollDown);
                self.$container.css("padding-top", "60px");
                self.$container.addClass(self.cssClass.scrollUp);
            }
            self.lastScrollTop = st;
        });
    }

    initTouchEvents () {
        if (this.wrapper.addEventListener && this.position !== "top") {
            this.wrapper.addEventListener('touchstart', this, false);
            this.wrapper.addEventListener('touchmove', this, false);
            this.wrapper.addEventListener('touchend', this, false);
            this.wrapper.addEventListener('touchcancel', this, false);
        }
    }

    handleEvent (e) {
        switch (e.type) {
            case 'touchstart': this.onTouchStart(e); break;
            case 'touchmove': this.onTouchMove(e); break;
            case 'touchcancel':
                case 'touchend': this.onTouchEnd(e); break;
        }
    }

    currentPosition () {
        return this.position == 'left' ? this.$menu.offset().left + this.expandedWidth: this.$menu.offset().left;
    }

    inBounds (position) {
        return (this.position == 'left' && position >= 0 && position <= this.expandedWidth) ||
        (position >= -this.expandedWidth && position <= 0);
    }

    onTouchStart (e) {

        var pageX = e.touches[0].pageX;

        // Return if invalid start touch position
        if (this.currentPosition() - this.dragHandleOffset > pageX ||
            this.currentPosition() + this.dragHandleOffset < pageX)
            return;

        this.start = {
            startingX: this.currentPosition(),

            pageX: pageX,
            pageY: e.touches[0].pageY
        };

        this.deltaX = this.$wrapper.position().left;

        this.isScrolling = undefined;

        this.wrapper.style.MozTransitionDuration = this.wrapper.style.webkitTransitionDuration = 0;

        e.stopPropagation();
    }

    onTouchMove (e) {

        if (!this.start)
            return;

        this.deltaX = e.touches[0].pageX - this.start.pageX;

        if (typeof this.isScrolling == 'undefined') {
            this.isScrolling = !!(this.isScrolling || Math.abs(this.deltaX) < Math.abs(e.touches[0].pageY - this.start.pageY));
        }

        if (!this.isScrolling) {

            e.preventDefault();

            var newPos = this.position == 'left' ? this.start.startingX + this.deltaX: this.deltaX - ($(window).width() - this.start.startingX);

            if (!this.inBounds(newPos))
                return;

            // Immediately translate w/o duration.
            this.wrapper.style.MozTransform = this.wrapper.style.webkitTransform = 'translate3d(' + newPos + 'px,0,0)';

            e.stopPropagation();
        }
    }

    onTouchEnd (e) {

        if (!this.start)
            return;

        if (!this.isScrolling) {
            var self = this;

            // Check if swipe should open or close.
            var isOpeningMenu = (this.position == 'left' && this.deltaX > 0) ||
            (this.position == 'right' && this.deltaX < 0);

            this.$wrapper.attr('style', '');

            var method = isOpeningMenu ? 'addClass': 'removeClass';

            if (method == 'removeClass' && !this.$container.hasClass("offy-expanded-" + this.position)) {
                method = "addClass";
            }

            this.toggleView(method);
        }

        this.start = null;

        e.stopPropagation();
    }

    async toggleView (method: string) {
        var self = this;
        var delay = 0;

        this.$trigger.css("pointer-events", "none");
        if (this.position !== "top") {
            if (this.$container.hasClass(this.cssClass.expandedTop)) {
                this.elements.triggerTop.removeClass(this.cssClass.active);
                this.$container.removeClass(this.cssClass.expanded);
                this.$container.removeClass(this.cssClass.expandedTop);
                delay = 400;
            }
        }
        await self.afterToggleView(delay, method);

        this.overlayClickBinding(method);
    }

    overlayClickBinding (method: string) {
        var self = this;
        if (method === "addClass" && this.position !== "top") {
            this.$overlay.unbind("click").bind("click", function () {
                self.$trigger.click();
            });
        } else {
            this.$overlay.unbind("click");
        }
    }
    
    onShow (data: any): any {}
    
    onHide (data: any): any {}
    
    async wait (ms: number) {
        await new Promise < void > (resolve => setTimeout(()=>resolve(), ms)).then(()=>console.log("fired"));
    }
    
    async afterToggleView (ms: number, method: string) {
        var self = this;
        await new Promise < void > (resolve => setTimeout(()=>resolve(), ms)).then(
            function () {
                self.$trigger[method](self.cssClass.active).css("pointer-events", "all");
                self.$container[method](self.cssClass.expanded);
                self.$container[method](self.expandedClass);
                var eventData = {
                    bubbles: true,
                    cancelable: true,
                    "detail": {
                        "position": self.position
                    }
                }
                var eventName = "offy-";
                if (method === "addClass") {
                    self.onShow(eventData.detail);
                    eventName  += "expanded";
                } else {
                    self.onHide(eventData.detail);
                    eventName  += "condensed";
                }
                var event = new CustomEvent(
                     eventName, eventData
                );
                self.$container[0].dispatchEvent(event);
            }
        );
    }
    
    open () {
        this.$trigger.click();
    }
    
    close () {
        this.$trigger.click();
    }
    
    toggle () {
        this.$trigger.click();
    }
}

interface OffyConfig {
    config: any;
    
    get(type?: any): any;
}

class OffyConfig {
    config: any;
    
    constructor (config: any) {
        this.config = config;
    }
    
    get (type?: any) {
        return this.config;
    }
}

interface Offy {
    config: OffyConfig;
    top: OffyInstance;
    left: OffyInstance;
    right: OffyInstance;
    instances: string[];
    
    init(): any;
}

class Offy {
    config: OffyConfig;
    top: OffyInstance;
    left: OffyInstance;
    right: OffyInstance;
    instances: string[] = ["top", "left", "right"];
    
    constructor (config: any) {
        this.config = new OffyConfig(config || {});
        this.init();
    }
    
    init () {
        for ( var i in this.instances) {
            if (this.config.get()[this.instances[i]]) {
                
                this[this.instances[i]] = new OffyInstance(
                    this.config.get()[this.instances[i]], 
                    this.config
                );
            }
        }
    }
}
