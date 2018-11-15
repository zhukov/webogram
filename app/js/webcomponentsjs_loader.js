import '@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce';

const originalChildNodes = Object.getOwnPropertyDescriptor(Node.prototype, 'childNodes');

Object.defineProperty(Node.prototype, 'childNodes', {
  get() {
    if (!window.ShadyDOM) {
      return originalChildNodes.get.apply(this, []);
    }

    const node = this;

    return new Proxy(originalChildNodes.get.apply(this, []), {
      get(target, key) {
        return originalChildNodes.get.apply(node, [])[key];
      }
    });
  }
});
