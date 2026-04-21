import fs from "fs";
import path from "path";

export interface StateData {
  [state: string]: string[];
}

export class LocationService {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(__dirname, "../../nigeria-states-lgas.json");
  }

  /**
   * Get all states in Nigeria
   */
  getAllStates(): string[] {
    try {
      const rawData = fs.readFileSync(this.dataPath, "utf8");
      const data: StateData = JSON.parse(rawData);
      return Object.keys(data).sort();
    } catch (error) {
      console.error("Error reading states data:", error);
      throw new Error("Failed to load states data");
    }
  }

  /**
   * Get all data (states with their LGAs)
   */
  getAllData(): StateData {
    try {
      const rawData = fs.readFileSync(this.dataPath, "utf8");
      const data: StateData = JSON.parse(rawData);
      return data;
    } catch (error) {
      console.error("Error reading location data:", error);
      throw new Error("Failed to load location data");
    }
  }

  /**
   * Get LGAs for a specific state
   */
  getLGAsByState(state: string): string[] {
    try {
      const rawData = fs.readFileSync(this.dataPath, "utf8");
      const data: StateData = JSON.parse(rawData);

      if (!data[state]) {
        throw new Error(`State "${state}" not found`);
      }

      return data[state].sort();
    } catch (error) {
      console.error(`Error reading LGAs for state ${state}:`, error);
      throw new Error(`Failed to load LGAs for state: ${state}`);
    }
  }

  /**
   * Get state and LGA data with metadata
   */
  getLocationMetadata(): {
    totalStates: number;
    totalLGAs: number;
    states: Array<{
      name: string;
      lgaCount: number;
      lgAs: string[];
    }>;
  } {
    try {
      const data = this.getAllData();
      const states = Object.keys(data).sort();

      const statesData = states.map((state) => ({
        name: state,
        lgaCount: data[state].length,
        lgAs: data[state].sort(),
      }));

      const totalLGAs = statesData.reduce(
        (sum, state) => sum + state.lgaCount,
        0
      );

      return {
        totalStates: states.length,
        totalLGAs,
        states: statesData,
      };
    } catch (error) {
      console.error("Error generating location metadata:", error);
      throw new Error("Failed to generate location metadata");
    }
  }

  /**
   * Search states by name (case-insensitive)
   */
  searchStates(query: string): string[] {
    try {
      const states = this.getAllStates();
      const lowerQuery = query.toLowerCase();

      return states.filter((state) => state.toLowerCase().includes(lowerQuery));
    } catch (error) {
      console.error("Error searching states:", error);
      throw new Error("Failed to search states");
    }
  }

  /**
   * Search LGAs by name (case-insensitive)
   */
  searchLGAs(
    query: string,
    state?: string
  ): Array<{
    lga: string;
    state: string;
  }> {
    try {
      const data = this.getAllData();
      const lowerQuery = query.toLowerCase();
      const results: Array<{ lga: string; state: string }> = [];

      if (state) {
        // Search within specific state
        if (data[state]) {
          const lgAs = data[state].filter((lga) =>
            lga.toLowerCase().includes(lowerQuery)
          );
          lgAs.forEach((lga) => results.push({ lga, state }));
        }
      } else {
        // Search across all states
        Object.keys(data).forEach((stateName) => {
          const lgAs = data[stateName].filter((lga) =>
            lga.toLowerCase().includes(lowerQuery)
          );
          lgAs.forEach((lga) => results.push({ lga, state: stateName }));
        });
      }

      return results.sort((a, b) => a.lga.localeCompare(b.lga));
    } catch (error) {
      console.error("Error searching LGAs:", error);
      throw new Error("Failed to search LGAs");
    }
  }
}

export const locationService = new LocationService();
