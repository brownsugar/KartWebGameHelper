(() => {
  const EVENT_KEY = 'kwgh-korea-2020-season2'

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/08/19'
  })

  window.onload = () => {
    kwgh.leagueMode()
  }
})()