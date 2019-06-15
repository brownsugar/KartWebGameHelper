(() => {
  const kwghTemplate = `
  <div id="kwgh" class="kwgh-wrap kwgh-error">
    <input type="checkbox" id="kwgh-alert" class="alert-state" />
    <div class="alert alert-danger dismissible">
      <div class="content">
        <h4>KartWebGameHelper</h4>
        <p>This event is not supported yet. <a href="${KWGH_URL}" target="_blank">Request to update?</a></p>
      </div>
      <label class="btn-close" for="kwgh-alert">X</label>
    </div>
  </div>
  `
  kwgh.el.append('body', kwghTemplate)
})()