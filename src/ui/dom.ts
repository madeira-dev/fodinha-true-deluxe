export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | ((event: Event) => void)> | null,
  ...children: Array<string | Node | null | undefined>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs) {
    const keys = Object.keys(attrs);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = attrs[key];
      if (typeof value === 'function') {
        node.addEventListener(key, value);
      } else if (typeof value === 'boolean') {
        if (value) {
          node.setAttribute(key, '');
        }
      } else if (key === 'class') {
        node.className = value;
      } else {
        node.setAttribute(key, value);
      }
    }
  }

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (child === null || child === undefined || child === '') {
      continue;
    }
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }

  return node;
}
