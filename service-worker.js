// File: service-worker.js (Đã sửa race condition)

chrome.action.onClicked.addListener(async (tab) => {
    // Mở sidepanel
    await chrome.sidePanel.open({ windowId: tab.windowId });

    // ✅ ĐỢI SIDEPANEL GỬI TÍN HIỆU "SẴN SÀNG"
    const readyListener = (message, sender, sendResponse) => {
        if (message.type === 'SIDEPANEL_READY') {
            chrome.runtime.onMessage.removeListener(readyListener);
            
            // Delay thêm 300ms để đảm bảo listener đã được đăng ký hoàn toàn
            setTimeout(() => {
                // Gửi message RESET
                chrome.runtime.sendMessage({ type: 'RESET' });
                
                // Bắt đầu quét PDF
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: getPdfLinksAndNames,
                });
            }, 300);
        }
    };
    
    chrome.runtime.onMessage.addListener(readyListener);
});

function getPdfLinksAndNames() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'PROCESS_START' });

        const filesToProcess = [];
        const possibleSelectors = [
            'span[ng-click^="vm.openViewFile("]',
            'button[ng-click^="vm.openViewFile("]',
            'span[ng-click*="openViewFile"]',
            'button[ng-click*="openViewFile"]'
        ];
        let foundButtons = [];
        for (const selector of possibleSelectors) {
            foundButtons = document.querySelectorAll(selector);
            if (foundButtons.length > 0) break;
        }

        if (foundButtons.length === 0) {
            chrome.runtime.sendMessage({ type: 'PROCESS_COMPLETE' });
            resolve([]);
            return;
        }

        foundButtons.forEach((btn) => {
            const row = btn.closest('tr');
            let cleanName = null;

            if (row) {
                // Ưu tiên lấy tên từ <em>
                const emTag = row.querySelector('em');
                if (emTag) {
                    cleanName = emTag.innerText.trim().replace(/\s+/g, " ");
                } else {
                    // Nếu không có <em>, thử lấy từ <h5><i>
                    const iTag = row.querySelector('h5 i');
                    if (iTag) {
                        cleanName = iTag.innerText.trim().replace(/\s+/g, " ");
                    } else {
                        // Fallback cuối cùng: lấy từ text của chính nút
                        cleanName = btn.innerText.trim().replace(/\s+/g, " ") || "[NO_NAME]";
                    }
                }
            }

            if (cleanName) {
                filesToProcess.push({ button: btn, name: cleanName });
            }
        });

        if (filesToProcess.length === 0) {
            chrome.runtime.sendMessage({ type: 'PROCESS_COMPLETE' });
            resolve([]);
            return;
        }

        chrome.runtime.sendMessage({ type: 'PROCESS_TOTAL', total: filesToProcess.length });

        const foundFiles = [];
        let currentIndex = 0;

        function processNext() {
            if (currentIndex >= filesToProcess.length) {
                chrome.runtime.sendMessage({ type: 'PROCESS_COMPLETE' });
                resolve(foundFiles);
                return;
            }

            const item = filesToProcess[currentIndex];
            try {
                item.button.click();
                let checkAttempts = 0;
                const maxAttempts = 10;

                function checkForPDF() {
                    checkAttempts++;
                    let foundLink = null;
                    const embedElement = document.querySelector('embed[original-url]');
                    if (embedElement && embedElement.getAttribute('original-url')) {
                        foundLink = embedElement.getAttribute('original-url');
                    }
                    if (!foundLink) {
                        const iframeElement = document.querySelector('iframe');
                        if (iframeElement && iframeElement.src &&
                            (iframeElement.src.toLowerCase().includes('.pdf') || iframeElement.src.includes('.PDF'))) {
                            foundLink = iframeElement.src;
                        }
                    }

                    if (foundLink) {
                        let finalUrl = foundLink;
                        if (!finalUrl.startsWith('http')) {
                            const baseUrl = 'https://dichvucong.dav.gov.vn/File/GoToViewTaiLieu?url=';
                            finalUrl = baseUrl + finalUrl;
                        }

                        if (!foundFiles.some(f => f.url === finalUrl)) {
                            const newFile = { url: finalUrl, name: item.name };
                            foundFiles.push(newFile);
                            chrome.runtime.sendMessage({ type: 'FILE_FOUND', file: newFile });
                        }
                        currentIndex++;
                        setTimeout(processNext, 300);
                    } else if (checkAttempts < maxAttempts) {
                        setTimeout(checkForPDF, 200);
                    } else {
                        chrome.runtime.sendMessage({ type: 'FILE_ERROR', name: item.name });
                        currentIndex++;
                        setTimeout(processNext, 300);
                    }
                }
                setTimeout(checkForPDF, 500);
            } catch (error) {
                chrome.runtime.sendMessage({ type: 'FILE_ERROR', name: item.name });
                currentIndex++;
                setTimeout(processNext, 300);
            }
        }
        processNext();
    });
}

// ============================================================
// XÓA PHẦN ĐÓNG SIDEPANEL TỰ ĐỘNG (KHÔNG CẦN THIẾT)
// ============================================================
// Code cũ đã bị xóa để tránh lỗi sidePanel.close()