document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("h2");
  const submitBtn = document.querySelectorAll(".popup-btn")[0];
  const historyBtn = document.querySelectorAll(".popup-btn")[1];
  const historyContainer = document.querySelector(".history-container");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const currentUrl = tabs[0].url;
      if (currentUrl === "https://www.youtube.com/feed/channels") {
        header.textContent = "Reload the page to start unsubscribing.";
        submitBtn.textContent = "Reload";
        submitBtn.addEventListener("click", () => {
          chrome.tabs.reload(tabs[0].id);
          window.close();
        });
      } else {
        submitBtn.addEventListener("click", () => {
          chrome.tabs.create({ url: "https://www.youtube.com/feed/channels" });
          window.close();
        });
      }
    }
  });
  historyBtn.addEventListener("click", (e) => {
    //prevent adding over and over
    if (historyContainer.children.length > 0) {
      return;
    }
    chrome.storage.local.get(["allUnsubscribedChannelsData"], (result) => {
      if (result.allUnsubscribedChannelsData !== undefined) {
        let unsubscriptionProcesses = JSON.parse(
          result.allUnsubscribedChannelsData
        );
        if (unsubscriptionProcesses.length > 0) {
          unsubscriptionProcesses = unsubscriptionProcesses.reverse(); //latest first
          for (unsubProcess of unsubscriptionProcesses) {
            let record = document.createElement("div");
            record.classList.add("record");
            let date = document.createElement("p");
            date.innerText =
              unsubProcess.unsubscriptionProcessResult.creationDate;
            let downloadBtn = document.createElement("button");
            downloadBtn.innerText = "Download";
            downloadBtn.classList.add("popup-btn", "download-btn");
            record.appendChild(date);
            record.appendChild(downloadBtn);
            historyContainer.appendChild(record);
          }
        }
      } else {
        let text = document.createElement("p");
        text.innerText = "There's no prior history.";
        text.style.textAlign = "center";
        historyContainer.appendChild(text);
      }
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("download-btn")) {
      const element = document.createElement("a");
      e.target.appendChild(element);
      let date = e.target.previousElementSibling.innerText;
      downloadFile(date, element);
    }
  });

  async function getFileContent(date) {
    let unsubscribedChannels = await new Promise((resolve) => {
      chrome.storage.local.get(["allUnsubscribedChannelsData"], (result) => {
        let unsubscriptionProcesses = JSON.parse(
          result.allUnsubscribedChannelsData
        );
        for (unsubProcess of unsubscriptionProcesses) {
          if (unsubProcess.unsubscriptionProcessResult.creationDate === date) {
            resolve({
              username: unsubProcess.loggedInUser,
              channelsData:
                unsubProcess.unsubscriptionProcessResult
                  .unsubscribedChannelsInfo,
            });
            break;
          }
        }
      });
    });
    let content = JSON.stringify(unsubscribedChannels);
    let formattedContent = content
      .replace(/,(?={)/g, "\n")
      .replace(`"channelsData":`, `\n"channelsData":\n`);
    return (
      "These are the channels you unsubscribed from: \n\n" + formattedContent
    );
  }

  async function downloadFile(date, anchorElement) {
    let content = await getFileContent(date);
    const file = new Blob([content], { type: "text/plain" });
    anchorElement.href = URL.createObjectURL(file);
    anchorElement.download = `Unsubscriptions on ${date}.txt`;
    anchorElement.click();
  }
});
