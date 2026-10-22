export interface PageSnapshot {
  element: HTMLElement;
  dispose: () => void;
}

/**
 * A visual-only copy of the page as it is right now: same theme tokens, same
 * language. It is inserted just before the live page and stays behind it. The
 * live page is then clipped to a growing circle, which is what uncovers the
 * new state: text and background arrive together, with no colour inversion.
 */
export function createPageSnapshot(source: HTMLElement): PageSnapshot {
  const snapshot = document.createElement("div");
  snapshot.className = "water-snapshot";
  snapshot.setAttribute("aria-hidden", "true");
  snapshot.setAttribute("inert", "");

  // Freeze inherited tokens before the real document changes. Copy the
  // computed values, not a second hard-coded light/dark palette.
  const rootStyle = getComputedStyle(document.documentElement);
  for (let index = 0; index < rootStyle.length; index += 1) {
    const name = rootStyle.item(index);
    if (name.startsWith("--")) {
      snapshot.style.setProperty(name, rootStyle.getPropertyValue(name));
    }
  }
  snapshot.style.colorScheme = rootStyle.colorScheme;

  const copy = source.cloneNode(true) as HTMLElement;
  const originals = [source, ...source.querySelectorAll<HTMLElement>("*")];
  const copies = [copy, ...copy.querySelectorAll<HTMLElement>("*")];
  const bounds = source.getBoundingClientRect();
  copy.style.position = "absolute";
  copy.style.left = `${bounds.left}px`;
  copy.style.top = `${bounds.top}px`;
  copy.style.width = `${bounds.width}px`;
  copy.style.margin = "0";

  originals.forEach((original, index) => {
    const replica = copies[index];
    const style = getComputedStyle(original);
    // Fixed rails/back-to-top and a scrolled sticky mobile header must remain
    // at their viewport coordinates, not move to the cloned document's origin.
    if (style.position === "fixed" || style.position === "sticky") {
      const rect = original.getBoundingClientRect();
      if (style.position === "sticky") {
        // A sticky header still occupies space in normal flow. Keep that space
        // when freezing its visible copy, otherwise the whole page shifts up.
        const spacer = document.createElement("div");
        spacer.style.height = `${rect.height}px`;
        spacer.style.width = `${rect.width}px`;
        spacer.style.margin = style.margin;
        replica.before(spacer);
      }
      Object.assign(replica.style, {
        position: "fixed",
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        right: "auto",
        bottom: "auto",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        transform: "none",
      });
    }
    if (original === document.activeElement) {
      replica.style.outline = style.outline;
      replica.style.outlineOffset = style.outlineOffset;
      replica.style.boxShadow = style.boxShadow;
    }
    // No duplicate anchors/IDs, announcements, tab stops, or executable content.
    replica.removeAttribute("id");
    replica.removeAttribute("aria-labelledby");
    replica.removeAttribute("aria-describedby");
    replica.removeAttribute("aria-controls");
    replica.removeAttribute("aria-live");
    if (
      replica.matches(
        "a, button, input, select, textarea, [tabindex], [contenteditable]",
      )
    ) {
      replica.setAttribute("tabindex", "-1");
      replica.removeAttribute("autofocus");
      replica.removeAttribute("contenteditable");
    }
  });
  copy
    .querySelectorAll("script, iframe, object, embed")
    .forEach((node) => node.remove());
  snapshot.appendChild(copy);
  // Last in the body, but painted behind the live page: the copy has z-index 0
  // and the live page is lifted to 1 while it is clipped away.
  document.body.appendChild(snapshot);

  return { element: snapshot, dispose: () => snapshot.remove() };
}
