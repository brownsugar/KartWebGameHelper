(() => {
  const EVENT_KEY = 'kwgh-korea-2021-0204'
  const playCoinConsume = 1
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2021/02/11',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  const remainCoinEl = kwgh.el.q('.balance dd')
  const totalCoinEl = kwgh.el.q('.sum dd')
  const finishRoundEl = kwgh.el.q('.gem .success dd')
  const itemWeightEl = kwgh.el.q('.bazzi dd')
  const tireWeightEl = kwgh.el.q('.tire dd')
  let remainCoin = Number(remainCoinEl.innerText || 0)
  let totalCoin = Number(totalCoinEl.innerText || 0)
  let finishRound = Number(finishRoundEl.innerText || 0)
  let itemWeight = Number(itemWeightEl.innerText || 0)
  let tireWeight = Number(tireWeightEl.innerText || 0)

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
  // https://ssl.nx.com/s1/kart_v2/event/2021/event_0204_hankook_AB10B9DE226BAEEA.js
  const seesaw = window.seesaw
  const seesawEl = kwgh.el.q('.seesaw')
  const rideEl = kwgh.el.q('.ride')
  function doPlay() {
    let error = false

    // {
    //   "returnCode": 0,
    //   "returnMsg": "",
    //   "itemInfo": null,
    //   "EventPoint": "329",
    //   "TotalPoint": "330",
    //   "CompleteCount": "0",
    //   "n4CompleteCount": 0
    // }
    // OR
    // {
    //   "returnCode": 0,
    //   "returnMsg": "",
    //   "itemInfo": {
    //     "ItemNo": 3,
    //     "ItemName": "한국타이어 풍선 (30개)",
    //     "ItemCoupon": "00000-00000-00000-00000-00000",
    //     "NextItemNo": 13,
    //     "NextItemKg": 100
    //   },
    //   "EventPoint": "0",
    //   "TotalPoint": "0",
    //   "CompleteCount": "1",
    //   "n4CompleteCount": 1
    // }
    playRequest().then(data => {
      const itemInfo = data.itemInfo

      if (!itemInfo) {
        // Jewels only consume when no item get (accumulating tires)
        remainCoin = data.EventPoint
        remainCoinEl.innerText = remainCoin
        totalCoin = data.TotalPoint
        totalCoinEl.innerText = totalCoin

        // Add tires
        seesaw.tireLength++
        seesaw.tireWeight = seesaw.tireWeight + seesaw.PER_WEIGHT
        tireWeight = seesaw.tireWeight
        tireWeightEl.innerText = tireWeight
        seesaw.$build.append('<span/>')
        // Rotate the seesaw
        const degree = seesaw.calculate()
        rideEl.setAttribute('style', 'transform: rotate(' + degree + 'deg)')
        // Equal
        if (seesaw.itemWeight === seesaw.tireWeight) {
          seesawEl.classList.add('balanced')
        }

        if(kwgh.config.autoRun === false) {
          kwgh.toast('secondary', 'Added an tire.')
        }
        return
      }

      // Add finished rounds
      finishRound = data.CompleteCount
      finishRoundEl.innerText = finishRound
      finishRoundEl.dataset.completecount = finishRound

      // Reset
      seesawEl.classList.remove('balanced')
      seesaw.itemWeight = 0
      seesaw.tireLength = 0
      seesaw.tireWeight = 0
      tireWeightEl.innerText = 0
      seesaw.$build.empty()

      // Set next item
      const itemEl = kwgh.el.q('#Event210204ItemNo')
      itemEl.className = 'item item' + itemInfo.NextItemNo

      // Set item weight
      itemWeight = itemInfo.NextItemKg
      seesaw.itemWeight = itemWeight
      itemWeightEl.innerText = itemWeight

      // Init seesaw rotate
      const degree = seesaw.calculate()
      rideEl.setAttribute('style', 'transform: rotate(' + degree + 'deg)')

      const coupon = {
        id: itemInfo.ItemNo,
        name: itemInfo.ItemName,
        sn: itemInfo.ItemCoupon
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
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "returnCode": 0,
      //   "returnMsg": "",
      //   "itemInfo": null,
      //   "EventPoint": "329",
      //   "TotalPoint": "330",
      //   "CompleteCount": "0",
      //   "n4CompleteCount": 0
      // }
      const eventtype = seesaw.tireWeight > 0 && seesaw.itemWeight === seesaw.tireWeight ? 'applyCoupon' : 'apply' // apply, applyCoupon
      kwgh.ajax.post('AjaxEvent.aspx', {
        data: {
          eventtype,
          CompleteCount: finishRound,
          rd: Math.random()
        },
        success: result => {
          if (result != null) {
            if (result.returnCode == 0) {
              return resolve(result)
            } else if (result.returnMsg) {
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
      //   Event210204.LayerAlert("로그인 후<br> 당첨내역을 조회 하실 수 있습니다.");
      // </script>
      // OR
      // <div class="item_list">
      //   <ul class="item_data_list history_list">
      //     <li class="item_info">
      //       <span class="item item13"></span>
      //       <dl>
      //         <dt>아이템</dt>
      //         <dd>파츠 조각  (100개)</dd>
      //       </dl>
      //       <dl>
      //         <dt>지급일시</dt>
      //         <dd>2021-02-11 04:03</dd>
      //       </dl>
      //       <dl>
      //         <dt>유효기간</dt>
      //         <dd>2021-03-03 23:59</dd>
      //       </dl>
      //       <dl>
      //         <dt>쿠폰번호</dt>
      //         <dd><span class="number">00000-00000-00000-00000-00000</span></dd>
      //       </dl>
      //     </li>
      //   </ul>
      //   <div class="pager">
      //     <a href="javascript:void(0)" class="btn btn_first" onclick="return false;"><span class="blind">처음</span></a>
      //     <a href="javascript:void(0)" class="btn btn_prev" onclick="return false;"><span class="blind">이전</span></a>
      //     <span>
      //       <strong title="현재 페이지">1</strong>
      //       <a href="javascript:void(0);" onclick="Event210204.LayerCouponList(2)">2</a>
      //     </span>
      //     <a href="javascript:void(0)" class="btn btn_next" onclick="return false;"><span class="blind">다음</span></a>
      //     <a href="javascript:void(0)" class="btn btn_last" onclick="Event210204.LayerCouponList(6)"><span class="blind">마지막</span></a>
      //   </div>
      // </div>
      kwgh.ajax.post('MyCouponList.aspx', {
        data: {
          n4Page: page
        },
        dataType: 'html',
        success: result => {
          if (result != null) {
            const loadErrorRegex = /LayerAlert\(\"(.+)\"\);/i
            if (loadErrorRegex.test(result)) {
              const [, msg] = result.match(loadErrorRegex)
              return reject(msg)
            }
            if (/class=\"item_data_list history_list\"/i.test(result)) {
              const itemNoRegex = /<span class="item item(\d+)"><\/span>/ig
              const itemNameRegex = /<dt>아이템<\/dt>\s+<dd>([^>]+)<\/dd>/ig
              const couponRegex = /<span class="number">(\d{5}-\d{5}-\d{5}-\d{5}-\d{5})<\/span>/ig
              let snData = []
              let match
              while ((match = itemNoRegex.exec(result)) !== null) {
                const name = itemNameRegex.exec(result)
                const coupon = couponRegex.exec(result)
                snData.push({
                  itemNo: match[1],
                  itemName: name[1],
                  coupon: coupon[1]
                })
              }
              const lastPageRegex = /onclick=\"Event210204.LayerCouponList\((\d+)\)\"><span class="blind">마지막/i
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