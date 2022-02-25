(() => {
  const EVENT_KEY = 'kwgh-korea-krl-media'

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2022/02/25'
  })

  window.onload = () => {
    kwgh.leagueMode()
  }
})()