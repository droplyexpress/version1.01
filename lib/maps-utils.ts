/**
/**
 * Maps utility functions for opening navigation
 * Supports Google Maps and Waze
 */

// Search address by postal code
export async function searchAddressByPostalCode(
  postalCode: string,
): Promise<{ address: string; postalCode: string; city: string } | null> {
  try {
    // For now, we just validate and return the postal code
    // In a real app, this would call a geocoding service like Google Maps API
    if (postalCode && postalCode.length >= 3) {
      return {
        address: "",
        postalCode: postalCode,
        city: "",
      };
    }
    return null;
  } catch (error) {
    console.error("Error searching address by postal code:", error);
    return null;
  }
}

// Generate Google Maps URL for web
function generateGoogleMapsDirectionsUrl(
  origin: string,
  destination: string,
  postalCode?: string,
): string {
  const destAddress = postalCode
    ? `${destination}, ${postalCode}`
    : destination;
  const params = new URLSearchParams({
    origin,
    destination: destAddress,
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Generate Google Maps search URL
export function generateGoogleMapsSearchUrl(
  destination: string,
  postalCode?: string,
): string {
  const destAddress = postalCode
    ? `${destination}, ${postalCode}`
    : destination;
  const encodedDest = encodeURIComponent(destAddress);
  return `https://www.google.com/maps/search/${encodedDest}`;
}

// Generate Waze URL for navigation
export function generateWazeUrl(address: string, postalCode?: string): string {
  const fullAddress = postalCode ? `${address}, ${postalCode}` : address;
  const encodedAddress = encodeURIComponent(fullAddress);
  return `https://waze.com/ul?navigate=yes&q=${encodedAddress}`;
}

/**
 * Open a URL - for iOS PWA, we need to create a real link and let the browser handle it
 */
function openURL(url: string): void {
  console.log(`[Maps] openURL called with: ${url.substring(0, 100)}...`);

  try {
    // Create a real anchor element
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "none";

    // CRITICAL: Append to body before clicking - iOS PWA requires this
    document.body.appendChild(link);

    // Trigger the click - browser will handle opening the URL
    link.dispatchEvent(
      new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      }),
    );

    console.log("[Maps] ✓ Click dispatched");

    // Clean up
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch (e) {
        // Already removed
      }
    }, 100);
  } catch (error) {
    console.error("[Maps] Method failed:", error);
  }
}

/**
 * Open directions between two locations
 * Uses web URL (works in all contexts)
 */
export function openGoogleMapsDirections(
  origin: string,
  destination: string,
  postalCode?: string,
): void {
  console.log("[Maps] Opening directions via web URL");
  const webUrl = generateGoogleMapsDirectionsUrl(
    origin,
    destination,
    postalCode,
  );
  openURL(webUrl);
}

/**
 * Get current user location and open directions to a destination
 * Used by drivers to navigate
 */
export function openDirectionsFromCurrentLocation(
  destination: string,
  postalCode?: string,
): void {
  console.log("[Maps] openDirectionsFromCurrentLocation called");
  console.log(`[Maps] Destination: ${destination}`);
  console.log(`[Maps] Postal Code: ${postalCode}`);

  // Check if geolocation is available
  if (!navigator.geolocation) {
    console.warn(
      "[Maps] Geolocation not available, using destination-only search",
    );
    const webUrl = generateGoogleMapsSearchUrl(destination, postalCode);
    console.log(`[Maps] Fallback URL: ${webUrl}`);
    openURL(webUrl);
    return;
  }

  console.log("[Maps] Requesting user location...");
  let locationTimeoutId: NodeJS.Timeout;

  // Set a fallback timeout - if geolocation takes too long, just show the destination
  locationTimeoutId = setTimeout(() => {
    console.warn(
      "[Maps] Geolocation took too long, using destination-only search",
    );
    const webUrl = generateGoogleMapsSearchUrl(destination, postalCode);
    console.log(`[Maps] Timeout fallback URL: ${webUrl}`);
    openURL(webUrl);
  }, 8000); // 8 second timeout (shorter than the geolocation timeout)

  // Request current position
  navigator.geolocation.getCurrentPosition(
    (position) => {
      clearTimeout(locationTimeoutId);
      try {
        const { latitude, longitude, accuracy } = position.coords;
        const origin = `${latitude},${longitude}`;
        console.log("[Maps] ✓ Location obtained:", origin);
        console.log(`[Maps] Accuracy: ±${Math.round(accuracy || 0)}m`);

        // Open maps with both origin and destination
        console.log("[Maps] Opening directions with current location");
        openGoogleMapsDirections(origin, destination, postalCode);
      } catch (error) {
        console.error("[Maps] Error processing location:", error);
        // Fallback: use destination only
        const webUrl = generateGoogleMapsSearchUrl(destination, postalCode);
        console.log(`[Maps] Error fallback URL: ${webUrl}`);
        openURL(webUrl);
      }
    },
    (error) => {
      clearTimeout(locationTimeoutId);
      console.error(
        `[Maps] Geolocation error (code ${error.code}): ${error.message}`,
      );
      console.log("[Maps] Opening destination without current location");

      // Fallback: use destination only
      const webUrl = generateGoogleMapsSearchUrl(destination, postalCode);
      console.log(`[Maps] Geolocation error fallback URL: ${webUrl}`);
      openURL(webUrl);
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}
