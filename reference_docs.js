// File: reference-docs.js
// Xử lý tab Tài liệu tham khảo

const REFERENCE_DOCUMENTS = [
    {
        id: 'doc1',
        title: 'Nghị định 163/2025/NĐ-CP',
        url: 'https://drive.google.com/file/d/1k-iySsr9QIsl64bGy4aqOUTZ2yOy7i4O/preview'
    },
    {
        id: 'doc2',
        title: 'Thông tư 28/2025/TT-BYT - Quy định GMP',
        url: 'https://drive.google.com/file/d/1yOMd9eQ8jFw-fZ1VDs7T4PufL4q0jN9h/preview'
    },
    {
        id: 'doc3',
        title: 'SOP GMP NN',
        url: 'https://drive.google.com/file/d/1e1qS1ULiAG1kJo41E_D6gX_7P1gBZKKq/preview'
    }
    // Thêm tối đa 10 tài liệu tại đây
    // Nhớ thay YOUR_FILE_ID bằng ID thực từ Google Drive
];

document.addEventListener('DOMContentLoaded', () => {
    const refDocDropdown = document.getElementById('ref-doc-dropdown');
    const refPdfFrame = document.getElementById('ref-pdf-frame');
    const refPdfWrapper = document.getElementById('ref-pdf-viewer-wrapper');
    const refResizeGrip = document.getElementById('ref-resize-grip');

    // Kiểm tra các element có tồn tại không
    if (!refDocDropdown || !refPdfFrame || !refPdfWrapper || !refResizeGrip) {
        console.error('Reference docs elements not found');
        return;
    }

    // Khởi tạo dropdown với danh sách tài liệu
    REFERENCE_DOCUMENTS.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.url;
        option.textContent = doc.title;
        refDocDropdown.appendChild(option);
    });

    // Load tài liệu đầu tiên mặc định
    if (REFERENCE_DOCUMENTS.length > 0) {
        refDocDropdown.value = REFERENCE_DOCUMENTS[0].url;
        refPdfFrame.src = REFERENCE_DOCUMENTS[0].url + '#toolbar=1';
    }

    // Xử lý khi chọn tài liệu từ dropdown
    refDocDropdown.addEventListener('change', (e) => {
        if (e.target.value) {
            refPdfFrame.src = e.target.value + '#toolbar=1';
        }
    });

    // ===================================================================
    // RESIZE GRIP - Kéo để thay đổi chiều cao PDF viewer
    // ===================================================================
    let isRefResizing = false;
    let refStartY, refStartHeight;

    refResizeGrip.addEventListener('mousedown', (e) => {
        isRefResizing = true;
        refStartY = e.clientY;
        refStartHeight = refPdfWrapper.offsetHeight;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isRefResizing) return;
        const delta = e.clientY - refStartY;
        const newHeight = Math.max(300, Math.min(900, refStartHeight + delta));
        refPdfWrapper.style.height = newHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
        isRefResizing = false;
    });
});
