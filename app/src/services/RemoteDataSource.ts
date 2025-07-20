import axios, { AxiosResponse } from "axios";
import fs from "fs/promises";
import path from "path";
import { downloadWithRetry, sleep } from "../utils/network";
import type { DownloadOptions } from "@/core/types";

export class RemoteDataSource {
  private static readonly DEFAULT_OPTIONS: DownloadOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    rateLimit: 200,
    timeout: 5000,
    cleanupBeforeDownload: true,
  };
  private baseUrl: string;
  private downloadOptions: DownloadOptions;
  private csvValidator: (response: AxiosResponse) => boolean;

  constructor(options: Partial<DownloadOptions> = {}) {
    this.baseUrl = Buffer.from(process.env.REMOTE || "", "base64").toString("utf-8");
    if (!this.baseUrl) {
      throw new Error("REMOTE environment variable is not set.");
    }
    this.downloadOptions = { ...RemoteDataSource.DEFAULT_OPTIONS, ...options };
    this.csvValidator = (response: AxiosResponse): boolean => {
      const contentType = response.headers["content-type"];
      return !!contentType && contentType.includes("text/csv");
    };
  }

  public getCsvUrl(fileName: string): string {
    return `${this.baseUrl}${fileName}`;
  }

  public async getRemoteUpdateTime(): Promise<Date | null> {
    const updateFileUrl = this.getCsvUrl("Last_update.csv");
    try {
      console.log(`Fetching remote update time from ${updateFileUrl}`);
      const csvData = await downloadWithRetry(
        updateFileUrl,
        this.downloadOptions,
        this.csvValidator
      );
      // Clean up the CSV data by removing carriage returns and empty entries
      const lines = csvData
        .split("\n")
        .map(
          (line: string) =>
            line
              .split("|")
              .map((cell) => cell.trim()) // Remove whitespace, \r , etc.
              .filter(Boolean) // Remove empty strings
        )
        .filter((line: string[]) => line.length > 0); // Remove empty lines

      console.log("Remote update data received:", lines);
      if (!lines[1] || !lines[1][0]) {
        throw new Error(
          "Invalid CSV format: The second line containing the timestamp is missing or empty."
        );
      }
      const timestamp = lines[1][0]; // Get the timestamp from the second row, first column
      console.log("Remote update timestamp:", timestamp);
      return new Date(timestamp);
    } catch (error: any) {
      console.error("Failed to fetch remote update time:", error.message);
      return null;
    }
  }

  public async downloadCSVs(
    urls: string[],
    destinationDir: string
  ): Promise<void> {
    if (!urls || urls.length === 0)
      throw new Error("No URLs provided for download.");
    const results: Array<{ success: boolean; url: string; error?: string }> =
      [];

    for (const url of urls) {
      const fileName = path.basename(url);
      const filePath = path.join(destinationDir, fileName);
      try {
        console.log(`Downloading ${fileName}...`);
        const data = await downloadWithRetry(
          url,
          this.downloadOptions,
          this.csvValidator
        );
        await fs.writeFile(filePath, data);
        results.push({ success: true, url });
        console.log(`Downloaded ${fileName} successfully.`);
        await sleep(this.downloadOptions.rateLimit);
      } catch (error: any) {
        const errorMessage = axios.isAxiosError(error)
          ? `HTTP ${error.response?.status} - ${error.message}`
          : error.message;

        console.error(`Failed to download ${fileName}:`, errorMessage);
        results.push({ success: false, url, error: errorMessage });
      }
    }

    // Summary report
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    console.log(`\nDownload Summary:`);
    console.log(
      `✅ Successfully downloaded: ${successful}/${urls.length} files`
    );

    if (failed.length > 0) {
      console.log(`❌ Failed downloads:`);
      failed.forEach((f) =>
        console.log(`   - ${path.basename(f.url)}: ${f.error}`)
      );
      throw new Error(`${failed.length} downloads failed`);
    }
  }
}
