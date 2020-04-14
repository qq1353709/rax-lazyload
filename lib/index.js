function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { return function () { var Super = _getPrototypeOf(Derived), result; if (_isNativeReflectConstruct()) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

/**
 * react-lazyload
 */
import { Component, createElement } from 'rax';
import findDOMNode from 'rax-find-dom-node';
import Div from 'rax-view';
import { on, off } from './utils/event';
import scrollParent from './utils/scrollParent';
import debounce from './utils/debounce';
import throttle from './utils/throttle';
var defaultBoundingClientRect = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0
};
var LISTEN_FLAG = 'data-lazyload-listened';
var listeners = [];
var pending = []; // try to handle passive events

var passiveEventSupported = false;

try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function get() {
      passiveEventSupported = true;
    }
  });
  window.addEventListener('test', null, opts);
} catch (e) {} // if they are supported, setup the optional params
// IMPORTANT: FALSE doubles as the default CAPTURE value!


var passiveEvent = passiveEventSupported ? {
  capture: false,
  passive: true
} : false;
/**
 * Check if `component` is visible in overflow container `parent`
 * @param  {node} component React component
 * @param  {node} parent    component's scroll parent
 * @return {bool}
 */

var checkOverflowVisible = function checkOverflowVisible(component, parent) {
  var node = findDOMNode(component);
  var parentTop;
  var parentLeft;
  var parentHeight;
  var parentWidth;

  try {
    var _parent$getBoundingCl = parent.getBoundingClientRect();

    parentTop = _parent$getBoundingCl.top;
    parentLeft = _parent$getBoundingCl.left;
    parentHeight = _parent$getBoundingCl.height;
    parentWidth = _parent$getBoundingCl.width;
  } catch (e) {
    parentTop = defaultBoundingClientRect.top;
    parentLeft = defaultBoundingClientRect.left;
    parentHeight = defaultBoundingClientRect.height;
    parentWidth = defaultBoundingClientRect.width;
  }

  var windowInnerHeight = window.innerHeight || document.documentElement.clientHeight;
  var windowInnerWidth = window.innerWidth || document.documentElement.clientWidth; // calculate top and height of the intersection of the element's scrollParent and viewport

  var intersectionTop = Math.max(parentTop, 0); // intersection's top relative to viewport

  var intersectionLeft = Math.max(parentLeft, 0); // intersection's left relative to viewport

  var intersectionHeight = Math.min(windowInnerHeight, parentTop + parentHeight) - intersectionTop; // height

  var intersectionWidth = Math.min(windowInnerWidth, parentLeft + parentWidth) - intersectionLeft; // width
  // check whether the element is visible in the intersection

  var top;
  var left;
  var height;
  var width;

  try {
    var _node$getBoundingClie = node.getBoundingClientRect();

    top = _node$getBoundingClie.top;
    left = _node$getBoundingClie.left;
    height = _node$getBoundingClie.height;
    width = _node$getBoundingClie.width;
  } catch (e) {
    top = defaultBoundingClientRect.top;
    left = defaultBoundingClientRect.left;
    height = defaultBoundingClientRect.height;
    width = defaultBoundingClientRect.width;
  }

  var offsetTop = top - intersectionTop; // element's top relative to intersection

  var offsetLeft = left - intersectionLeft; // element's left relative to intersection

  var offsets = Array.isArray(component.props.offset) ? component.props.offset : [component.props.offset, component.props.offset]; // Be compatible with previous API

  return offsetTop - offsets[0] <= intersectionHeight && offsetTop + height + offsets[1] >= 0 && offsetLeft - offsets[0] <= intersectionWidth && offsetLeft + width + offsets[1] >= 0;
};
/**
 * Check if `component` is visible in document
 * @param  {node} component React component
 * @return {bool}
 */


var checkNormalVisible = function checkNormalVisible(component) {
  var node = findDOMNode(component); // If this element is hidden by css rules somehow, it's definitely invisible

  if (!(node.offsetWidth || node.offsetHeight || node.getClientRects().length)) return false;
  var top;
  var elementHeight;

  try {
    var _node$getBoundingClie2 = node.getBoundingClientRect();

    top = _node$getBoundingClie2.top;
    elementHeight = _node$getBoundingClie2.height;
  } catch (e) {
    top = defaultBoundingClientRect.top;
    elementHeight = defaultBoundingClientRect.height;
  }

  var windowInnerHeight = window.innerHeight || document.documentElement.clientHeight;
  var offsets = Array.isArray(component.props.offset) ? component.props.offset : [component.props.offset, component.props.offset]; // Be compatible with previous API

  return top - offsets[0] <= windowInnerHeight && top + elementHeight + offsets[1] >= 0;
};
/**
 * Detect if element is visible in viewport, if so, set `visible` state to true.
 * If `once` prop is provided true, remove component as listener after checkVisible
 *
 * @param  {React} component   React component that respond to scroll and resize
 */


var checkVisible = function checkVisible(component) {
  var node = findDOMNode(component);

  if (!(node instanceof HTMLElement)) {
    return;
  }

  var parent = scrollParent(node);
  var isOverflow = component.props.overflow && parent !== node.ownerDocument && parent !== document && parent !== document.documentElement;
  var visible = isOverflow ? checkOverflowVisible(component, parent) : checkNormalVisible(component);

  if (visible) {
    // Avoid extra render if previously is visible
    if (!component.visible) {
      if (component.props.once) {
        pending.push(component);
      }

      component.visible = true;
      component.forceUpdate();
    }
  } else if (!(component.props.once && component.visible)) {
    component.visible = false;

    if (component.props.unmountIfInvisible) {
      component.forceUpdate();
    }
  }
};

var purgePending = function purgePending() {
  pending.forEach(function (component) {
    var index = listeners.indexOf(component);

    if (index !== -1) {
      listeners.splice(index, 1);
    }
  });
  pending = [];
};

var lazyLoadHandler = function lazyLoadHandler() {
  for (var i = 0; i < listeners.length; ++i) {
    var listener = listeners[i];
    checkVisible(listener);
  } // Remove `once` component in listeners


  purgePending();
};
/**
 * Forces the component to display regardless of whether the element is visible in the viewport.
 */


var forceVisible = function forceVisible() {
  for (var i = 0; i < listeners.length; ++i) {
    var listener = listeners[i];
    listener.visible = true;
    listener.forceUpdate();
  } // Remove `once` component in listeners


  purgePending();
}; // Depending on component's props


var delayType;
var finalLazyLoadHandler = null;

var LazyLoad = /*#__PURE__*/function (_Component) {
  _inherits(LazyLoad, _Component);

  var _super = _createSuper(LazyLoad);

  function LazyLoad(props) {
    var _this;

    _classCallCheck(this, LazyLoad);

    _this = _super.call(this, props);
    _this.visible = false;
    return _this;
  }

  _createClass(LazyLoad, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      // It's unlikely to change delay type on the fly, this is mainly
      // designed for tests
      var scrollport = window;
      var scrollContainer = this.props.scrollContainer;

      if (scrollContainer) {
        if (isString(scrollContainer)) {
          scrollport = scrollport.document.querySelector(scrollContainer);
        }
      }

      var needResetFinalLazyLoadHandler = this.props.debounce !== undefined && delayType === 'throttle' || delayType === 'debounce' && this.props.debounce === undefined;

      if (needResetFinalLazyLoadHandler) {
        off(scrollport, 'scroll', finalLazyLoadHandler, passiveEvent);
        off(window, 'resize', finalLazyLoadHandler, passiveEvent);
        finalLazyLoadHandler = null;
      }

      if (!finalLazyLoadHandler) {
        if (this.props.debounce !== undefined) {
          finalLazyLoadHandler = debounce(lazyLoadHandler, typeof this.props.debounce === 'number' ? this.props.debounce : 300);
          delayType = 'debounce';
        } else if (this.props.throttle !== undefined) {
          finalLazyLoadHandler = throttle(lazyLoadHandler, typeof this.props.throttle === 'number' ? this.props.throttle : 300);
          delayType = 'throttle';
        } else {
          finalLazyLoadHandler = lazyLoadHandler;
        }
      }

      if (this.props.overflow) {
        var parent = scrollParent(findDOMNode(this));

        if (parent && typeof parent.getAttribute === 'function') {
          var listenerCount = 1 + +parent.getAttribute(LISTEN_FLAG);

          if (listenerCount === 1) {
            parent.addEventListener('scroll', finalLazyLoadHandler, passiveEvent);
          }

          parent.setAttribute(LISTEN_FLAG, listenerCount);
        }
      } else if (listeners.length === 0 || needResetFinalLazyLoadHandler) {
        var _this$props = this.props,
            scroll = _this$props.scroll,
            resize = _this$props.resize;

        if (scroll) {
          on(scrollport, 'scroll', finalLazyLoadHandler, passiveEvent);
        }

        if (resize) {
          on(window, 'resize', finalLazyLoadHandler, passiveEvent);
        }
      }

      listeners.push(this);
      checkVisible(this);
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate() {
      return this.visible;
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.props.overflow) {
        var parent = scrollParent(findDOMNode(this));

        if (parent && typeof parent.getAttribute === 'function') {
          var listenerCount = +parent.getAttribute(LISTEN_FLAG) - 1;

          if (listenerCount === 0) {
            parent.removeEventListener('scroll', finalLazyLoadHandler, passiveEvent);
            parent.removeAttribute(LISTEN_FLAG);
          } else {
            parent.setAttribute(LISTEN_FLAG, listenerCount);
          }
        }
      }

      var index = listeners.indexOf(this);

      if (index !== -1) {
        listeners.splice(index, 1);
      }

      if (listeners.length === 0 && typeof window !== 'undefined') {
        off(window, 'resize', finalLazyLoadHandler, passiveEvent);
        off(window, 'scroll', finalLazyLoadHandler, passiveEvent);
      }
    }
  }, {
    key: "render",
    value: function render() {
      return this.visible ? this.props.children : this.props.placeholder ? this.props.placeholder : createElement(Div, {
        style: {
          height: this.props.height
        },
        className: "lazyload-placeholder"
      });
    }
  }]);

  return LazyLoad;
}(Component);

LazyLoad.defaultProps = {
  once: false,
  offset: 0,
  overflow: false,
  resize: false,
  scroll: true,
  unmountIfInvisible: false
};

var getDisplayName = function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
};

var decorator = function decorator() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return function lazyload(WrappedComponent) {
    return /*#__PURE__*/function (_Component2) {
      _inherits(LazyLoadDecorated, _Component2);

      var _super2 = _createSuper(LazyLoadDecorated);

      function LazyLoadDecorated() {
        var _this2;

        _classCallCheck(this, LazyLoadDecorated);

        _this2 = _super2.call(this);
        _this2.displayName = "LazyLoad".concat(getDisplayName(WrappedComponent));
        return _this2;
      }

      _createClass(LazyLoadDecorated, [{
        key: "render",
        value: function render() {
          return createElement(LazyLoad, options, createElement(WrappedComponent, this.props));
        }
      }]);

      return LazyLoadDecorated;
    }(Component);
  };
};

export { decorator as lazyload };
export default LazyLoad;
export { lazyLoadHandler as forceCheck };
export { forceVisible };