import fs from "fs";
import path from "path";

export interface BusinessCategoryData {
  [category: string]: string[];
}

export class BusinessCategoryService {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(
      __dirname,
      "../../liftpay-business-categories.json"
    );
  }

  /**
   * Get all business categories
   */
  getAllCategories(): string[] {
    try {
      const rawData = fs.readFileSync(this.dataPath, "utf8");
      const data: BusinessCategoryData = JSON.parse(rawData);
      return Object.keys(data).sort();
    } catch (error) {
      console.error("Error reading business categories data:", error);
      throw new Error("Failed to load business categories data");
    }
  }

  /**
   * Get all data (categories with their subcategories)
   */
  getAllData(): BusinessCategoryData {
    try {
      const rawData = fs.readFileSync(this.dataPath, "utf8");
      const data: BusinessCategoryData = JSON.parse(rawData);
      return data;
    } catch (error) {
      console.error("Error reading business category data:", error);
      throw new Error("Failed to load business category data");
    }
  }

  /**
   * Get subcategories for a specific business category
   */
  getSubcategoriesByCategory(category: string): string[] {
    try {
      const rawData = fs.readFileSync(this.dataPath, "utf8");
      const data: BusinessCategoryData = JSON.parse(rawData);

      if (!data[category]) {
        throw new Error(`Business category "${category}" not found`);
      }

      return data[category].sort();
    } catch (error) {
      console.error(
        `Error reading subcategories for category ${category}:`,
        error
      );
      throw new Error(`Failed to load subcategories for category: ${category}`);
    }
  }

  /**
   * Get business category data with metadata
   */
  getCategoryMetadata(): {
    totalCategories: number;
    totalSubcategories: number;
    categories: Array<{
      name: string;
      subcategoryCount: number;
      subcategories: string[];
    }>;
  } {
    try {
      const data = this.getAllData();
      const categories = Object.keys(data).sort();

      const categoriesData = categories.map((category) => ({
        name: category,
        subcategoryCount: data[category].length,
        subcategories: data[category].sort(),
      }));

      const totalSubcategories = categoriesData.reduce(
        (sum, category) => sum + category.subcategoryCount,
        0
      );

      return {
        totalCategories: categories.length,
        totalSubcategories,
        categories: categoriesData,
      };
    } catch (error) {
      console.error("Error generating business category metadata:", error);
      throw new Error("Failed to generate business category metadata");
    }
  }

  /**
   * Search business categories by name (case-insensitive)
   */
  searchCategories(query: string): string[] {
    try {
      const categories = this.getAllCategories();
      const lowerQuery = query.toLowerCase();

      return categories.filter((category) =>
        category.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error("Error searching business categories:", error);
      throw new Error("Failed to search business categories");
    }
  }

  /**
   * Search subcategories by name (case-insensitive)
   */
  searchSubcategories(
    query: string,
    category?: string
  ): Array<{
    subcategory: string;
    category: string;
  }> {
    try {
      const data = this.getAllData();
      const lowerQuery = query.toLowerCase();
      const results: Array<{ subcategory: string; category: string }> = [];

      if (category) {
        // Search within specific category
        if (data[category]) {
          const subcategories = data[category].filter((subcategory) =>
            subcategory.toLowerCase().includes(lowerQuery)
          );
          subcategories.forEach((subcategory) =>
            results.push({ subcategory, category })
          );
        }
      } else {
        // Search across all categories
        Object.keys(data).forEach((categoryName) => {
          const subcategories = data[categoryName].filter((subcategory) =>
            subcategory.toLowerCase().includes(lowerQuery)
          );
          subcategories.forEach((subcategory) =>
            results.push({ subcategory, category: categoryName })
          );
        });
      }

      return results.sort((a, b) => a.subcategory.localeCompare(b.subcategory));
    } catch (error) {
      console.error("Error searching subcategories:", error);
      throw new Error("Failed to search subcategories");
    }
  }

  /**
   * Get a specific subcategory by category and subcategory name
   */
  getSubcategory(
    category: string,
    subcategory: string
  ): {
    subcategory: string;
    category: string;
  } | null {
    try {
      const data = this.getAllData();

      if (!data[category]) {
        throw new Error(`Business category "${category}" not found`);
      }

      const subcategories = data[category];
      const foundSubcategory = subcategories.find(
        (sub) => sub.toLowerCase() === subcategory.toLowerCase()
      );

      if (!foundSubcategory) {
        throw new Error(
          `Subcategory "${subcategory}" not found in category "${category}"`
        );
      }

      return {
        subcategory: foundSubcategory,
        category,
      };
    } catch (error) {
      console.error(
        `Error getting subcategory ${subcategory} from ${category}:`,
        error
      );
      throw new Error(`Failed to get subcategory: ${subcategory}`);
    }
  }
}

export const businessCategoryService = new BusinessCategoryService();
