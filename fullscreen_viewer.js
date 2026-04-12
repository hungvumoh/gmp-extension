// File: fullscreen_viewer.js
// Xử lý sự kiện Escape để đóng cửa sổ xem nhanh

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pdfUrl = urlParams.get('url');
    const viewer = document.getElementById('viewer');

    if (pdfUrl) {
        // Đảm bảo URL có #view=FitH (vừa khít bề ngang) để dễ đọc
        const formattedUrl = pdfUrl.includes('#') ? pdfUrl : pdfUrl + '#view=FitH';
        viewer.src = formattedUrl;
    }

    // Lắng nghe phím ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.close();
        }
    });

    // Cần click vào window hoặc header để nó có focus
    // Nếu click vào iframe PDF, nó sẽ chiếm focus và ESC có thể không ăn.
    // Vì vậy ta thêm một tip nhỏ ở header.
});
