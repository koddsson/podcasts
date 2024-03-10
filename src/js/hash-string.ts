export async function sha256(message: string) {
  // encode as UTF-8
  const messageBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);

  // convert ArrayBuffer to Array
  const hashArray = [...new Uint8Array(hashBuffer)];

  const hashHex = hashArray
    // convert bytes to hex string
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
