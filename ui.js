function showSettings() {
  settings_div.style.display = '';
}

function closeSettings() {
  settings_div.style.display = 'none';
}

function setRenderProgress(y) {
  if (y == null) {
    render_progress.textContent = '';
  } else {
    render_progress.textContent = `${y}/${manager.getHeight()}`;
  }
}
