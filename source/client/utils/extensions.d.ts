declare namespace DojoJS {
    interface Animation {
        node: HTMLElement;

        playAsync(): Promise<void>;
    }
}