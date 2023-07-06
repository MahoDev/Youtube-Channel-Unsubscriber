// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getData") {
    // Retrieve the data from storage
    chrome.storage.local.get(["allUnsubscribedChannelsData"], (result) => {
      // Send the data back to the content script
      const data = result.allUnsubscribedChannelsData || "[]"; // Default to an empty array if data is undefined
      sendResponse({ data });
    });
  } else if (request.action === "setData") {
    try {
      chrome.storage.local.set({
        allUnsubscribedChannelsData: request.data,
      });
      sendResponse({ success: true });
    } catch (err) {
      sendResponse({ success: false, error: err });
    }
  }
  // Return true to indicate that sendResponse will be called asynchronously
  return true;
});
