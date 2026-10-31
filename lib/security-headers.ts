export const STRICT_TRANSPORT_SECURITY = "max-age=63072000; includeSubDomains; preload";
export const X_CONTENT_TYPE_OPTIONS = "nosniff";
export const REFERRER_POLICY = "strict-origin-when-cross-origin";
export const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "magnetometer=()",
  "browsing-topics=()",
  "interest-cohort=()",
  "accelerometer=(self)",
  "gyroscope=(self)",
].join(", ");
