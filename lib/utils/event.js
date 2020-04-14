export function on(el, eventName, callback, opts) {
  opts = opts || false;

  if (el.addEventListener) {
    el.addEventListener(eventName, callback, opts);
  } else if (el.attachEvent) {
    el.attachEvent("on".concat(eventName), function (e) {
      callback.call(el, e || window.event);
    });
  }
}
export function off(el, eventName, callback, opts) {
  opts = opts || false;

  if (el.removeEventListener) {
    el.removeEventListener(eventName, callback, opts);
  } else if (el.detachEvent) {
    el.detachEvent("on".concat(eventName), callback);
  }
}