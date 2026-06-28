/**
 * Helper to download a file from a URL on the client-side.
 * It attempts to fetch the file as a Blob to force download with a filename.
 * If CORS or network errors prevent this, it falls back to opening the link in a new tab.
 */
export async function downloadFile(url: string, filename: string) {
  try {
    // If it's a relative path, use it directly. If it's an external URL, fetch it.
    const response = await fetch(url);
    if (!response.ok) throw new Error('Response not OK');
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn(`Direct download failed for ${url}, falling back to opening in new tab:`, err);
    // Fallback: open in new tab
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
