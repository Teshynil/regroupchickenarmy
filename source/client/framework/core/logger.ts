/**
 * Custom TypeScript logger for RegroupChickenArmy
 * Provides timing, configurable prefix, and colored output for different message levels
 */

export enum LogLevel {
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    WARNING = 'WARN',
    ERROR = 'ERROR',
}

export class Logger {
    private static startTime: number | null = null;
    private static prefix: string = '';
    private static initialized: boolean = false;

    // Color codes for different log levels
    private static readonly colors = {
        [LogLevel.INFO]: '#3498db', // Blue
        [LogLevel.DEBUG]: '#2ecc71', // Green
        [LogLevel.WARNING]: '#f39c12', // Orange
        [LogLevel.ERROR]: '#e74c3c', // Red
    };

    /**
     * Initialize the logger with a prefix and start the timer
     * @param prefix The prefix to use for all log messages
     */
    public static initialize(prefix: string = 'RCA'): void {
        Logger.prefix = prefix;
        Logger.startTime = Date.now();
        Logger.initialized = true;
        console.log('Logger initialized');
    }

    /**
     * Get the elapsed time since logger initialization
     */
    private static getElapsedTime(): number {
        if (Logger.startTime === null) return 0;
        return Date.now() - Logger.startTime;
    }

    /**
     * Format the elapsed time as a string (milliseconds)
     */
    private static formatElapsedTime(): string {
        const elapsed = Logger.getElapsedTime();
        return `${elapsed}ms`;
    }

    /**
     * Check if we're in a development environment
     */
    private static isDevelopmentEnvironment(): boolean {
        if (window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1) {
            return true;
        }

        return false;
    }

    /**
     * Log a message with the specified level
     * @param level The log level
     * @param message The message to log
     * @param args Additional arguments to log
     */
    private static log(level: LogLevel, message: string, ...args: any[]): void {
        // Skip debug messages in production
        if (level === LogLevel.DEBUG && !Logger.isDevelopmentEnvironment()) {
            return;
        }

        // If not initialized, fall back to regular console.log
        if (!Logger.initialized) {
            console.log(message, ...args);
            return;
        }

        // Only show time in development environment
        let formattedMessage: string;
        if (Logger.isDevelopmentEnvironment()) {
            const timeString = this.formatElapsedTime();
            formattedMessage = `[${timeString}] [${this.prefix}] [${level}]: ${message}`;
        } else {
            formattedMessage = `[${this.prefix}] [${level}]: ${message}`;
        }

        // Apply color based on log level
        const color = Logger.colors[level];

        // Log with color styling
        console.log(`%c${formattedMessage}`, `color: ${color}; font-weight: bold`, ...args);
    }

    /**
     * Log an info message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    public static info(message: string, ...args: any[]): void {
        Logger.log(LogLevel.INFO, message, ...args);
    }

    /**
     * Log a debug message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    public static debug(message: string, ...args: any[]): void {
        Logger.log(LogLevel.DEBUG, message, ...args);
    }

    /**
     * Log a warning message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    public static warn(message: string, ...args: any[]): void {
        Logger.log(LogLevel.WARNING, message, ...args);
    }

    /**
     * Log an error message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    public static error(message: string, ...args: any[]): void {
        Logger.log(LogLevel.ERROR, message, ...args);
    }
}
