import { Logger } from "../core/logger";

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        Logger.debug(`Delaying for ${ms}ms`);
        setTimeout(resolve, ms)});
}