import { Logger } from "./logger";

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        Logger.debug(`Delaying for ${ms}ms`);
        setTimeout(resolve, ms)});
}