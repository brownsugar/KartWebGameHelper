chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'update') {
    createNotification({
      id: 'updated',
      title: 'The latest version is arrived!',
      message: `KartWebGameHelper has updated to v${chrome.runtime.getManifest().version}!`,
      btnTitle: 'What\'s new?',
      btnIcon: chrome.runtime.getURL('assets/img/star-solid.svg')
    })
  }
})
function createNotification({ id, title, message, btnTitle, btnIcon }) {
  chrome.notifications.create(id, {
    type: 'basic',
    title: title,
    iconUrl: chrome.runtime.getURL('assets/img/icon.png'),
    message: message,
    buttons: [{
      title: btnTitle,
      iconUrl: btnIcon
    }]
  })
}
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'updated') {
    chrome.tabs.create({ url: `${chrome.runtime.getManifest().homepage_url}?utm_source=KartWebGameHelper&utm_medium=updated&utm_campaign=notification` })
  }
})