export function createElement(html: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild as HTMLElement;
}
