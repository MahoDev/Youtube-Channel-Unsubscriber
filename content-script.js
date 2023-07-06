"use strict";

document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    scriptLoad();
  } else {
    window.onload = function () {
      scriptLoad();
    };
  }
};

function scriptLoad() {
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  const overlayContent = document.createElement("div");
  overlayContent.classList.add("overlay-content");
  const guideLabel = document.createElement("label");
  guideLabel.textContent = `Check the channels you want to stay subscribed to. Check nothing if you want to unsubscribe from all your channels.`;
  guideLabel.setAttribute("for", "channelsArea");
  const submitBtn = document.createElement("div");
  submitBtn.textContent = "Submit";
  submitBtn.classList.add("btn");
  const cancelBtn = document.createElement("div");
  cancelBtn.textContent = "Cancel";
  cancelBtn.classList.add("btn");

  // *********************** Logic Part ***********************
  async function subscribedChannelsCount() {
    return new Promise(async (resolve) => {
      let closedToggleableSidebar = document.querySelector(
        "#guide:not([opened])"
      );
      let sidebarSections = document.querySelector("#guide-content");
      let subscriptionSidebarSection = null;
      if (closedToggleableSidebar !== null) {
        let toggleBtn = document.querySelector("#guide-button");
        //open sidebar
        toggleBtn.click();
        //wait until sidebar is opened and loaded then query for subscriptionSidebarSection (We have to do this or query will be null)
        await new Promise((resolve) => {
          let intervalId = setInterval(() => {
            subscriptionSidebarSection =
              sidebarSections.querySelector(
                "h3:not([hidden])"
              )?.nextElementSibling;
            if (subscriptionSidebarSection !== undefined) {
              //close sidebar
              toggleBtn.click();
              clearInterval(intervalId);
              resolve();
            }
          }, 100);
        });
      } else {
        await new Promise((resolve) => {
          let intervalId = setInterval(() => {
            subscriptionSidebarSection =
              sidebarSections.querySelector(
                "h3:not([hidden])"
              )?.nextElementSibling;
            if (subscriptionSidebarSection !== undefined) {
              clearInterval(intervalId);
              resolve();
            }
          }, 100);
        });
      }

      let subscriptionSidebarSectionChannels =
        subscriptionSidebarSection.children;

      let visibleChannelsCount = subscriptionSidebarSectionChannels.length - 1;
      let lastElement =
        subscriptionSidebarSectionChannels[
          subscriptionSidebarSectionChannels.length - 1
        ];
      let showMoreChannelsCount = lastElement.innerText.match(/عنصرين/)
        ? 2
        : lastElement.innerText.match(/عنصر/)
        ? 1
        : lastElement.innerText.match(/\d/);
      let channelsCount = visibleChannelsCount + showMoreChannelsCount;
      //<= 6 means no "show more" part. Subtract one because youtube counts the "browse channels" option as part of the "show n more"
      channelsCount = channelsCount <= 6 ? channelsCount : channelsCount - 1;
      console.log(channelsCount);
      resolve(channelsCount);
    });
  }

  //load up the whole subscription list
  async function loadFullSubscriptionList() {
    return new Promise(async (resolve, reject) => {
      let parentContainer = null;
      await new Promise((resolve) => {
        let intervalId = setInterval(() => {
          parentContainer = document.querySelector(
            "#primary > ytd-section-list-renderer"
          );
          if (parentContainer !== null) {
            clearInterval(intervalId);
            resolve();
          }
        }, 100);
      });

      let subsChannelsCount = await subscribedChannelsCount();
      //kickstart the process
      let scrollDown = function () {
        window.scrollTo(0, parentContainer.scrollHeight);
      };
      setTimeout(scrollDown, 500);
      //If the subscriptions aren't alot and finished loading from first scrollDown
      let channelsInfo = document.querySelectorAll("#info-section");
      if (channelsInfo.length === subsChannelsCount) {
        window.scrollTo(0, 0);
        resolve(channelsInfo);
      }
      let mutationObserver = new MutationObserver(function (
        mutationRecords,
        observer
      ) {
        for (let mutation of mutationRecords) {
          if (
            mutation.type === "childList" &&
            mutation.target.classList.contains("style-scope") &&
            mutation.target.classList.contains("ytd-section-list-renderer")
          ) {
            scrollDown();
          }
        }

        let channelsInfo = document.querySelectorAll("#info-section");
        if (channelsInfo.length === subsChannelsCount) {
          observer.disconnect();
          window.scrollTo(0, 0);
          resolve(channelsInfo);
        }
      });

      mutationObserver.observe(parentContainer, {
        childList: true,
        subtree: true,
      });
    });
  }

  //Give the ability to pick channels to keep subscribed
  function displayChannelCheckingUI(allChannelsInfo) {
    return new Promise((resolve) => {
      let allChannelsNames = document.querySelectorAll(
        "#info-section #text-container #text"
      );

      overlayContent.appendChild(guideLabel);
      let allCheckersContainer = document.createElement("div");
      allCheckersContainer.classList.add("channel-checkers-container");

      allChannelsNames.forEach((value) => {
        let checkerContainer = document.createElement("div");
        let channelNameLabel = document.createElement("label");
        let checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.id = `${value.innerText}-checkbox`;
        channelNameLabel.textContent = value.innerText;
        channelNameLabel.setAttribute("for", `${value.innerText}-checkbox`);

        checkerContainer.appendChild(channelNameLabel);
        checkerContainer.appendChild(checkbox);
        checkerContainer.classList.add("channel-checker");
        allCheckersContainer.appendChild(checkerContainer);
      });

      overlayContent.appendChild(allCheckersContainer);
      overlay.appendChild(overlayContent);
      let btnContainer = document.createElement("div");
      btnContainer.classList.add("btn-container");
      btnContainer.appendChild(submitBtn);
      btnContainer.appendChild(cancelBtn);
      overlayContent.appendChild(btnContainer);
      document.body.appendChild(overlay);

      submitBtn.addEventListener("click", (e) => {
        resolve();
      });
    });
  }

  function getChannelsToKeepSubscribed() {
    return new Promise((resolve) => {
      const checkedBoxes = document.querySelectorAll(
        "#overlay>div>.channel-checkers-container .channel-checker input:checked"
      );
      const channelsToKeep = [...checkedBoxes].map(
        (val) => val.previousSibling.innerText
      );
      resolve(channelsToKeep);
    });
  }

  function displayLoadingSpinnerUI() {
    return new Promise((resolve) => {
      let pg = document.createElement("p");
      pg.textContent = "Loading all channels";
      pg.style.cssText = `
      font-size: 2.5rem;
      color: white;
    `;
      const spinner = document.createElement("div");
      spinner.classList.add("spinner");
      overlay.appendChild(pg);
      overlay.appendChild(spinner);
      document.body.appendChild(overlay);
      resolve();
    });
  }

  function removeOverlay() {
    return new Promise((resolve, reject) => {
      overlay.remove();
      [...overlay.children].forEach((child) => {
        child.remove();
      });
      resolve();
    });
  }

  function unsubscribeToChannels(channelsToKeep) {
    return new Promise(async (resolve, reject) => {
      let subscribedChannels = document.querySelectorAll("#info-section");

      const repeatCheck = (query, querier) => {
        return new Promise((resolve) => {
          let handlerId = setInterval(() => {
            let queriedElement = querier.querySelector(query);
            if (queriedElement !== null) {
              queriedElement.click();
              clearInterval(handlerId);
              resolve();
            }
          }, 100);
        });
      };

      for (let channel of subscribedChannels) {
        if (
          !channelsToKeep.includes(
            channel.querySelector("#text-container #text").innerText
          )
        ) {
          channel.scrollIntoView({ block: "center" });

          let query =
            "#notification-preference-button > ytd-subscription-notification-toggle-button-renderer-next > yt-button-shape > button";

          await repeatCheck(query, channel);
          //
          query = "#items > ytd-menu-service-item-renderer:nth-child(4)";

          await repeatCheck(query, document);
          //

          query = "#confirm-button > yt-button-shape > button";

          await repeatCheck(query, document);
        }
      }
      await storeUnsubscribedChannels(subscribedChannels, channelsToKeep);
      resolve();
    });
  }

  function retrieveUnsubscribedChannelsInfo(allChannels, channelsToKeep) {
    let unsubedChannelsInfo = [];
    for (let channel of allChannels) {
      if (
        channelsToKeep.includes(
          channel.querySelector("#text-container #text").innerText
        )
      ) {
        continue;
      }

      let cName = channel.querySelector("#text-container #text").innerText;
      let cLink = channel.querySelector("#main-link").href;
      unsubedChannelsInfo.push({
        channelName: cName,
        channelLink: cLink,
      });
    }
    return unsubedChannelsInfo;
  }

  async function storeUnsubscribedChannels(allChannels, channelsToKeep) {
    return new Promise(async (resolve) => {
      let unsubedChannelsInfo = retrieveUnsubscribedChannelsInfo(
        allChannels,
        channelsToKeep
      );

      let getCurrentUnsubsProcessObj = async () => {
        let currentUnsubsProcessObj = {};
        let currUser = null;
        let avatarBtn = document.querySelector("#avatar-btn");
        avatarBtn.click();
        await new Promise((resolve) => {
          //show active account drawer
          let intervalId = setInterval(() => {
            currUser = document.querySelector("#channel-handle");
            if (currUser !== null) {
              clearInterval(intervalId);
              //close active account drawer
              avatarBtn.click();
              resolve(); //return from promise
            }
          }, 100);
        });
        currentUnsubsProcessObj.loggedInUser = currUser.innerText;
        currentUnsubsProcessObj.unsubscriptionProcessResult = {
          creationDate: getCurrentFormattedDate(),
          unsubscribedChannelsInfo: unsubedChannelsInfo,
        };
        return currentUnsubsProcessObj;
      };

      let allUnsubscribedChannelsDataArr = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getData" }, (response) => {
          resolve(JSON.parse(response.data));
        });
      });

      if (
        allUnsubscribedChannelsDataArr === null ||
        allUnsubscribedChannelsDataArr.length === 0
      ) {
        /*store for the first time.
      The fromat is like so : 
      (key): allUnsubscribedChannelsData => (value):
      [
        {
          "loggedInUser": "currentLoggedInUserName",
          "unsubscriptionProcessResult" : 
          {
            "creationDate": "2023-07-02 00:17:07",
            "unsubscribedChannelsInfo": 
            [
              {
              "channelName":"PewDiePie",
              "channelLink": "https://www.youtube.com/@PewDiePie"
              },
              ...more unsubed channels info objects
            ]
          }
        },
        ...more unsubscription process objects
      ]
      */
        let allDataArr = [];
        allDataArr.push(await getCurrentUnsubsProcessObj()); //inline anon function

        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: "setData", data: JSON.stringify(allDataArr) },
            (response) => {
              if (response.success) {
                resolve();
              } else {
                reject(response.err);
              }
            }
          );
        });
      } else {
        //allUnsubscribedChannelsDataArr is intitialized before if()
        allUnsubscribedChannelsDataArr.push(await getCurrentUnsubsProcessObj());
        chrome.runtime.sendMessage(
          {
            action: "setData",
            data: JSON.stringify(allUnsubscribedChannelsDataArr),
          },
          (response) => {
            if (response.success) {
              console.log("Data set successfully");
            } else {
              console.log("Failed to set data");
            }
          }
        );
      }
      resolve();
    });
  }

  function getCurrentFormattedDate() {
    const currentDate = new Date();
    // Extract the individual date and time components
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");
    // Create the formatted date string in the desired format
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
  }

  overlay.addEventListener("click", async (e) => {
    if (
      e.target.getAttribute("id") === "overlay" &&
      !e.target.children[1].classList.contains("spinner")
    ) {
      await removeOverlay();
    }
  });

  cancelBtn.addEventListener("click", async (e) => {
    await removeOverlay();
  });

  submitBtn.addEventListener("click", async () => {
    let channelsToKeep = await getChannelsToKeepSubscribed();
    await removeOverlay();
    await unsubscribeToChannels(channelsToKeep);
  });

  //starts the whole process
  async function startExecution() {
    displayLoadingSpinnerUI();
    let allChannelsInfo = await loadFullSubscriptionList();
    await removeOverlay();
    await displayChannelCheckingUI(allChannelsInfo);
  }
  startExecution();
} //script function end
