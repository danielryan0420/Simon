export interface ElProps {
  class?: string;
  style?: string;
  html?: string;
  onClick?: (e: MouseEvent) => void;
  [attr: string]: string | ((e: MouseEvent) => void) | undefined;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  children: (Node | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (key === "html") node.innerHTML = value as string;
    else if (key === "onClick") node.addEventListener("click", value as EventListener);
    else if (key === "class") node.className = value as string;
    else node.setAttribute(key, value as string);
  }
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}
