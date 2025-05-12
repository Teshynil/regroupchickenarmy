import { Logger } from "../core/logger";

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        if (ms > 0) {
            if (gameui.bgaAnimationsActive()) {
                Logger.debug(`Delaying for ${ms}ms`);
                setTimeout(resolve, ms)
            } else {
                Logger.debug(`Skipping delay of ${ms}ms due to animations being disabled`);
                resolve();
            }
        } else {
            Logger.warn(`Delaying for 0ms, this was not expected`);
            resolve();
        }
    });
}

export function waitUntil(condition: () => boolean, timeout: number = 3000): Promise<boolean> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkCondition = () => {
            if (condition()) {
                resolve(true);
            } else if (Date.now() - startTime >= timeout) {
                resolve(false);
            } else {
                setTimeout(checkCondition, 100);
            }
        };
        checkCondition();
    });
}