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

/**
 * A tappable "pill" option (difficulty/region/skin/theme/accessibility
 * toggles). Plain `<div onClick>` chips are invisible to screen readers and
 * unreachable by keyboard, so this bakes in button semantics everywhere
 * chips are used instead of relying on every call site to remember.
 */
export function chip(label: string, selected: boolean, onClick: () => void, extraStyle = ""): HTMLDivElement {
  const node = el("div", {
    class: `chip ${selected ? "selected" : ""}`,
    style: extraStyle,
    role: "button",
    tabindex: "0",
    "aria-pressed": String(selected),
    onClick: () => onClick(),
  }, [label]) as HTMLDivElement;
  node.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  });
  return node;
}
