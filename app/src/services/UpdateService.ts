import { DatabaseService } from "./DatabaseService";
import { LocalState } from "./LocalState";
import { RemoteDataSource } from "./RemoteDataSource";

export class UpdateService {
  private dbService: DatabaseService;
  private localState: LocalState;
  private remoteDataSource: RemoteDataSource;

  constructor(databaseService: DatabaseService) {
    this.dbService = databaseService;
    this.localState = new LocalState();
    this.remoteDataSource = new RemoteDataSource();
  }

  public async checkForUpdates(): Promise<void> {
    console.log("--- Starting Update Check ---");
    const remoteTime = await this.remoteDataSource.getRemoteUpdateTime();
    if (!remoteTime) {
      console.log("Could not determine remote update time. Aborting.");
      return;
    }

    const localTime = await this.localState.getLocalUpdateTime();

    if (!localTime || remoteTime > localTime) {
      console.log("New data found! Triggering database population...");

      await this.dbService.populate();
      
      // If populate() was successful, it won't throw an error.
      // We can now safely update the local timestamp.
      await this.localState.setLocalUpdateTime(remoteTime);

    } else {
      console.log("No new data found. Everything is up-to-date.");
    }
    console.log("--- Update Check Finished ---");
  }
}