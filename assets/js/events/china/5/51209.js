(() => {
  const EVENT_KEY = 'kwgh-china-2019-0829'
  const playCoinConsume = 1
  const requestInterval = 600
  let isBusy = false

  const serverSelector = kwgh.el.q('#selectserver')
  let server = 0
  let remainCoinEl
  let usedCoinEl
  let remainBonusEl
  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2019/09/06',
    play: play,
    bonus: bonus,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  function changeServer(e) {
    server = parseInt(e.target.value)

    const parent = server == 1 ? 'ct01' : 'cnc01'
    remainCoinEl = kwgh.el.q(`.${parent} .num1`)
    usedCoinEl = kwgh.el.q(`.${parent} .num2`)
    remainBonusEl = kwgh.el.q(`.${parent} .num3`)

    const totalJewel = parseInt(remainCoinEl.innerText) + parseInt(usedCoinEl.innerText)
    kwgh.ev(EVENT_KEY, 'jewelry', 'count-server-' + server, totalJewel)
  }
  async function keepSession() {
    if (!isBusy) {
      await kwgh.ajax.post('index.php/refresh')
    }
    setTimeout(keepSession, 30000)
  }
  if (type == 1) {
    serverSelector.addEventListener('change', changeServer)
    keepSession()
  }

  let remainCoin = 0
  let getCount
  function play() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'play', 'click')
    if (kwgh.config.autoRun) {
      kwgh.btnLoading('#kwgh-btn-play', 'STOP', false)
      kwgh.ev(EVENT_KEY, 'play', 'autoRun', 1)
    }
    else {
      kwgh.btnLoading('#kwgh-btn-play', 'Working...')
      kwgh.ev(EVENT_KEY, 'play', 'autoRun', 0)
    }

    getCount = 0
    doPlay()
  }
  function doPlay() {
    let error = false

    playRequest().then(data => {
      const flagPos = data.local
      if (server == 1) {
        ct01_startNum = flagPos
      }
      else {
        cnc01_startNum = flagPos
      }

      // Set flag position
      kwgh.el.q('.flag').className = 'flag flag-set' + flagPos

      if (flagPos == 14 || flagPos == 19) {
        if (!kwgh.config.autoRun) {
          kwgh.toast('secondary', 'Play again!')
        }
        return
      }

      // Change page data
      remainCoin = data.chance
      remainCoinEl.innerText = remainCoin
      usedCoinEl.innerText = data.use_chance
      remainBonus = data.chance1
      remainBonusEl.innerText = remainBonus

      if ([0, 6, 17].includes(flagPos)) {
        if (!kwgh.config.autoRun) {
          kwgh.toast('secondary', 'Got nothing.')
        }
        return
      }

      if (flagPos == 11) { // Bonus
        if (!kwgh.config.autoRun) {
          kwgh.toast('secondary', 'Got bonus 5 jewels.')
        }
        return
      }

      const item = getItem(data.data.item)
      const coupon = {
        id: data.data.item.replace('item_', ''),
        name: item.name,
        sn: data.data.code
      }
      kwgh.setCoupon(coupon)
      getCount++

      if (!kwgh.config.autoRun) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || !kwgh.config.autoRun || kwgh.config.autoRun && remainCoin < playCoinConsume) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-play', false)
        if (!kwgh.config.autoRun || error) {
          return
        }
        kwgh.message('success', `Working end. Got ${getCount} items.`)
        kwgh.ev(EVENT_KEY, 'play', 'getCount', getCount)
      }
      else {
        setTimeout(() => {
          doPlay()
        }, requestInterval)
      }
    })
  }
  function playRequest() {
    return new Promise((resolve, reject) => {
      if (type == 0) {
        return reject('Not loggined.')
      }
      if (server == 0) {
        return reject('Sever not selected.')
      }
      remainCoin = remainCoinEl.innerText
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // GOT ITEM
      // {
      //   "irv": 200,
      //   "msg": "成功返回",
      //   "data": {
      //     "code": "",
      //     "item": "item_1947"
      //   },
      //   "chance": 9,
      //   "use_chance": 1,
      //   "chance1": 0,
      //   "rand": 5,
      //   "time": "2019/09/04",
      //   "local": 5
      // }
      // GOT NOTHING
      // {
      //   "irv": 200,
      //   "msg": "成功返回",
      //   "chance": 10,
      //   "use_chance": 2,
      //   "chance1": 0,
      //   "rand": 1,
      //   "time": "2019/09/05",
      //   "local": 6
      // }
      // BONUS
      // {
      //   "irv": 200,
      //   "msg": "成功返回",
      //   "chance": 14,
      //   "use_chance": 3,
      //   "chance1": 0,
      //   "rand": 5,
      //   "time": "2019/09/05",
      //   "local": 11
      // }
      kwgh.ajax.post('index.php/game', {
        data: {
          server: server
        },
        success: result => {
          if (result != null) {
            if (result.irv == 200) {
              return resolve(result)
            }
            else if (result.irv == 101) {
              return reject('Not loggined.')
            }
            return reject(result.msg)
          }
          return reject('Unknown error.')
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }

  let remainBonus = 0
  function bonus() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'bonus', 'click')
    if (kwgh.config.autoRun) {
      kwgh.btnLoading('#kwgh-btn-bonus', 'STOP', false)
      kwgh.ev(EVENT_KEY, 'bonus', 'autoRun', 1)
    }
    else {
      kwgh.btnLoading('#kwgh-btn-bonus', 'Working...')
      kwgh.ev(EVENT_KEY, 'bonus', 'autoRun', 0)
    }

    getCount = 0
    doBonus()
  }
  function doBonus() {
    let error = false

    bonusRequest().then(data => {
      // Change page data
      remainBonus = data.chance
      remainBonusEl.innerText = remainBonus

      const item = getItem(data.data.item)
      const coupon = {
        id: data.data.item.replace('item_', ''),
        name: item.name,
        sn: data.data.code
      }
      kwgh.setCoupon(coupon)
      getCount++

      if (!kwgh.config.autoRun) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || !kwgh.config.autoRun || kwgh.config.autoRun && remainBonus < 1) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-bonus', false)
        if (!kwgh.config.autoRun || error) {
          return
        }
        kwgh.message('success', `Working end. Got ${getCount} items.`)
        kwgh.ev(EVENT_KEY, 'bonus', 'getCount', getCount)
      }
      else {
        setTimeout(() => {
          doBonus()
        }, requestInterval)
      }
    })
  }
  function bonusRequest() {
    return new Promise((resolve, reject) => {
      if (type == 0) {
        return reject('Not loggined.')
      }
      if (server == 0) {
        return reject('Sever not selected.')
      }
      remainBonus = remainBonusEl.innerText
      if (remainBonus < 1) {
        return reject('Bonus not enough.')
      }

      kwgh.ajax.post('index.php/prize', {
        data: {
          server: server
        },
        success: result => {
          if (result != null) {
            if (result.irv == 200) {
              return resolve(result)
            }
            else if (result.irv == 101) {
              return reject('Not loggined.')
            }
            return reject(result.msg)
          }
          return reject('Unknown error.')
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }

  let loadCount
  function load() {
    if (isBusy) {
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.btnLoading('#kwgh-btn-load')
    kwgh.ev(EVENT_KEY, 'load', 'click')

    loadCount = 0
    doLoad(1)
  }
  function doLoad(page) {
    loadRequest(page).then(({ totalPage = 1, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.itemNo,
          name: data.itemName,
          sn: data.coupon
        }
        kwgh.setCoupon(coupon)
        loadCount++
      })
      if (page < totalPage) {
        setTimeout(() => {
          doLoad(++page)
        }, requestInterval)
      }
      else {
        kwgh.message('success', `${loadCount} coupons have been loaded.`)
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-load', false)
        kwgh.ev(EVENT_KEY, 'load', 'totalItem', loadCount)
      }
    }).catch(message => {
      kwgh.message('error', message)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
    })
  }
  function loadRequest(page) {
    return new Promise((resolve, reject) => {
      // WTF
      // {
      //   "html": "COUPON_HTML",
      //   "url": "PAGE_HTML"
      // }
      kwgh.ajax.post('index.php/getcoupon', {
        data: {
          page: page
        },
        success: result => {
          if (result != null) {
            if (result.html) {
              const snDataRegex = /<div class=\"item i(\d+)\">([^>]+)<\/div>[^兑]+兑换码：<\/dt><dd class=\"cp\">([^>]+)<\/dd>/ig
              let snData = []
              let match
              while ((match = snDataRegex.exec(result.html)) !== null) {
                snData.push({
                  itemNo: match[1],
                  itemName: match[2],
                  coupon: match[3]
                })
              }
              const pageDataRegex = /class=\"btn last\" onclick=\"getpage\((\d+)\)\"/i
              const totalPage = pageDataRegex.test(result.url) ? result.url.match(pageDataRegex)[1] : 1
              resolve({
                totalPage: parseInt(totalPage),
                couponList: snData
              })
            }
            else {
              return reject('No coupon found.')
            }
          }
          else {
            return reject('Unknown error.')
          }
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }
})()