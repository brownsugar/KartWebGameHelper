(() => {
  const EVENT_KEY = 'kwgh-china-2020-0827'
  const playCoinConsume = 2
  const requestInterval = 500
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/08/30',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', Number(kwgh.el.q('.num3').innerText))

  const isLogin = kwgh.el.q('.btn_login').attributes.onclick.value === 'TcLogout()'
  const remainCoinEl = kwgh.el.q('.num2')
  const consumedCountEl = kwgh.el.q('.num1')
  let remainCoin = Number(remainCoinEl.innerText)
  let consumedCount = Number(consumedCountEl.innerText)

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
      remainCoin = remainCoin - playCoinConsume
      remainCoinEl.innerText = remainCoin
      consumedCount = consumedCount + playCoinConsume
      consumedCountEl.innerText = consumedCount

      if (!data.code)
        return

      const coupon = {
        id: data.item,
        name: data.name,
        sn: data.code
      }
      kwgh.setCoupon(coupon)
      getCount++

      if(!kwgh.config.autoRun) {
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
      if (!isLogin) {
        return reject('Not logged in.')
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "irv": 200,
      //   "msg": "成功返回",
      //   "code": "0000000000000000000000000",
      //   "name": "道具变更卡(50个)",
      //   "item": "item22",
      //   "chance": 2,
      //   "chance1": 16,
      //   "time": "2020-08-30 01:46:33",
      //   "key": [
      //     "item8",
      //     "item11",
      //     "item13",
      //     "item14",
      //     "item16",
      //     "item19",
      //     "item20"
      //   ]
      // }
      kwgh.ajax.post('index.php/prize', {
        success: result => {
          if (result.irv == 200) {
            return resolve(result)
          }
          else if (result.irv == 101) {
            return reject('Not logged in.')
          }
          return reject(result.msg || 'Unknown error.')
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
  function doLoad() {
    loadRequest().then(({ couponList = [] }) => {
      couponList.forEach(coupon => {
        kwgh.setCoupon(coupon)
        loadCount++
      })
      kwgh.message('success', `${loadCount} coupons have been loaded.`)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
      kwgh.ev(EVENT_KEY, 'load', 'totalItem', loadCount)
    }).catch(message => {
      kwgh.message('error', message)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
    })
  }
  function loadRequest() {
    return new Promise((resolve, reject) => {
      if (!isLogin) {
        return reject('Not logged in.')
      }

      const items = kwgh.el.qa('.item_list li')
      if (items.length) {
        const data = Array.from(items).map(item => {
          const id = kwgh.el.q('dd.tmb span', item).className
          const name = kwgh.el.q('dd.name', item).innerText
          const sn = kwgh.el.q('dd.key', item).innerText

          return {
            id,
            name,
            sn
          }
        })
        return resolve({
          couponList: data
        })
      }
      return reject('No data.')
    })
  }
})()