document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.pdf-widget').forEach(function (widget) {
    const btnRed = widget.querySelector('.pdf-btn-red');
    const btnYellow = widget.querySelector('.pdf-btn-yellow');
    const btnGreen = widget.querySelector('.pdf-btn-green');

    if (btnYellow) {
      btnYellow.addEventListener('click', function () {
        widget.classList.remove('collapsed-red');
        widget.classList.add('collapsed-yellow');
      });
    }

    if (btnRed) {
      btnRed.addEventListener('click', function () {
        widget.classList.remove('collapsed-yellow');
        widget.classList.add('collapsed-red');
      });
    }

    if (btnGreen) {
      btnGreen.addEventListener('click', function () {
        widget.classList.remove('collapsed-yellow');
        widget.classList.remove('collapsed-red');
      });
    }
  });
});