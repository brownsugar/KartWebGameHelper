(() => {
  const EVENT_KEY = 'kwgh-korea-2020-1022'
  const playCoinConsume = 2
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/10/26',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  const playErrorRegex = /Event201022Apply\(AppyBingoIdx\) {\s+LayerOpen\(\"(.+)\"\);/i
  const loadErrorRegex = /LayerOpen\(\"(.+)\"\);/i
  let remainCoinEl = kwgh.el.q('.ableCoin')
  let totalCoinEl = kwgh.el.q('.getCoin')
  let remainCoin = Number(remainCoinEl.innerText)
  let totalCoin = Number(totalCoinEl.innerText)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', totalCoin)

  const bingoSets = [
    [1, 6, 11, 16],
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [4, 7, 10, 13],
    [1, 5, 9, 13],
    [2, 6, 10, 14],
    [3, 7, 11, 15],
    [4, 8, 12, 16]
  ]
  function getLineStatesByNumber(num) {
    const numsEl = kwgh.el.qa('.game li')
    const numIdx = Array.from(numsEl).findIndex(el => Number(el.dataset['bingonum']) == num)
    const lines = {}
    bingoSets.forEach((set, i) => {
      if (set.includes(numIdx + 1)) { // +1 for human count
        const activeState = set.every(count => {
          const el = numsEl[count - 1]
          return el.classList.contains('active')
        })
        // bingo line index starts from 1
        lines[i + 1] = activeState
      }
    })
    return lines
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
    //   "returnCode": 0,
    //   "returnMsg": "",
    //   "CouponNo": "00000-00000-00000-00000-00000",
    //   "CouponTime": "2020-10-26 14:07",
    //   "ItemName": "아이템 체인저 (30개)",
    //   "ItemNo": 2271,
    //   "InGameCoin": 423,
    //   "WebUseCoin": 4,
    //   "EventCoin": 419,
    //   "BingoNum": 6
    // }
    playRequest().then(data => {
      const bingoNum = data.BingoNum

      // Load new bingo numbers
      if (bingoNum == 0) {
        $('#bingoContent').load('event_bingo.aspx', () => {
          remainCoinEl = kwgh.el.q('.ableCoin')
          totalCoinEl = kwgh.el.q('.getCoin')
        })
      }
      // Get bingo line rewards
      else if (bingoNum > 100) {
        const lineIdx = bingoNum - 100
        const line = kwgh.el.q('.b' + lineIdx)
        line.classList.remove('active')
        line.classList.add('complete')
        line.innerHTML = '<button type="button"></button>'
      }
      // Change page data
      else if (bingoNum > 0 && bingoNum < 100) {
        remainCoin = data.EventCoin
        remainCoinEl.innerText = remainCoin
        totalCoin = data.InGameCoin
        totalCoinEl.innerText = totalCoin

        const el = kwgh.el.q('.n' + bingoNum)
        el.classList.add('active')
        el.setAttribute('data-apply', 1)

        const activeLines = getLineStatesByNumber(bingoNum)
        Object.keys(activeLines).forEach(lineIdx => {
          if (activeLines[lineIdx]) {
            const line = kwgh.el.q('.b' + lineIdx)
            line.classList.add('active')
            const idx = '1' + (lineIdx < 10 ? '0' : '') + bingoNum
            line.innerHTML = '<button type="button" onclick="Event201022Apply(' + idx + ')"></button>'
          }
        })
      }

      if (!data.CouponNo)
        return

      const coupon = {
        id: data.ItemNo,
        name: data.ItemName,
        sn: data.CouponNo
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
      if (playErrorRegex.test(document.documentElement.innerHTML)) {
        const [, msg] = document.documentElement.innerHTML.match(playErrorRegex)
        return reject(msg)
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // idx = 0
      // {
      //   "returnCode": 0,
      //   "returnMsg": "",
      //   "CouponNo": "",
      //   "CouponTime": "2020-10-27 18:26",
      //   "ItemName": "",
      //   "ItemNo": 0,
      //   "InGameCoin": 0,
      //   "WebUseCoin": 0,
      //   "EventCoin": 0,
      //   "BingoNum": 0
      // }
      // AppyBingoIdx > 0 && bingonum < 100
      // {
      //   "returnCode": 0,
      //   "returnMsg": "",
      //   "CouponNo": "",
      //   "CouponTime": "2020-10-26 13:37",
      //   "ItemName": "",
      //   "ItemNo": 0,
      //   "InGameCoin": 423,
      //   "WebUseCoin": 2,
      //   "EventCoin": 421,
      //   "BingoNum": 12
      // }
      // OR
      // {
      //   "returnCode": 0,
      //   "returnMsg": "",
      //   "CouponNo": "00000-00000-00000-00000-00000",
      //   "CouponTime": "2020-10-26 14:07",
      //   "ItemName": "아이템 체인저 (30개)",
      //   "ItemNo": 2271,
      //   "InGameCoin": 423,
      //   "WebUseCoin": 4,
      //   "EventCoin": 419,
      //   "BingoNum": 6
      // }
      // AppyBingoIdx > 100
      // {
      //   "returnCode": 0,
      //   "returnMsg": "",
      //   "CouponNo": "13075-15619-66799-68942-25074",
      //   "CouponTime": "2020-10-28 00:00",
      //   "ItemName": "루찌 주머니 (3개)",
      //   "ItemNo": 2261,
      //   "InGameCoin": 0,
      //   "WebUseCoin": 0,
      //   "EventCoin": 0,
      //   "BingoNum": 110
      // }
      let idx = kwgh.el.qa('li[data-bingonum].active').length === 16 ? 0 : 1
      const bingoLines = kwgh.el.qa('.btns .active')
      if (bingoLines.length) {
        const el = bingoLines[0]
        const num = Number(el.classList[0].substring(1))
        if (num) {
          idx = '1' + (num < 10 ? '0' : '') + num
        }
      }
      kwgh.ajax.post('AjaxApply.aspx', {
        data: {
          AppyBingoIdx: idx,
          rd: Math.random()
        },
        success: result => {
          if (result != null) {
            if (result.returnCode == 0) {
              return resolve(result)
            } else if (result.returnCode <= 0 && !!result.returnMsg) {
              return reject(result.returnMsg)
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

      // <script type="text/javascript">
      //   LayerOpen("<strong>로그인 후</strong><br> 참여 하실 수 있습니다.");
      // </script>
      // OR
      //  <div class="item_list">
      //    <ul class="item_data_list historyList">
      //      <li class="get_gift">
      //        <i class="gift"><img alt="파츠 조각 (30개)" src="https://lwi.nexon.com/kart/2020/1022_bingo_CBB7304450B3201A/2273.png"></i>
      //        <ul class="gift_info">
      //          <li>파츠 조각 (30개)</li>
      //          <li>2020-10-26 14:31</li>
      //          <li>2020-11-18 23:59</li>
      //          <li>00000-00000-00000-00000-00000</li>
      //        </ul>
      //      </li>
      //    </ul>
      //    <div class="pager">
      //      <a href="javascript:void(0)" class="btn_first" onclick="return false;"><span class="spr_buttons">처음</span></a>
      //      <a href="javascript:void(0)" class="btn_prev" onclick="return false;"><span class="spr_buttons">이전</span></a>
      //      <span>
      //        <strong title="현재 페이지">1</strong><a href="javascript:void(0);" onclick="CouponListDate(2)">2</a>
      //      </span>
      //      <a href="javascript:void(0)" class="btn_next" onclick="return false;"><span class="spr_buttons">다음</span></a>
      //      <a href="javascript:void(0)" class="btn_last" onclick="CouponListDate(2)"><span class="spr_buttons">마지막</span></a>
      //    </div>
      //  </div>
      kwgh.ajax.post('MyCouponList.aspx', {
        data: {
          n4Page: page
        },
        dataType: 'html',
        success: result => {
          if (result != null) {
            if (loadErrorRegex.test(result)) {
              const [, msg] = result.match(loadErrorRegex)
              return reject(msg)
            }
            if (/class=\"item_data_list historyList\"/i.test(result)) {
              const itemRegex = /<img alt="([^"]+)" src="https:\/\/lwi.nexon.com\/kart\/2020\/1022_bingo_CBB7304450B3201A\/(\d+).png">/ig
              const couponRegex = /<li>(\d{5}-\d{5}-\d{5}-\d{5}-\d{5})<\/li>/ig
              let snData = []
              let match
              while ((match = itemRegex.exec(result)) !== null) {
                const coupon = couponRegex.exec(result)
                snData.push({
                  itemNo: match[2],
                  itemName: match[1],
                  coupon: coupon[1]
                })
              }
              const lastPageRegex = /onclick=\"CouponListDate\((\d+)\)\"><span class="spr_buttons">마지막/i
              const totalPage = lastPageRegex.test(result) ? result.match(lastPageRegex)[1] : 1
              return resolve({
                totalPage: Number(totalPage),
                couponList: snData
              })
            }
            return reject('No coupon found.')
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