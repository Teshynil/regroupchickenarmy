/**
 * Custom TypeScript logger for RegroupChickenArmy
 * Provides timing, configurable prefix, and colored output for different message levels
 */

export enum LogLevel {
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    WARNING = 'WARN',
    ERROR = 'ERROR'
}

export class Logger {
    private static _instance: Logger | null = null;
    private startTime: number | null = null;
    private prefix: string = '';
    private initialized: boolean = false;

    // Color codes for different log levels
    private readonly colors = {
        [LogLevel.INFO]: '#3498db',    // Blue
        [LogLevel.DEBUG]: '#2ecc71',   // Green
        [LogLevel.WARNING]: '#f39c12', // Orange
        [LogLevel.ERROR]: '#e74c3c'    // Red
    };

    private constructor() {}

    /**
     * Get the singleton instance of the Logger
     */
    public static get instance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    /**
     * Initialize the logger with a prefix and start the timer
     * @param prefix The prefix to use for all log messages
     */
    public initialize(prefix: string = 'RCA'): void {
        this.prefix = prefix;
        this.startTime = Date.now();
        this.initialized = true;
        console.log('Logger initialized');
    }

    /**
     * Get the elapsed time since logger initialization
     */
    private getElapsedTime(): number {
        if (this.startTime === null) return 0;
        return Date.now() - this.startTime;
    }

    /**
     * Format the elapsed time as a string (milliseconds)
     */
    private formatElapsedTime(): string {
        const elapsed = this.getElapsedTime();
        return `${elapsed}ms`;
    }

    /**
     * Check if we're in a development environment
     */
    private isDevelopmentEnvironment(): boolean {
        try {
            // @ts-ignore
            const dataLayer = window.dataLayer;
            if (!dataLayer || !Array.isArray(dataLayer)) return false;

            const envEntry = dataLayer.find(e => e && e['user_environment']);
            return envEntry && envEntry.user_environment === 'dev';
        } catch (e) {
            return false;
        }
    }

    /**
     * Log a message with the specified level
     * @param level The log level
     * @param message The message to log
     * @param args Additional arguments to log
     */
    private log(level: LogLevel, message: string, ...args: any[]): void {
        // Skip debug messages in production
        if (level === LogLevel.DEBUG && !this.isDevelopmentEnvironment()) {
            return;
        }

        // If not initialized, fall back to regular console.log
        if (!this.initialized) {
            console.log(message, ...args);
            return;
        }

        // Only show time in development environment
        let formattedMessage: string;
        if (this.isDevelopmentEnvironment()) {
            const timeString = this.formatElapsedTime();
            formattedMessage = `[${timeString}] [${this.prefix}] [${level}] - ${message}`;
        } else {
            formattedMessage = `[${this.prefix}] [${level}] - ${message}`;
        }

        // Apply color based on log level
        const color = this.colors[level];

        // Log with color styling
        console.log(`%c${formattedMessage}`, `color: ${color}; font-weight: bold`, ...args);
    }

    /**
     * Log an info message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    public info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    /**
     * Log a debug message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    public debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    /**
     * Log a warning message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    public warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARNING, message, ...args);
    }

    /**
     * Log an error message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    public error(message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }
}

// Export a default instance for easy access
export const logger = Logger.instance;
