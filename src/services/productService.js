const Category = require("../models/categoryModel");
const qogitaService = require("./qogitaService");

/**
 * Get brands from Qogita API
 * @param {Object} queryParams - Query parameters for pagination and filtering
 * @returns {Object} - Paginated list of brands
 */
exports.getBrands = async (queryParams = {}) => {
  try {
    // Handle slug parameter which should be an array
    const params = { ...queryParams };

    // If slug is provided as an array, convert it to the correct format for the API
    if (params.slug && Array.isArray(params.slug)) {
      // The API expects multiple slug parameters, not an array
      const slugParams = new URLSearchParams();

      // Add all other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (key !== "slug") {
          slugParams.append(key, value);
        }
      });

      // Add each slug as a separate parameter
      params.slug.forEach((slug) => {
        slugParams.append("slug", slug);
      });

      const queryString = slugParams.toString();
      const endpoint = `/brands/${queryString ? `?${queryString}` : ""}`;

      // Make authenticated request to Qogita API
      const response = await qogitaService.makeAuthenticatedRequest(
        "get",
        endpoint
      );

      return response;
    } else {
      // Standard query string conversion for non-array parameters
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/brands/${queryString ? `?${queryString}` : ""}`;

      // Make authenticated request to Qogita API
      const response = await qogitaService.makeAuthenticatedRequest(
        "get",
        endpoint
      );

      return response;
    }
  } catch (error) {
    console.error("Error fetching brands:", error.message);
    throw error;
  }
};

/**
 * Get categories from Qogita API
 * @param {Object} queryParams - Query parameters for pagination and filtering
 * @returns {Object} - Paginated list of categories
 */
exports.getCategories = async (queryParams = {}) => {
  try {
    // Handle slug parameter which should be an array
    const params = { ...queryParams };

    // If slug is provided as an array, convert it to the correct format for the API
    if (params.slug && Array.isArray(params.slug)) {
      // The API expects multiple slug parameters, not an array
      const slugParams = new URLSearchParams();

      // Add all other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (key !== "slug") {
          slugParams.append(key, value);
        }
      });

      // Add each slug as a separate parameter
      params.slug.forEach((slug) => {
        slugParams.append("slug", slug);
      });

      const queryString = slugParams.toString();
      const endpoint = `/categories/${queryString ? `?${queryString}` : ""}`;

      // Make authenticated request to Qogita API
      const response = await qogitaService.makeAuthenticatedRequest(
        "get",
        endpoint
      );

      return response;
    } else {
      // Standard query string conversion for non-array parameters
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/categories/${queryString ? `?${queryString}` : ""}`;

      // Make authenticated request to Qogita API
      const response = await qogitaService.makeAuthenticatedRequest(
        "get",
        endpoint
      );

      return response;
    }
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    throw error;
  }
};

/**
 * Search products (variants) from Qogita API
 * @param {Object} queryParams - Query parameters for filtering products
 * @param {string} queryParams.query - General search query term
 * @param {string} queryParams.category_name - Filter by category name
 * @param {string|string[]} queryParams.brand_name - Filter by brand name(s). Can be provided multiple times to filter for multiple brands
 * @param {string|string[]} queryParams.category_slug - Filter by category slug(s)
 * @param {number} queryParams.min_price - Filter by minimum price
 * @param {number} queryParams.max_price - Filter by maximum price
 * @param {number} queryParams.page - Page number for pagination
 * @param {number} queryParams.page_size - Number of items per page
 * @returns {Object} - Paginated list of products with facets
 */
exports.searchProducts = async (queryParams = {}) => {
  try {
    // Create a copy of the query parameters to avoid modifying the original
    const params = { ...queryParams };

    // Validate numeric parameters
    if (params.min_price) {
      params.min_price = Number(params.min_price);
      if (isNaN(params.min_price)) {
        delete params.min_price;
      }
    }

    if (params.max_price) {
      params.max_price = Number(params.max_price);
      if (isNaN(params.max_price)) {
        delete params.max_price;
      }
    }

    if (params.page) {
      params.page = Number(params.page);
      if (isNaN(params.page) || params.page < 1) {
        params.page = 1;
      }
    }

    if (params.page_size) {
      params.page_size = Number(params.page_size);
      if (isNaN(params.page_size) || params.page_size < 1) {
        params.page_size = 20; // Default page size
      }
    }

    // Handle special cases for parameters that can have multiple values
    let urlSearchParams = new URLSearchParams();

    // Add all parameters except those that can have multiple values
    Object.entries(params).forEach(([key, value]) => {
      if (key !== "category_slug" && key !== "brand_name") {
        urlSearchParams.append(key, value);
      }
    });

    // Handle category_slug specially to support multiple values
    if (params.category_slug) {
      if (Array.isArray(params.category_slug)) {
        // If it's already an array, add each value
        params.category_slug.forEach((slug) => {
          urlSearchParams.append("category_slug", slug);
        });
      } else if (typeof params.category_slug === "string") {
        // If it's a string, check if it contains multiple values
        const slugs = params.category_slug.split(",");
        if (slugs.length > 1) {
          // Multiple slugs separated by commas
          slugs.forEach((slug) => {
            urlSearchParams.append("category_slug", slug.trim());
          });
        } else {
          // Single slug
          urlSearchParams.append("category_slug", params.category_slug);
        }
      }
    }

    // Handle brand_name specially to support multiple values
    if (params.brand_name) {
      if (Array.isArray(params.brand_name)) {
        // If it's already an array, add each value
        params.brand_name.forEach((brand) => {
          urlSearchParams.append("brand_name", brand);
        });
      } else if (typeof params.brand_name === "string") {
        // If it's a string, check if it contains multiple values
        const brands = params.brand_name.split(",");
        if (brands.length > 1) {
          // Multiple brands separated by commas
          brands.forEach((brand) => {
            urlSearchParams.append("brand_name", brand.trim());
          });
        } else {
          // Single brand
          urlSearchParams.append("brand_name", params.brand_name);
        }
      }
    }

    const queryString = urlSearchParams.toString();
    const endpoint = `/variants/search/${queryString ? `?${queryString}` : ""}`;

    console.log(`Searching products with endpoint: ${endpoint}`);

    // Make authenticated request to Qogita API
    const response = await qogitaService.makeAuthenticatedRequest(
      "get",
      endpoint
    );
    const categoryName = urlSearchParams.get("category_name");

    const matchedCategories = await Category.find({
      categoryName: categoryName,
    });
    const matchedCategory = matchedCategories[0];
    console.log(matchedCategory, "matchedCategory");
    if (matchedCategory) {
      if (isNaN(matchedCategory.priceCost)) {
        throw new Error("Invalid priceCost in matched category");
      }
      if (isNaN(matchedCategory.weightCost)) {
        throw new Error("Invalid weightCost in matched category");
      }
      response.results.forEach((item) => {
        const basePrice = parseFloat(item.price) || 0;
        const mass = parseFloat(item?.dimensions?.mass) || 0;
        const priceCost = matchedCategory.priceCost || 0;
        const weightCost = matchedCategory.weightCost || 0;
        item.price =
          basePrice + (basePrice * priceCost) / 100 + (mass * weightCost) / 100;
      });
    }
    return response;
  } catch (error) {
    console.error("Error searching products:", error.message);
    throw error;
  }
};

/**
 * Get a single product (variant) by ID
 * @param {String} variantId - Variant ID (QID)
 * @returns {Object} - Product details
 */
exports.getProductById = async (variantId) => {
  try {
    const endpoint = `/variants/${variantId}/`;

    // Make authenticated request to Qogita API
    const response = await qogitaService.makeAuthenticatedRequest(
      "get",
      endpoint
    );

    return response;
  } catch (error) {
    console.error(`Error fetching product ${variantId}:`, error.message);
    throw error;
  }
};

/**
 * Get a product (variant) by GTIN
 * @param {string} gtin - Product GTIN
 * @returns {Object} - Product details
 */

exports.getProductByGtin = async (gtin) => {
  if (!gtin) {
    throw new Error("GTIN is required");
  }

  try {
    const endpoint = `/variants/${gtin}/`;
    const response = await qogitaService.makeAuthenticatedRequest(
      "get",
      endpoint
    );
    if (!response || typeof response !== "object" || !response.category) {
      throw new Error("Invalid product response");
    }
    const getSellersListendpoint = `variants/${response.fid}/${response.slug}/offers`;
    const listedSellerResponse = await qogitaService.makeAuthenticatedRequest(
      "get",
      getSellersListendpoint
    );
    response.offers = listedSellerResponse.offers;
    const matchedCategories = await Category.find({
      categoryName: response.category.name,
    });
    const matchedCategory = matchedCategories[0];

    const mass = parseFloat(response.dimensions?.mass) || 0;
    const minCut = 25; // your cut in percent

    let minOfferPrice = Infinity;

    response.offers.forEach((offer) => {
      const offerPrice = parseFloat(offer.price) || 0;
      const offerPriceVariableCost = matchedCategory
        ? (offerPrice * matchedCategory.priceCost) / 100 +
          (mass * matchedCategory.weightCost) / 100
        : 0;

      const finalOfferPrice =
        offerPrice + offerPriceVariableCost + (offerPrice * minCut) / 100;
      const movVariableCost = offerPriceVariableCost
        ? offerPriceVariableCost / offerPrice
        : 1;
      offer.price = finalOfferPrice.toFixed(2);
      const mov =
        parseFloat(offer.mov) * movVariableCost + (offer?.unit > 5
          ? 0
          : parseInt(offer.unit * offerPrice));

      // Calculate quantity needed to meet MOV
      const quantityNeeded = Math.ceil((mov * 1.25) / finalOfferPrice);
      const finalOrderTotal = (quantityNeeded * finalOfferPrice).toFixed(2);

      // Store these values in the offer object
      offer.minQuantity = quantityNeeded;
      offer.finalOrderValue = finalOrderTotal;

      if (finalOfferPrice < minOfferPrice) {
        minOfferPrice = finalOfferPrice;
      }
    });

    // Set response.price to lowest final offer price
    response.price = minOfferPrice.toFixed(2);

    // console.log(response);
    return response;
  } catch (error) {
    console.error(`Error fetching product by GTIN ${gtin}:`, error);
    throw error;
  }
};

// exports.getProductByGtin = async (gtin) => {
//   try {
//     const endpoint = `/variants/${gtin}/`;

//     // Make authenticated request to Qogita API
//     const response = await qogitaService.makeAuthenticatedRequest('get', endpoint);

//     return response;
//   } catch (error) {
//     console.error(`Error fetching product by GTIN ${gtin}:`, error.message);
//     throw error;
//   }
// };

/**
 * Search products (variants) by search term
 * @param {string} searchTerm - Search term
 * @param {Object} queryParams - Additional query parameters
 * @returns {Object} - Search results
 */
exports.searchProductsByTerm = async (searchTerm, queryParams = {}) => {
  try {
    // Create a copy of the query parameters to avoid modifying the original
    const params = { ...queryParams };

    // Create URL search params for additional query parameters
    const urlSearchParams = new URLSearchParams();

    // Add all parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlSearchParams.append(key, value);
      }
    });

    const queryString = urlSearchParams.toString();
    const endpoint = `/variants/${searchTerm}/${
      queryString ? `?${queryString}` : ""
    }`;

    console.log(
      `Searching products with term: ${searchTerm}, endpoint: ${endpoint}`
    );

    // Make authenticated request to Qogita API
    const response = await qogitaService.makeAuthenticatedRequest(
      "get",
      endpoint
    );

    return response;
  } catch (error) {
    console.error(
      `Error searching products with term ${searchTerm}:`,
      error.message
    );
    throw error;
  }
};
