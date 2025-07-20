import axios, { AxiosResponse } from 'axios';

// Type definition for the validator function for clarity
export type ResponseValidator = (response: AxiosResponse) => boolean;

interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A generic download utility that retries on failure.
 * @param url The URL to download from.
 * @param options The retry and timeout options.
 * @param validateResponse An optional callback to validate the response. If it returns false, it will be treated as a failure and trigger a retry.
 * @returns The downloaded data as a string.
 */
export async function downloadWithRetry(
  url: string,
  options: RetryOptions,
  validateResponse?: ResponseValidator,
  attempt = 1
): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: options.timeout,
      responseType: 'text',
    });

    if (validateResponse && !validateResponse(response)) {
      // Throw a custom error to trigger the retry logic
      throw new Error(`Validation failed for response from ${url}`);
    }

    return response.data;
  } catch (error: any) {
    if (attempt >= options.maxRetries) {
      // If all retries fail, throw the last error
      throw error;
    }
    console.log(
      `Attempt ${attempt} for ${url} failed, retrying after ${options.retryDelay}ms...`
    );
    await sleep(options.retryDelay);
    return downloadWithRetry(url, options, validateResponse, attempt + 1);
  }
}