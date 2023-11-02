import tl = require('azure-pipelines-task-lib/task');

export enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
    Off = 255
}

export interface ILogger {
    debug(message: string): void,
    info(message: string): void,
    warn(message: string): void,
    error(message: string): void
}

export class Logger implements ILogger {
    private _level: LogLevel;
    
    constructor(level: LogLevel) {
        this._level = level;
    }

    public debug(message: string): void {
        this.log(LogLevel.Debug, message);
    }

    public info(message: string): void {
        this.log(LogLevel.Info, message);
    }

    public warn(message: string): void {
        this.log(LogLevel.Warn, message);
    }

    public error(message: string): void {
        this.log(LogLevel.Error, message);
    }

    private log(level: LogLevel, message: string): void {
        // always log debug to system debug
        if (level === LogLevel.Debug)
            tl.debug(message);

        // always set task result on error
        if (level === LogLevel.Error)
            tl.setResult(tl.TaskResult.Failed, message);

        if (level < this._level)
            return;

        switch (level)
        {
            case LogLevel.Info:
                console.log(message);
                break;

            case LogLevel.Warn:
                tl.warning(message);
                break;
        }
           
    }
}

export class NullLogger implements ILogger {
    debug(message: string): void {
    }
    info(message: string): void {
    }
    warn(message: string): void {
    }
    error(message: string): void {
    }
}

export function getLogger() : ILogger {
    const level : LogLevel = tl.getVariable("system.debug") == "true" ? LogLevel.Debug : LogLevel.Info;

    return new Logger(level);
}