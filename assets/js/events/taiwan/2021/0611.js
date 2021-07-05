(() => {
  const EVENT_KEY = 'kwgh-taiwan-2021-0611'
  const playCoinConsume = 2
  const requestInterval = 500
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2021/07/05',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  const isLogin = kwgh.el.q('#ALogin').classList.contains('hide')
  const remainCoinEl = kwgh.el.q('#SpanNowGem')
  const useCoinEl = kwgh.el.q('#SpanDeductGem')
  const totalCoinEl = kwgh.el.q('#SpanTotalGem')
  let remainCoin = Number(remainCoinEl.innerText)
  let useCoin = Number(useCoinEl.innerText)
  let totalCoin = Number(totalCoinEl.innerText)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', totalCoin)

  async function keepSession() {
    if (!isBusy) {
      await kwgh.ajax.post('index.aspx/GetItemLog', {
        type: 'json'
      })
    }
    setTimeout(keepSession, 30000)
  }
  if (isLogin) {
    keepSession()
  }

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

    // {
    //   "ID": 21,
    //   "StockID": "21955",
    //   "ItemName": "2021裝飾道具齒輪  1個",
    //   "BeginRange": 571,
    //   "EndRange": 600,
    //   "Probability": 30,
    //   "IsSend": 1,
    //   "Amount": 796287
    // }
    playRequest().then(data => {
      // Change page data
      remainCoin = remainCoin - playCoinConsume
      remainCoinEl.innerText = remainCoin
      useCoin = useCoin + playCoinConsume
      useCoinEl.innerText = useCoin

      const coupon = {
        id: data.ID,
        name: data.ItemName,
        sn: '-'
      }
      kwgh.setCoupon(coupon)
      getCount++

      if(kwgh.config.autoRun === false) {
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
      if (!isLogin) {
        return reject('Not logged in.')
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "d": "{ ... }"
      // }
      kwgh.ajax.post('index.aspx/GetItem', {
        type: 'json',
        success: result => {
          if (result != null) {
            try {
              // {
              //   "code": "0000",
              //   "message": "恭喜獲得2021裝飾道具齒輪  1個",
              //   "url": null,
              //   "NowGem": 130,
              //   "DeductGem": 2,
              //   "GetItemOut": null,
              //   "ItemList": { ... }
              // }
              const d = JSON.parse(result.d)

              if (d.code == '0000') {
                return resolve(d.ItemList)
              }
              return reject(d.message || 'Unknown error.')
            }
            catch (e) {
              return reject(e)
            }
          }
          return reject('Unknown error.')
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
    doLoad()
  }
  function doLoad(page = 1) {
    loadRequest(page).then(({ totalPage = 1, couponList = [] }) => {
      // [
      //   {
      //     "CreateTime": "2021-07-05 18:01:19",
      //     "ItemID": 21,
      //     "StockID": "21955",
      //     "ItemName": "2021裝飾道具齒輪  1個"
      //   },
      //   {
      //     "CreateTime": "2021-07-05 18:59:00",
      //     "ItemID": 17,
      //     "StockID": "21273",
      //     "ItemName": "偶像痞子妹 (30日)"
      //   },
      //   ...
      // ]
      couponList.forEach(data => {
        const coupon = {
          id: data.ItemID,
          name: data.ItemName,
          sn: '-'
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
  function loadRequest(_page) {
    return new Promise((resolve, reject) => {
      if (!isLogin) {
        return reject('Not logged in.')
      }

      // {
      //   "d": "{ ... }"
      // }
      kwgh.ajax.post('index.aspx/GetItemLog', {
        type: 'json',
        success: result => {
          if (result != null) {
            try {
              // {
              //   "code": "0000",
              //   "message": null,
              //   "url": null,
              //   "NowGem": 0,
              //   "DeductGem": 0,
              //   "GetItemOut": {
              //     "pageSize": 2,
              //     "currPage": 1,
              //     "totalPage": 8,
              //     "Data": [ ... ]
              //   },
              //   "ItemList": null
              // }
              const d = JSON.parse(result.d)

              if (d.code == '0000') {
                const data = d.GetItemOut.Data
                if (data.length) {
                  return resolve({
                    totalPage: 1,
                    couponList: data
                  })
                }
                return reject('No coupon found.')
              }
              return reject(d.message || 'Unknown error.')
            }
            catch (e) {
              return reject(e)
            }
          }
          return reject('Unknown error.')
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }
})()