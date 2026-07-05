import { Logger, LogLevel } from "../../atlas-runtime/Logging/Logger";

describe("Logger", () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger(LogLevel.DEBUG);
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("should log debug messages", () => {
    logger.debug("TestModule", "Debug message");
    const entries = logger.getEntries({ level: LogLevel.DEBUG });
    expect(entries.length).toBe(1);
    expect(entries[0].message).toBe("Debug message");
    expect(entries[0].module).toBe("TestModule");
  });

  test("should log info messages", () => {
    logger.info("TestModule", "Info message");
    const entries = logger.getEntries({ level: LogLevel.INFO });
    expect(entries.length).toBe(1);
    expect(entries[0].message).toBe("Info message");
  });

  test("should log warn messages", () => {
    logger.warn("TestModule", "Warn message");
    const entries = logger.getEntries({ level: LogLevel.WARN });
    expect(entries.length).toBe(1);
    expect(entries[0].message).toBe("Warn message");
  });

  test("should log error messages", () => {
    logger.error("TestModule", "Error message");
    const entries = logger.getEntries({ level: LogLevel.ERROR });
    expect(entries.length).toBe(1);
    expect(entries[0].message).toBe("Error message");
  });

  test("should include metadata in log entries", () => {
    const metadata = { key: "value" };
    logger.info("TestModule", "Test message", metadata);
    const entries = logger.getEntries();
    expect(entries[0].metadata).toEqual(metadata);
  });

  test("should filter entries by module", () => {
    logger.info("Module1", "Message 1");
    logger.info("Module2", "Message 2");
    const module1Entries = logger.getEntries({ module: "Module1" });
    expect(module1Entries.length).toBe(1);
    expect(module1Entries[0].message).toBe("Message 1");
  });

  test("should respect log level", () => {
    logger.setLevel(LogLevel.WARN);
    logger.debug("TestModule", "Should not log");
    logger.info("TestModule", "Should not log");
    logger.warn("TestModule", "Should log");
    logger.error("TestModule", "Should log");
    const entries = logger.getEntries();
    expect(entries.length).toBe(2);
  });

  test("should clear all entries", () => {
    logger.info("TestModule", "Test message");
    expect(logger.getEntries().length).toBe(1);
    logger.clear();
    expect(logger.getEntries().length).toBe(0);
  });
});
