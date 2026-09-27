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

  // Post Table of Contents
  const toc = document.getElementById('post-toc');

  if (toc) {
    const headings = Array.from(
      document.querySelectorAll('.post-content h2, .post-content h3')
    );

    // 짧은 글에서는 TOC를 표시하지 않음
    if (headings.length < 2) {
      toc.remove();
    } else {
      const tocList = toc.querySelector('.post-toc-list');
      const tocLinks = [];

      headings.forEach(function (heading, index) {
        // heading에 id가 없을 경우 자동 생성
        if (!heading.id) {
          heading.id = 'section-' + (index + 1);
        }

        const item = document.createElement('li');
        item.className =
          heading.tagName === 'H3' ? 'toc-h3' : 'toc-h2';

        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent.trim();

        link.addEventListener('click', function (event) {
          event.preventDefault();

          heading.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          history.replaceState(
            null,
            '',
            '#' + encodeURIComponent(heading.id)
          );
        });

        item.appendChild(link);
        tocList.appendChild(item);

        tocLinks.push({
          heading: heading,
          link: link
        });
      });

      // 현재 읽고 있는 section 표시
      let ticking = false;

      function updateActiveSection() {
        let activeHeading = null;

        headings.forEach(function (heading) {
          if (heading.getBoundingClientRect().top <= 140) {
            activeHeading = heading;
          }
        });

        tocLinks.forEach(function (entry) {
          entry.link.classList.toggle(
            'active',
            entry.heading === activeHeading
          );
        });

        ticking = false;
      }

      window.addEventListener(
        'scroll',
        function () {
          if (!ticking) {
            window.requestAnimationFrame(updateActiveSection);
            ticking = true;
          }
        },
        { passive: true }
      );

      updateActiveSection();
    }
  }
});