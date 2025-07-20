import fs from "fs/promises";
import path from "path";

export class LocalState {
  private localCopyPath: string;

  constructor() {
    this.localCopyPath = path.resolve(
      process.cwd(),
      "data",
      "last_update.local"
    );
  }

  public async getLocalUpdateTime(): Promise<Date | null> {
    try {
      const timestamp = await fs.readFile(this.localCopyPath, "utf8");
      return new Date(timestamp);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return null; // File doesn't exist, which is fine
      }
      console.error("Failed to read local update time:", error.message);
      return null;
    }
  }

  public async setLocalUpdateTime(date: Date): Promise<void> {
    await fs.writeFile(this.localCopyPath, date.toISOString());
    console.log(
      `Successfully updated local timestamp to ${date.toISOString()}`
    );
  }
}
