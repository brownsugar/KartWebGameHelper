(() => {
  const EVENT_KEY = 'kwgh-korea-2021-season2'

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2021/07/05'
  })

  window.onload = () => {
    kwgh.leagueMode()
  }
})()