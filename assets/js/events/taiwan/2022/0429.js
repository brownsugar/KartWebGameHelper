(() => {
  const EVENT_KEY = 'kwgh-taiwan-2022-0429'
  const CHECK_IN_GAME = 'Sent to gift box'
  const playCoinConsume = 2
  const requestInterval = 400
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2022/05/01',
    play,
    load
  })
  kwgh.addCoupons(kwgh.coupons)

  const token = kwgh.el.q('#hfData').value
  const remainCoinEl = kwgh.el.q('#SpanNowGem')
  const useCoinEl = kwgh.el.q('#SpanDeductGem')
  const totalCoinEl = kwgh.el.q('#SpanTotalGem')
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', Number(totalCoinEl.innerText))

  async function keepSession() {
    if (!isBusy) {
      await kwgh.ajax.post('../../api/Event/E20220429/GetItemLog', {
        type: 'json',
        data: {
          Data: token
        }
      })
    }
    setTimeout(keepSession, 30000)
  }
  if (token !== '') {
    keepSession()
  }

  let remainCoin = Number(remainCoinEl.innerText)
  let useCoin = Number(useCoinEl.innerText)
  let getCount
  function play() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'play', 'click')
    if (kwgh.config.autoRun !== false) {
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
      // Change page data
      // Server doesn't send correct data
      // remainCoin = data.NowGem
      remainCoin -= playCoinConsume
      remainCoinEl.innerText = remainCoin
      // const useCoin = data.DeductGem
      useCoin += playCoinConsume
      useCoinEl.innerHTML = useCoin

      const item = data.ItemList
      const coupon = {
        id: item.StockID,
        name: item.ItemName,
        sn: CHECK_IN_GAME
      }
      kwgh.setCoupon(coupon)
      getCount++

      if (kwgh.config.autoRun === false) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || kwgh.config.autoRun === false || kwgh.config.autoRun !== false && remainCoin < playCoinConsume) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-play', false)
        if (kwgh.config.autoRun === false || error) {
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
      if (!token) {
        return reject('Not logged in.')
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

    // {\"code\":\"0000\",\"message\":\"恭喜獲得玩具兵氣球 30個\",\"url\":null,\"NowGem\":130,\"DeductGem\":2,\"GetItemOut\":null,\"ItemList\":{\"ID\":7,\"StockID\":\"6730\",\"ItemName\":\"玩具兵氣球 30個\",\"BeginRange\":3141,\"EndRange\":4120,\"Probability\":0.098,\"IsSend\":1,\"Amount\":96861},\"Data\":\"xxx\"}
      kwgh.ajax.post('../../api/Event/E20220429/GetItem', {
        type: 'json',
        data: {
          Data: token
        },
        success: result => {
          try {
            const json = JSON.parse(result)
            if (json && json.code === '0000') {
              if (json.ItemList) {
                return resolve(json)
              }
              return reject(json.message)
            }
            return reject('Unknown error.')
          } catch (e) {
            return reject('Unknown error.')
          }
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }

  function load() {
    if (isBusy) {
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.btnLoading('#kwgh-btn-load')
    kwgh.ev(EVENT_KEY, 'load', 'click')

    doLoad()
  }
  function doLoad(page = 1) {
    loadRequest(page).then(({ totalPage = 1, totalItem, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.StockID,
          name: data.ItemName,
          sn: CHECK_IN_GAME
        }
        kwgh.setCoupon(coupon)
      })
      if (page < totalPage) {
        setTimeout(() => {
          doLoad(++page)
        }, requestInterval)
      }
      else {
        kwgh.message('success', `${totalItem} coupons have been loaded.`)
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-load', false)
        kwgh.ev(EVENT_KEY, 'load', 'totalItem', totalItem)
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
      if (!token) {
        return reject('Not logged in.')
      }

      // {\"code\":\"0000\",\"message\":null,\"url\":null,\"NowGem\":0,\"DeductGem\":0,\"GetItemOut\":{\"pageSize\":2,\"currPage\":1,\"totalPage\":1,\"Data\":[{\"CreateTime\":\"2022-05-01 13:16:18\",\"ItemID\":7,\"ItemName\":\"玩具兵氣球 30個\",\"StockID\":6730},{\"CreateTime\":\"2022-05-01 13:29:45\",\"ItemID\":10,\"ItemName\":\"尖峰 V1(10日)\",\"StockID\":24025}]},\"ItemList\":null,\"Data\":\"k/ysX3tSHwk5z5rCFWNQ76BwgBzhyubeHQp27ja6kW+vldSAN6yq17EmHBIf9Vqm+hnpDo8gY6Ta9UlXKWKs7n8CjtCiZMN4E0wi20nHp76MnOdD3re+nN6o7ycbrY/gMIj0LJXKcDULGr/g0U/28l1ApLDDaF2LN2LjgbebSnv/3RLWwg8fSoE46oTzGp/8OYx/aS8iHJGVrcwPaFxqkiZwxdE/LyPBqzpZYvLFmY1949I/id0HyaBezobeA0LiRnT+5oXo3nfsfBVXFUzURINVxySdzKk+iuYSZzN7UZ4=\"}
      kwgh.ajax.post('../../api/Event/E20220429/GetItemLog', {
        type: 'json',
        data: {
          Data: token
        },
        success: result => {
          try {
            const json = JSON.parse(result)
            if (json && json.code === '0000') {
              const totalItem = json.GetItemOut.Data.length
              if (totalItem) {
                resolve({
                  totalPage: 1,
                  totalItem,
                  couponList: json.GetItemOut.Data
                })
              }
              return reject('No coupon found.')
            }
            return reject('Unknown error.')
          } catch (e) {
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