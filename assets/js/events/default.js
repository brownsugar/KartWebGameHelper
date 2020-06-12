(() => {
  const path = location.host + location.pathname
  const kwghTemplate = `
    <div id="kwgh" class="kwgh-wrap kwgh-error">
      <input type="checkbox" id="kwgh-alert" class="alert-state" />
      <div class="alert alert-danger dismissible">
        <div class="content">
          <h4>KartWebGameHelper</h4>
          <p>This event is not supported yet. <a href="https://kinf.cc/2sS1uoD" target="_blank">Request an update?</a></p>
        </div>
        <label class="btn-close" for="kwgh-alert" onclick="kwgh.setDismiss('${path}')">X</label>
      </div>
    </div>
    `
  if (!kwgh.isDismiss(path)) {
    kwgh.el.append('body', kwghTemplate)
  }
})()